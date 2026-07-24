<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Resolve the report's date range: an explicit from/to pair takes
     * precedence over the days-lookback shortcut used by the quick-select buttons.
     */
    private function resolveDateRange(Request $request): array
    {
        $days = (int) $request->get('days', 30);

        $from = $request->get('from')
            ? Carbon::parse($request->get('from'))->startOfDay()
            : now()->subDays($days)->startOfDay();

        $to = $request->get('to')
            ? Carbon::parse($request->get('to'))->endOfDay()
            : now()->endOfDay();

        return [$from, $to, $days];
    }

    public function index(Request $request): InertiaResponse
    {
        [$from, $to, $days] = $this->resolveDateRange($request);

        $baseQuery = fn () => Transaction::where('status', 'completed')
            ->whereBetween('transaction_date', [$from, $to]);

        $totalRevenue = $baseQuery()->sum('total_amount');
        $totalTransactions = $baseQuery()->count();
        $avgTransactionValue = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;

        $dailyRevenue = $baseQuery()
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
            ->join('product_variants', 'transaction_items.variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.transaction_date', [$from, $to])
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

        $peakHoursByHour = $baseQuery()
            ->selectRaw('HOUR(transaction_date) as hour, COUNT(*) as count, SUM(total_amount) as revenue')
            ->groupByRaw('HOUR(transaction_date)')
            ->get()
            ->keyBy('hour');
        $peakHours = collect(range(0, 23))->map(fn ($hour) => [
            'hour' => $hour,
            'count' => (int) ($peakHoursByHour[$hour]->count ?? 0),
            'revenue' => (float) ($peakHoursByHour[$hour]->revenue ?? 0),
        ]);

        $shiftPerformance = Shift::with('cashier')
            ->where('status', 'closed')
            ->whereBetween('opened_at', [$from, $to])
            ->withCount(['transactions' => fn ($q) => $q->where('status', 'completed')])
            ->withSum(['transactions' => fn ($q) => $q->where('status', 'completed')], 'total_amount')
            ->orderByDesc('opened_at')
            ->limit(20)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'cashier_name' => $s->cashier?->username ?? 'Unknown',
                'opened_at' => $s->opened_at,
                'closed_at' => $s->closed_at,
                'transaction_count' => $s->transactions_count,
                'total_revenue' => (float) ($s->transactions_sum_total_amount ?? 0),
                'variance' => (float) $s->variance,
            ]);

        return Inertia::render('Admin/Reports/Index', [
            'stats' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalTransactions' => $totalTransactions,
                'avgTransactionValue' => (float) $avgTransactionValue,
            ],
            'dailyRevenue' => $dailyRevenue,
            'topProducts' => $topProducts,
            'peakHours' => $peakHours,
            'shiftPerformance' => $shiftPerformance,
            'days' => $days,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->resolveDateRange($request);

        $transactions = Transaction::with(['cashier', 'customer', 'items'])
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$from, $to])
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
