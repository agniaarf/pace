<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@pace.test',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        UserProfile::updateOrCreate(
            ['user_id' => $admin->id],
            [
                'full_name' => 'PACE Administrator',
                'phone' => '081200000001',
                'employee_code' => 'ADM-001',
                'profile_type' => 'admin',
                'status' => 'active',
            ]
        );

        $kasir = User::updateOrCreate(
            ['username' => 'kasir'],
            [
                'email' => 'kasir@pace.test',
                'password' => Hash::make('password'),
                'role' => 'kasir',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        UserProfile::updateOrCreate(
            ['user_id' => $kasir->id],
            [
                'full_name' => 'Front Desk Cashier',
                'phone' => '081200000002',
                'employee_code' => 'KSR-001',
                'profile_type' => 'kasir',
                'status' => 'active',
            ]
        );
    }
}
