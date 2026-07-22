<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('transactions')
            ->whereNotNull('payment_method_id')
            ->orderBy('id')
            ->chunk(200, function ($transactions) {
                foreach ($transactions as $transaction) {
                    DB::table('transaction_payments')->insert([
                        'transaction_id' => $transaction->id,
                        'payment_method_id' => $transaction->payment_method_id,
                        'amount' => $transaction->amount_paid,
                        'reference_no' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            });
    }

    public function down(): void
    {
        DB::table('transaction_payments')->truncate();
    }
};
