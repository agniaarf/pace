<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $status = $request->get('status');

        $discounts = Discount::withCount('products')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Discounts/Index', [
            'discounts' => $discounts,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::enum(['percentage', 'nominal'])],
            'value' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', Rule::enum(['all', 'category', 'product'])],
            'target_ids' => ['nullable', 'array'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::enum(['active', 'inactive'])],
        ]);

        Discount::create($validated);

        return back()->with('success', 'Discount created successfully.');
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::enum(['percentage', 'nominal'])],
            'value' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', Rule::enum(['all', 'category', 'product'])],
            'target_ids' => ['nullable', 'array'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::enum(['active', 'inactive'])],
        ]);

        $discount->update($validated);

        return back()->with('success', 'Discount updated successfully.');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        $discount->delete();

        return back()->with('success', 'Discount deleted successfully.');
    }
}
