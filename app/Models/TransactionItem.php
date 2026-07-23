<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionItem extends Model
{
    protected $fillable = [
        'transaction_id',
        'variant_id',
        'quantity',
        'unit_price',
        'item_discount',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'item_discount' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function returnRequests(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function returnedQuantity(): int
    {
        return (int) $this->returnRequests()->whereIn('status', ['pending', 'approved'])->sum('quantity');
    }
}
