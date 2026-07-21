<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductVariantController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku' => ['nullable', 'string', 'max:100', 'unique:product_variants,sku'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:product_variants,barcode'],
            'price_adjustment' => ['nullable', 'numeric'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'minimum_quantity' => ['nullable', 'integer', 'min:0'],
        ]);

        $sku = $validated['sku'] ?? null;
        if (empty($sku)) {
            do {
                $sku = 'VAR-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (ProductVariant::where('sku', $sku)->exists());
        }

        $variant = $product->variants()->create([
            'size' => $validated['size'] ?? null,
            'color' => $validated['color'] ?? null,
            'sku' => $sku,
            'barcode' => $validated['barcode'] ?? null,
            'price_adjustment' => $validated['price_adjustment'] ?? 0,
            'status' => $validated['status'],
        ]);

        $variant->stock()->create([
            'quantity' => $validated['stock_quantity'] ?? 0,
            'minimum_quantity' => $validated['minimum_quantity'] ?? 0,
        ]);

        return back()->with('success', 'Varian berhasil ditambahkan.');
    }

    public function update(Request $request, ProductVariant $variant): RedirectResponse
    {
        $validated = $request->validate([
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku' => ['required', 'string', 'max:100', Rule::unique('product_variants', 'sku')->ignore($variant->id)],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('product_variants', 'barcode')->ignore($variant->id)],
            'price_adjustment' => ['nullable', 'numeric'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $variant->update($validated);

        return back()->with('success', 'Varian berhasil diperbarui.');
    }

    public function destroy(ProductVariant $variant): RedirectResponse
    {
        if ($variant->transactionItems()->exists()) {
            return back()->with('error', 'Varian tidak dapat dihapus karena memiliki riwayat transaksi. Nonaktifkan saja varian ini.');
        }

        if ($variant->product->variants()->count() <= 1) {
            return back()->with('error', 'Produk harus memiliki minimal 1 varian.');
        }

        $variant->delete();

        return back()->with('success', 'Varian berhasil dihapus.');
    }
}
