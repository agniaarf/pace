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
        $movements = StockMovement::with(['product', 'transaction'])
            ->orderBy('transaction_date', 'desc')
            ->get();

        $products = Product::all(['id', 'name']);

        return Inertia::render('Admin/StockMovements/Index', [
            'movements' => $movements,
            'products' => $products,
        ]);
    }
}
