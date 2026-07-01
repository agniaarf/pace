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
}
