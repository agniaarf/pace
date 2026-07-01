<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discount extends Model
{
    protected $fillable = [
        'name',
        'type',
        'value',
        'applies_to',
        'target_ids',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'target_ids' => 'array',
            'value' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
