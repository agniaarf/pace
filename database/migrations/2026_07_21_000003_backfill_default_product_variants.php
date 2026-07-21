<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $products = DB::table('products')->get();

        foreach ($products as $product) {
            $sku = $product->sku;
            if (empty($sku)) {
                do {
                    $sku = 'VAR-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                } while (DB::table('product_variants')->where('sku', $sku)->exists());
            }

            $variantId = DB::table('product_variants')->insertGetId([
                'product_id' => $product->id,
                'size' => $product->size,
                'color' => null,
                'sku' => $sku,
                'barcode' => null,
                'price_adjustment' => 0,
                'status' => $product->status,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('stock')->where('product_id', $product->id)->update(['variant_id' => $variantId]);
            DB::table('transaction_items')->where('product_id', $product->id)->update(['variant_id' => $variantId]);
            DB::table('stock_movements')->where('product_id', $product->id)->update(['variant_id' => $variantId]);
        }
    }

    public function down(): void
    {
        DB::table('product_variants')->truncate();
    }
};
