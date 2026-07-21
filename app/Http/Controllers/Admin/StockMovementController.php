<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $movements = StockMovement::with(['variant.product', 'transaction'])
            ->orderBy('transaction_date', 'desc')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'variant_id' => $m->variant_id,
                'product_id' => $m->variant->product_id,
                'stock_id' => $m->stock_id,
                'transaction_id' => $m->transaction_id,
                'movement_type' => $m->movement_type,
                'quantity_before' => $m->quantity_before,
                'quantity_after' => $m->quantity_after,
                'notes' => $m->notes,
                'transaction_date' => $m->transaction_date,
                'created_at' => $m->created_at,
                'product' => [
                    'id' => $m->variant->product->id,
                    'name' => $m->variant->product->name . ($m->variant->label() !== 'Default' ? ' (' . $m->variant->label() . ')' : ''),
                ],
                'transaction' => $m->transaction ? [
                    'id' => $m->transaction->id,
                    'transaction_number' => $m->transaction->transaction_number,
                ] : null,
            ]);

        $products = Product::all(['id', 'name']);

        return Inertia::render('Admin/StockMovements/Index', [
            'movements' => $movements,
            'products' => $products,
        ]);
    }
}
