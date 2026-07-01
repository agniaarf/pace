<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function adminDashboard(Request $request): Response
    {
        $totalRevenue = (float) Transaction::where('status', 'completed')->sum('total_amount');
        $todayRevenue = (float) Transaction::where('status', 'completed')->whereDate('transaction_date', today())->sum('total_amount');

        $recentTransactions = Transaction::with(['cashier', 'customer'])
            ->latest('transaction_date')
            ->limit(5)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'transaction_number' => $t->transaction_number,
                'transaction_date' => $t->transaction_date,
                'total_amount' => (float) $t->total_amount,
                'status' => $t->status,
                'cashier_name' => $t->cashier?->username,
                'customer_name' => $t->customer?->full_name,
            ]);

        $dailyRevenue = Transaction::where('status', 'completed')
            ->whereDate('transaction_date', '>=', now()->subDays(7))
            ->selectRaw('DATE(transaction_date) as date, SUM(total_amount) as revenue, COUNT(*) as count')
            ->groupByRaw('DATE(transaction_date)')
            ->orderByRaw('DATE(transaction_date)')
            ->get()
            ->map(fn ($r) => [
                'date' => $r->date,
                'revenue' => (float) $r->revenue,
                'count' => $r->count,
            ]);

        $lowStockItems = Stock::with('product')
            ->whereColumn('quantity', '<=', 'minimum_quantity')
            ->orWhere('quantity', '<=', 0)
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'product_name' => $s->product->name,
                'quantity' => $s->quantity,
                'minimum_quantity' => $s->minimum_quantity,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalProducts' => Product::count(),
                'totalCustomers' => Customer::count(),
                'totalTransactions' => Transaction::count(),
                'lowStockCount' => Stock::where('quantity', '<=', 5)->count(),
                'totalRevenue' => $totalRevenue,
                'todayRevenue' => $todayRevenue,
            ],
            'recentTransactions' => $recentTransactions,
            'dailyRevenue' => $dailyRevenue,
            'lowStockItems' => $lowStockItems,
        ]);
    }

    public function kasirDashboard(Request $request): Response
    {
        $cashierId = $request->user()->id;

        return Inertia::render('Kasir/Dashboard', [
            'stats' => [
                'todayTransactions' => Transaction::where('cashier_id', $cashierId)->whereDate('created_at', today())->count(),
                'todayRevenue' => (float) Transaction::where('cashier_id', $cashierId)->whereDate('created_at', today())->sum('total_amount'),
                'totalProducts' => Product::count(),
                'availableProducts' => Product::whereHas('stock', function ($q) {
                    $q->where('quantity', '>', 0);
                })->count(),
            ],
        ]);
    }
}
