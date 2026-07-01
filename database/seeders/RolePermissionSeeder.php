<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Module => list of actions
        $modules = [
            'dashboard' => ['view'],
            'products' => ['read', 'create', 'update', 'delete'],
            'categories' => ['read', 'create', 'update', 'delete'],
            'stock' => ['read', 'update'],
            'customers' => ['read', 'create', 'update', 'delete'],
            'transactions' => ['read', 'create', 'update', 'delete', 'process'],
            'discounts' => ['read', 'create', 'update', 'delete'],
            'users' => ['read', 'create', 'update', 'delete'],
            'reports' => ['view', 'export'],
            'settings' => ['view', 'update'],
            'master' => ['read', 'create', 'update', 'delete'],
        ];

        $permissionIds = [];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $slug = "{$module}.{$action}";
                $permission = Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::headline($module).' '.Str::headline($action),
                        'module' => $module,
                        'action' => $action,
                    ]
                );
                $permissionIds[$slug] = $permission->id;
            }
        }

        // Admin role: all permissions
        $admin = Role::updateOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Full system access', 'is_active' => true]
        );
        $admin->permissions()->sync(array_values($permissionIds));

        // Kasir role: point-of-sale focused permissions
        $kasirSlugs = [
            'dashboard.view',
            'transactions.read',
            'transactions.create',
            'transactions.process',
            'products.read',
            'customers.read',
            'customers.create',
            'reports.view',
        ];
        $kasir = Role::updateOrCreate(
            ['slug' => 'kasir'],
            ['name' => 'Cashier', 'description' => 'Point-of-sale operations', 'is_active' => true]
        );
        $kasir->permissions()->sync(
            collect($kasirSlugs)->map(fn ($s) => $permissionIds[$s])->all()
        );
    }
}
