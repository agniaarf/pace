<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::with(['category', 'stock'])
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
            'sku' => ['nullable', 'string', 'max:100', 'unique:products,sku'],
            'brand' => ['nullable', 'string', 'max:100'],
            'size' => ['nullable', 'string', 'max:50'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0', 'gt:cost_price'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'minimum_quantity' => ['nullable', 'integer', 'min:0'],
        ]);

        $stockData = [
            'quantity' => $validated['stock_quantity'] ?? 0,
            'minimum_quantity' => $validated['minimum_quantity'] ?? 0,
        ];
        unset($validated['stock_quantity'], $validated['minimum_quantity']);

        if (empty($validated['sku'])) {
            do {
                $validated['sku'] = 'PRD-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (Product::where('sku', $validated['sku'])->exists());
        }

        $product = Product::create($validated);
        $product->stock()->create($stockData);

        return back()->with('success', 'Produk berhasil dibuat.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product->id)],
            'brand' => ['nullable', 'string', 'max:100'],
            'size' => ['nullable', 'string', 'max:50'],
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
        if ($product->transactionItems()->exists()) {
            return back()->with('error', 'Produk tidak dapat dihapus karena memiliki riwayat transaksi. Nonaktifkan saja produk ini.');
        }

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
