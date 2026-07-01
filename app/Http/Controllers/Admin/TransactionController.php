<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $perPage = (int) $request->get('per_page', 10);

        $transactions = Transaction::with(['cashier', 'customer'])
            ->when($search, fn ($q) => $q->where('transaction_number', 'like', "%{$search}%"))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest('transaction_date')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function show(Transaction $transaction): Response
    {
        $transaction->load(['cashier', 'customer', 'items.product', 'paymentMethod']);

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }
}
