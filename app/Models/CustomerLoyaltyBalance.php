<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerLoyaltyBalance extends Model
{
    protected $fillable = [
        'customer_id',
        'outlet_id',
        'points_balance',
        'lifetime_points',
        'tier',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function recalculateTier(array $loyaltySettings): void
    {
        $this->tier = match (true) {
            $this->lifetime_points >= ($loyaltySettings['gold_threshold'] ?? PHP_INT_MAX) => 'gold',
            $this->lifetime_points >= ($loyaltySettings['silver_threshold'] ?? PHP_INT_MAX) => 'silver',
            default => 'bronze',
        };
    }
}
