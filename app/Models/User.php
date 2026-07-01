<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * The extended profile for this user (admin or kasir).
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Transactions processed by this user as cashier.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'cashier_id');
    }

    /**
     * The RBAC role record matching this user's role slug.
     */
    public function roleRecord(): ?Role
    {
        return Role::where('slug', $this->role)->first();
    }

    /**
     * Whether the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Whether the user is a cashier.
     */
    public function isKasir(): bool
    {
        return $this->role === 'kasir';
    }

    /**
     * All permission slugs granted to this user via their role.
     *
     * @return array<int, string>
     */
    public function permissionSlugs(): array
    {
        return Role::where('slug', $this->role)
            ->with('permissions:id,slug')
            ->first()
            ?->permissions
            ->pluck('slug')
            ->all() ?? [];
    }

    /**
     * Determine whether the user has a given permission.
     */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissionSlugs(), true);
    }

    /**
     * Determine whether the user has any of the given permissions.
     *
     * @param  array<int, string>  $permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        $granted = $this->permissionSlugs();

        foreach ($permissions as $permission) {
            if (in_array($permission, $granted, true)) {
                return true;
            }
        }

        return false;
    }
}
