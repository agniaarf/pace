<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_loyalty_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            // No outlets table exists yet (Multi-Outlet is a later sprint), so this is
            // an un-constrained placeholder id (1 = the single implicit outlet) rather
            // than a real FK. Balances are scoped per-outlet from day one so nothing
            // needs to be reshaped once real outlets exist.
            $table->unsignedBigInteger('outlet_id')->default(1);
            $table->unsignedInteger('points_balance')->default(0);
            $table->unsignedInteger('lifetime_points')->default(0);
            $table->enum('tier', ['bronze', 'silver', 'gold'])->default('bronze');
            $table->timestamps();

            $table->unique(['customer_id', 'outlet_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_loyalty_balances');
    }
};
