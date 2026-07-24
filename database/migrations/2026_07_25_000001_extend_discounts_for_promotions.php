<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Backfill target_ids for existing 'product'-scoped discounts from the
        // soon-to-be-dropped products.discount_id column, so nothing that was
        // working keeps working after the column is removed.
        $appliesToColumn = Schema::hasColumn('discounts', 'applies_to') ? 'applies_to' : 'target_type';
        $productDiscounts = DB::table('discounts')->where($appliesToColumn, 'product')->get(['id']);
        foreach ($productDiscounts as $discount) {
            $productIds = DB::table('products')->where('discount_id', $discount->id)->pluck('id');
            if ($productIds->isNotEmpty()) {
                DB::table('discounts')->where('id', $discount->id)->update([
                    'target_ids' => json_encode($productIds->values()),
                ]);
            }
        }

        // Use old-style CHANGE COLUMN (not RENAME COLUMN) for MariaDB < 10.5 compatibility.
        if (Schema::hasColumn('discounts', 'applies_to')) {
            DB::statement("ALTER TABLE discounts CHANGE applies_to target_type ENUM('all', 'category', 'product', 'variant') NOT NULL DEFAULT 'all'");
        }

        if (Schema::hasColumn('discounts', 'type')) {
            // Widen to VARCHAR first so the rename doesn't truncate the existing
            // 'nominal' value against the new enum's member list, then narrow
            // back to the final enum once the data itself has been migrated.
            DB::statement("ALTER TABLE discounts CHANGE type rule_type VARCHAR(20) NOT NULL DEFAULT 'percentage'");
            DB::table('discounts')->where('rule_type', 'nominal')->update(['rule_type' => 'fixed']);
            DB::statement("ALTER TABLE discounts CHANGE rule_type rule_type ENUM('percentage', 'fixed', 'buy_x_get_y', 'bundle') NOT NULL DEFAULT 'percentage'");
        }

        if (!Schema::hasColumn('discounts', 'min_qty')) {
            Schema::table('discounts', function (Blueprint $table) {
                $table->unsignedInteger('min_qty')->default(1)->after('value');
                $table->unsignedInteger('buy_quantity')->nullable()->after('min_qty');
                $table->unsignedInteger('get_quantity')->nullable()->after('buy_quantity');
                $table->decimal('get_discount_percent', 5, 2)->default(100)->after('get_quantity');
            });
        }

        // 'value' is unused for buy_x_get_y (that rule is driven entirely by
        // buy_quantity/get_quantity/get_discount_percent instead).
        DB::statement('ALTER TABLE discounts MODIFY value DECIMAL(15, 2) NULL');

        if (Schema::hasColumn('products', 'discount_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropForeign(['discount_id']);
                $table->dropColumn('discount_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('discount_id')->nullable()->constrained('discounts')->nullOnDelete();
        });

        Schema::table('discounts', function (Blueprint $table) {
            $table->dropColumn(['min_qty', 'buy_quantity', 'get_quantity', 'get_discount_percent']);
        });

        DB::statement("ALTER TABLE discounts CHANGE rule_type rule_type VARCHAR(20) NOT NULL DEFAULT 'percentage'");
        DB::table('discounts')->where('rule_type', 'fixed')->update(['rule_type' => 'nominal']);
        DB::statement("ALTER TABLE discounts CHANGE rule_type type ENUM('percentage', 'nominal') NOT NULL DEFAULT 'percentage'");
        DB::statement("ALTER TABLE discounts CHANGE target_type applies_to ENUM('all', 'category', 'product') NOT NULL DEFAULT 'all'");
    }
};
