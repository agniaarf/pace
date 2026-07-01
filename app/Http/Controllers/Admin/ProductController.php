<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Intervention\Image\ImageManager;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::with(['category', 'stock'])
            ->latest()
            ->get()
            ->map(fn ($p) => array_merge($p->toArray(), [
                'photo_url' => $p->photo ? Storage::disk('public')->url("products/{$p->photo}") : null,
            ]));

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
            'selling_price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['required', Rule::enum(['active', 'inactive'])],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'minimum_quantity' => ['nullable', 'integer', 'min:0'],
        ]);

        $stockData = [
            'quantity' => $validated['stock_quantity'] ?? 0,
            'minimum_quantity' => $validated['minimum_quantity'] ?? 0,
        ];
        unset($validated['stock_quantity'], $validated['minimum_quantity']);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $this->convertAndStorePhoto($request->file('photo'));
        } else {
            unset($validated['photo']);
        }

        $product = Product::create($validated);
        $product->stock()->create($stockData);

        return back()->with('success', 'Product created successfully.');
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
            'selling_price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['required', Rule::enum(['active', 'inactive'])],
        ]);

        if ($request->hasFile('photo')) {
            if ($product->photo) {
                Storage::disk('public')->delete("products/{$product->photo}");
            }
            $validated['photo'] = $this->convertAndStorePhoto($request->file('photo'));
        } else {
            unset($validated['photo']);
        }

        $product->update($validated);

        return back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->photo) {
            Storage::disk('public')->delete("products/{$product->photo}");
        }

        $product->delete();

        return back()->with('success', 'Product deleted successfully.');
    }

    private function convertAndStorePhoto($file): string
    {
        $manager = new ImageManager(new \Intervention\Image\Drivers\Gd\Driver());
        $image = $manager->read($file->getRealPath());

        $filename = uniqid('prod_', true) . '.webp';
        $path = storage_path("app/public/products/{$filename}");

        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $image->toWebp(85)->save($path);

        return $filename;
    }
}
