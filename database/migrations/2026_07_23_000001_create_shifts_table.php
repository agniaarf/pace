<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->decimal('opening_balance', 15, 2);
            $table->decimal('closing_balance_expected', 15, 2)->nullable();
            $table->decimal('closing_balance_actual', 15, 2)->nullable();
            $table->decimal('variance', 15, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Enforce "1 open shift per cashier" at the DB level: a generated column that
        // only carries a value while the shift is open, with a unique index on it.
        // Closed shifts collapse to NULL, and NULLs don't collide in a unique index.
        DB::statement("ALTER TABLE shifts ADD COLUMN open_cashier_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'open' THEN cashier_id ELSE NULL END) VIRTUAL");
        DB::statement('ALTER TABLE shifts ADD UNIQUE INDEX shifts_open_cashier_unique (open_cashier_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
