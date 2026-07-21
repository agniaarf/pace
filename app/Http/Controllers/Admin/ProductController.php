<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::with(['category', 'variants.stock'])
            ->latest()
            ->get();

        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'brand' => ['nullable', 'string', 'max:100'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0', 'gt:cost_price'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku' => ['nullable', 'string', 'max:100', 'unique:product_variants,sku'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:product_variants,barcode'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'minimum_quantity' => ['nullable', 'integer', 'min:0'],
        ]);

        $sku = $validated['sku'] ?? null;
        if (empty($sku)) {
            do {
                $sku = 'VAR-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (ProductVariant::where('sku', $sku)->exists());
        }

        $product = Product::create([
            'category_id' => $validated['category_id'] ?? null,
            'name' => $validated['name'],
            'brand' => $validated['brand'] ?? null,
            'cost_price' => $validated['cost_price'],
            'selling_price' => $validated['selling_price'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        $variant = $product->variants()->create([
            'size' => $validated['size'] ?? null,
            'color' => $validated['color'] ?? null,
            'sku' => $sku,
            'barcode' => $validated['barcode'] ?? null,
            'price_adjustment' => 0,
            'status' => $validated['status'],
        ]);

        $variant->stock()->create([
            'quantity' => $validated['stock_quantity'] ?? 0,
            'minimum_quantity' => $validated['minimum_quantity'] ?? 0,
        ]);

        return back()->with('success', 'Produk berhasil dibuat.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'brand' => ['nullable', 'string', 'max:100'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0', 'gt:cost_price'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $product->update($validated);

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $hasSales = $product->variants()->whereHas('transactionItems')->exists();

        if ($hasSales) {
            return back()->with('error', 'Produk tidak dapat dihapus karena memiliki riwayat transaksi. Nonaktifkan saja produk ini.');
        }

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
