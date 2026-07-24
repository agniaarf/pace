<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'member_code',
        'full_name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'province',
        'city',
        'address',
        'status',
        'total_purchases',
        'total_spent',
        'join_date',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'join_date' => 'date',
            'total_spent' => 'decimal:2',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function loyaltyBalances(): HasMany
    {
        return $this->hasMany(CustomerLoyaltyBalance::class);
    }

    /**
     * The default (and, until Multi-Outlet ships, only) outlet's loyalty balance.
     * Always returns a persisted row -- creates one on first access.
     */
    public function loyaltyBalance(int $outletId = 1): CustomerLoyaltyBalance
    {
        return $this->loyaltyBalances()->firstOrCreate(['outlet_id' => $outletId]);
    }
}
