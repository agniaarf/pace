<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(Request $request): Response
    {
        $discounts = Discount::withCount('products')
            ->latest()
            ->get();

        $products = Product::orderBy('name')->get(['id', 'name', 'sku', 'brand']);

        return Inertia::render('Admin/Discounts/Index', [
            'discounts' => $discounts,
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::in(['percentage', 'nominal'])],
            'value' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', Rule::in(['all', 'product'])],
            'target_ids' => ['nullable', 'array'],
            'target_ids.*' => ['integer', 'exists:products,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $discount = Discount::create($validated);

        $this->syncProductDiscounts($discount, $validated['target_ids'] ?? []);

        return back()->with('success', 'Diskon berhasil dibuat.');
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::in(['percentage', 'nominal'])],
            'value' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', Rule::in(['all', 'product'])],
            'target_ids' => ['nullable', 'array'],
            'target_ids.*' => ['integer', 'exists:products,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $discount->update($validated);

        $this->syncProductDiscounts($discount, $validated['target_ids'] ?? []);

        return back()->with('success', 'Diskon berhasil diperbarui.');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        Product::where('discount_id', $discount->id)->update(['discount_id' => null]);

        $discount->delete();

        return back()->with('success', 'Diskon berhasil dihapus.');
    }

    private function syncProductDiscounts(Discount $discount, ?array $targetIds = null): void
    {
        Product::where('discount_id', $discount->id)->update(['discount_id' => null]);

        $ids = $targetIds ?? $discount->target_ids ?? [];

        if ($discount->applies_to === 'all') {
            Product::query()->update(['discount_id' => $discount->id]);
        } elseif ($discount->applies_to === 'product' && !empty($ids)) {
            Product::whereIn('id', $ids)->update(['discount_id' => $discount->id]);
        }
    }
}
