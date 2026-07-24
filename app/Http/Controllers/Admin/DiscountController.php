<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Discount;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(Request $request): Response
    {
        $discounts = Discount::latest()->get();

        return Inertia::render('Admin/Discounts/Index', [
            'discounts' => $discounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateDiscount($request);

        $discount = Discount::create($validated);
        $discount->target_ids = $this->filterTargetIds($discount->target_type, $request->input('target_ids', []));
        $discount->save();

        return back()->with('success', 'Diskon berhasil dibuat.');
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $this->validateDiscount($request);

        $discount->update($validated);
        $discount->target_ids = $this->filterTargetIds($discount->target_type, $request->input('target_ids', []));
        $discount->save();

        return back()->with('success', 'Diskon berhasil diperbarui.');
    }

    public function targets(Discount $discount): Response
    {
        $options = match ($discount->target_type) {
            'category' => Category::orderBy('name')->get(['id', 'name'])
                ->map(fn ($c) => ['id' => $c->id, 'label' => $c->name]),
            'product' => Product::orderBy('name')->get(['id', 'name', 'sku', 'brand'])
                ->map(fn ($p) => ['id' => $p->id, 'label' => $p->name, 'sub' => trim(($p->sku ?? '') . ' · ' . ($p->brand ?? ''), ' ·')]),
            'variant' => ProductVariant::with('product')->orderBy('sku')->get()
                ->map(fn ($v) => ['id' => $v->id, 'label' => $v->product->name . ' — ' . $v->label(), 'sub' => $v->sku]),
            default => collect(),
        };

        return Inertia::render('Admin/Discounts/Targets', [
            'discount' => $discount,
            'options' => $options->values(),
        ]);
    }

    public function syncTargets(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $request->validate([
            'target_ids' => ['nullable', 'array'],
            'target_ids.*' => ['integer'],
        ]);

        $discount->target_ids = $this->filterTargetIds($discount->target_type, $validated['target_ids'] ?? []);
        $discount->save();

        return back()->with('success', 'Target diskon berhasil diperbarui.');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        $discount->delete();

        return back()->with('success', 'Diskon berhasil dihapus.');
    }

    private function validateDiscount(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'rule_type' => ['required', Rule::in(['percentage', 'fixed', 'buy_x_get_y', 'bundle'])],
            'value' => ['required_unless:rule_type,buy_x_get_y', 'nullable', 'numeric', 'min:0'],
            'target_type' => ['required', Rule::in(['all', 'category', 'product', 'variant'])],
            'min_qty' => ['nullable', 'integer', 'min:1'],
            'buy_quantity' => ['required_if:rule_type,buy_x_get_y', 'nullable', 'integer', 'min:1'],
            'get_quantity' => ['required_if:rule_type,buy_x_get_y', 'nullable', 'integer', 'min:1'],
            'get_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }

    private function filterTargetIds(string $targetType, array $ids): ?array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));

        if ($targetType === 'all' || empty($ids)) {
            return null;
        }

        $validIds = match ($targetType) {
            'category' => Category::whereIn('id', $ids)->pluck('id'),
            'product' => Product::whereIn('id', $ids)->pluck('id'),
            'variant' => ProductVariant::whereIn('id', $ids)->pluck('id'),
            default => collect(),
        };

        return $validIds->isEmpty() ? null : $validIds->values()->all();
    }
}
