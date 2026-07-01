<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function adminDashboard(Request $request): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalProducts' => \App\Models\Product::count(),
                'totalCustomers' => \App\Models\Customer::count(),
                'totalTransactions' => \App\Models\Transaction::count(),
                'lowStockCount' => \App\Models\Stock::where('quantity', '<=', 5)->count(),
            ],
        ]);
    }

    public function kasirDashboard(Request $request): Response
    {
        return Inertia::render('Kasir/Dashboard', [
            'stats' => [
                'todayTransactions' => \App\Models\Transaction::whereDate('created_at', today())->count(),
                'todayRevenue' => (float) \App\Models\Transaction::whereDate('created_at', today())->sum('total_amount'),
                'totalProducts' => \App\Models\Product::count(),
                'availableProducts' => \App\Models\Product::whereHas('stock', function ($q) {
                    $q->where('quantity', '>', 0);
                })->count(),
            ],
        ]);
    }
}
