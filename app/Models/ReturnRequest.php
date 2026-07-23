<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnRequest extends Model
{
    protected $fillable = [
        'transaction_item_id',
        'type',
        'quantity',
        'restock',
        'reason',
        'new_variant_id',
        'new_quantity',
        'exchange_transaction_id',
        'refund_amount',
        'status',
        'requested_by',
        'approved_by',
        'approved_at',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'restock' => 'boolean',
            'refund_amount' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function transactionItem(): BelongsTo
    {
        return $this->belongsTo(TransactionItem::class);
    }

    public function newVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'new_variant_id');
    }

    public function exchangeTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'exchange_transaction_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
