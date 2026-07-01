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
        $transactions = Transaction::with(['cashier', 'customer'])
            ->latest('transaction_date')
            ->get();

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
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
