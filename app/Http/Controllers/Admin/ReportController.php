<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $days = (int) $request->get('days', 30);

        $totalRevenue = Transaction::where('status', 'completed')
            ->whereDate('transaction_date', '>=', now()->subDays($days))
            ->sum('total_amount');

        $totalTransactions = Transaction::where('status', 'completed')
            ->whereDate('transaction_date', '>=', now()->subDays($days))
            ->count();

        $avgTransactionValue = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;

        $dailyRevenue = Transaction::where('status', 'completed')
            ->whereDate('transaction_date', '>=', now()->subDays($days))
            ->selectRaw('DATE(transaction_date) as date, SUM(total_amount) as revenue, COUNT(*) as count')
            ->groupByRaw('DATE(transaction_date)')
            ->orderByRaw('DATE(transaction_date)')
            ->get()
            ->map(fn ($r) => [
                'date' => $r->date,
                'revenue' => (float) $r->revenue,
                'count' => $r->count,
            ]);

        $topProducts = Transaction::join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->join('products', 'transaction_items.product_id', '=', 'products.id')
            ->where('transactions.status', 'completed')
            ->whereDate('transactions.transaction_date', '>=', now()->subDays($days))
            ->selectRaw('products.name, SUM(transaction_items.quantity) as total_sold, SUM(transaction_items.subtotal) as total_revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'total_sold' => (int) $r->total_sold,
                'total_revenue' => (float) $r->total_revenue,
            ]);

        return Inertia::render('Admin/Reports/Index', [
            'stats' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalTransactions' => $totalTransactions,
                'avgTransactionValue' => (float) $avgTransactionValue,
            ],
            'dailyRevenue' => $dailyRevenue,
            'topProducts' => $topProducts,
            'days' => $days,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $days = (int) $request->get('days', 30);

        $transactions = Transaction::with(['cashier', 'customer', 'items.product'])
            ->where('status', 'completed')
            ->whereDate('transaction_date', '>=', now()->subDays($days))
            ->orderByDesc('transaction_date')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="pace-report-' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Transaction Number', 'Date', 'Cashier', 'Customer', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment Method']);

            foreach ($transactions as $tx) {
                fputcsv($handle, [
                    $tx->transaction_number,
                    $tx->transaction_date,
                    $tx->cashier?->username ?? 'Unknown',
                    $tx->customer?->full_name ?? 'Walk-in',
                    $tx->items->count(),
                    $tx->subtotal,
                    $tx->discount_amount,
                    $tx->tax_amount,
                    $tx->total_amount,
                    $tx->paymentMethod?->label ?? 'N/A',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
