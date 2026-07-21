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
        $transactions = Transaction::with(['cashier', 'customer', 'items.variant.product', 'paymentMethod'])
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'transaction_number' => $t->transaction_number,
                'created_at' => $t->created_at,
                'total_amount' => (float) $t->total_amount,
                'status' => $t->status,
                'customer_name' => $t->customer?->full_name ?? 'Guest',
                'cashier_name' => $t->cashier?->username ?? '—',
                'payment_method_code' => $t->paymentMethod?->code ?? 'cash',
                'payment_method_label' => $t->paymentMethod?->label ?? 'Tunai',
                'item_count' => $t->items->count(),
                'items' => $t->items->map(fn ($item) => [
                    'name' => $item->variant->product->name . ($item->variant->label() !== 'Default' ? ' (' . $item->variant->label() . ')' : ''),
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                ]),
                'subtotal' => (float) $t->subtotal,
                'discount_amount' => (float) $t->discount_amount,
                'tax_amount' => (float) $t->tax_amount,
                'amount_paid' => (float) $t->amount_paid,
                'change_amount' => (float) $t->change_amount,
            ]);

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
        ]);
    }

    public function show(Transaction $transaction): Response
    {
        $transaction->load(['cashier', 'customer', 'items.variant.product', 'paymentMethod']);

        $data = $transaction->toArray();
        $data['items'] = $transaction->items->map(fn ($item) => [
            'id' => $item->id,
            'quantity' => $item->quantity,
            'unit_price' => $item->unit_price,
            'item_discount' => $item->item_discount,
            'subtotal' => $item->subtotal,
            'product' => [
                'id' => $item->variant->product->id,
                'name' => $item->variant->product->name . ($item->variant->label() !== 'Default' ? ' (' . $item->variant->label() . ')' : ''),
                'sku' => $item->variant->sku,
            ],
        ]);

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $data,
        ]);
    }
}
