<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_item_id')->constrained('transaction_items')->restrictOnDelete();
            $table->enum('type', ['refund', 'exchange', 'store_credit']);
            $table->integer('quantity');
            $table->boolean('restock')->default(true);
            $table->text('reason')->nullable();

            // Only used when type = exchange: the variant/quantity the customer wants instead.
            $table->foreignId('new_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->integer('new_quantity')->nullable();
            $table->foreignId('exchange_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();

            $table->decimal('refund_amount', 15, 2)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
