<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $transaction = null;

        if ($request->filled('transaction_number')) {
            $found = Transaction::with('items.variant.product')
                ->where('transaction_number', trim($request->string('transaction_number')))
                ->where('status', 'completed')
                ->first();

            if ($found) {
                $transaction = [
                    'id' => $found->id,
                    'transaction_number' => $found->transaction_number,
                    'transaction_date' => $found->transaction_date,
                    'items' => $found->items->map(fn (TransactionItem $item) => [
                        'id' => $item->id,
                        'name' => $item->variant->product->name . ($item->variant->label() !== 'Default' ? ' (' . $item->variant->label() . ')' : ''),
                        'quantity' => $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'returned_quantity' => $item->returnedQuantity(),
                        'remaining_quantity' => $item->quantity - $item->returnedQuantity(),
                    ]),
                ];
            }
        }

        $variants = ProductVariant::with(['product', 'stock'])
            ->where('status', 'active')
            ->whereHas('product', fn ($q) => $q->where('status', 'active'))
            ->orderBy('sku')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->product->name,
                'variant_label' => $v->label(),
                'selling_price' => $v->sellingPrice(),
                'stock' => $v->stock?->quantity ?? 0,
            ]);

        $myReturns = ReturnRequest::with(['transactionItem.variant.product', 'transactionItem.transaction'])
            ->where('requested_by', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (ReturnRequest $r) => [
                'id' => $r->id,
                'transaction_number' => $r->transactionItem->transaction->transaction_number,
                'item_name' => $r->transactionItem->variant->product->name,
                'type' => $r->type,
                'quantity' => $r->quantity,
                'status' => $r->status,
                'refund_amount' => $r->refund_amount !== null ? (float) $r->refund_amount : null,
                'created_at' => $r->created_at,
            ]);

        return Inertia::render('Kasir/Returns/Index', [
            'transaction' => $transaction,
            'searchedNumber' => $request->get('transaction_number'),
            'variants' => $variants,
            'myReturns' => $myReturns,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transaction_item_id' => ['required', 'exists:transaction_items,id'],
            'type' => ['required', Rule::in(['refund', 'exchange', 'store_credit'])],
            'quantity' => ['required', 'integer', 'min:1'],
            'restock' => ['required', 'boolean'],
            'reason' => ['nullable', 'string'],
            'new_variant_id' => ['required_if:type,exchange', 'nullable', 'exists:product_variants,id'],
            'new_quantity' => ['required_if:type,exchange', 'nullable', 'integer', 'min:1'],
        ]);

        $item = TransactionItem::with('transaction')->findOrFail($validated['transaction_item_id']);

        if ($item->transaction->status !== 'completed') {
            return back()->with('error', 'Transaksi ini tidak valid untuk retur.');
        }

        $remaining = $item->quantity - $item->returnedQuantity();

        if ($validated['quantity'] > $remaining) {
            return back()->with('error', "Jumlah retur melebihi sisa yang dapat diretur ({$remaining}).");
        }

        ReturnRequest::create([
            'transaction_item_id' => $item->id,
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'restock' => $validated['restock'],
            'reason' => $validated['reason'] ?? null,
            'new_variant_id' => $validated['new_variant_id'] ?? null,
            'new_quantity' => $validated['new_quantity'] ?? null,
            'status' => 'pending',
            'requested_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Permintaan retur berhasil diajukan, menunggu persetujuan admin.');
    }
}
