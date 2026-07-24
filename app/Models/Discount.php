<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'name',
        'rule_type',
        'value',
        'target_type',
        'target_ids',
        'min_qty',
        'buy_quantity',
        'get_quantity',
        'get_discount_percent',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'target_ids' => 'array',
            'value' => 'decimal:2',
            'get_discount_percent' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }
}
