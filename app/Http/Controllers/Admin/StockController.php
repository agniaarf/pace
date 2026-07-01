<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $filter = $request->get('filter');

        $stocks = Stock::with('product.category')
            ->whereHas('product', function ($q) use ($search) {
                $q->when($search, fn ($sq) => $sq->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
            })
            ->when($filter === 'low', fn ($q) => $q->whereColumn('quantity', '<=', 'minimum_quantity'))
            ->when($filter === 'out', fn ($q) => $q->where('quantity', '<=', 0))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Stock/Index', [
            'stocks' => $stocks,
            'filters' => $request->only(['search', 'filter']),
        ]);
    }

    public function adjust(Request $request, Stock $stock): RedirectResponse
    {
        $validated = $request->validate([
            'adjustment_type' => ['required', 'in:add,subtract,set'],
            'quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $before = $stock->quantity;

        match ($validated['adjustment_type']) {
            'add' => $stock->quantity += $validated['quantity'],
            'subtract' => $stock->quantity = max(0, $stock->quantity - $validated['quantity']),
            'set' => $stock->quantity = $validated['quantity'],
        };

        $stock->save();

        StockMovement::create([
            'product_id' => $stock->product_id,
            'stock_id' => $stock->id,
            'movement_type' => $validated['adjustment_type'] === 'subtract' ? 'out' : 'in',
            'quantity_before' => $before,
            'quantity_after' => $stock->quantity,
            'notes' => $validated['notes'] ?? 'Manual adjustment by admin',
            'transaction_date' => now(),
        ]);

        return back()->with('success', 'Stock adjusted successfully.');
    }
}
