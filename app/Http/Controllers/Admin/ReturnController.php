<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->get('status', 'pending');

        $returns = ReturnRequest::with([
                'transactionItem.variant.product',
                'transactionItem.transaction.customer',
                'newVariant.product',
                'requestedBy',
                'approvedBy',
            ])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()
            ->get()
            ->map(fn (ReturnRequest $r) => [
                'id' => $r->id,
                'transaction_number' => $r->transactionItem->transaction->transaction_number,
                'customer_name' => $r->transactionItem->transaction->customer?->full_name ?? 'Guest',
                'item_name' => $r->transactionItem->variant->product->name . ($r->transactionItem->variant->label() !== 'Default' ? ' (' . $r->transactionItem->variant->label() . ')' : ''),
                'type' => $r->type,
                'quantity' => $r->quantity,
                'unit_price' => (float) $r->transactionItem->unit_price,
                'restock' => $r->restock,
                'reason' => $r->reason,
                'new_item_name' => $r->newVariant ? $r->newVariant->product->name . ($r->newVariant->label() !== 'Default' ? ' (' . $r->newVariant->label() . ')' : '') : null,
                'new_quantity' => $r->new_quantity,
                'status' => $r->status,
                'refund_amount' => $r->refund_amount !== null ? (float) $r->refund_amount : null,
                'requested_by' => $r->requestedBy?->username,
                'approved_by' => $r->approvedBy?->username,
                'admin_notes' => $r->admin_notes,
                'created_at' => $r->created_at,
            ]);

        return Inertia::render('Admin/Returns/Index', [
            'returns' => $returns,
            'status' => $status,
        ]);
    }

    public function approve(Request $request, ReturnRequest $return): RedirectResponse
    {
        if ($return->status !== 'pending') {
            return back()->with('error', 'Retur ini sudah diproses sebelumnya.');
        }

        try {
            DB::transaction(function () use ($request, $return) {
                $item = TransactionItem::with('variant.stock')->findOrFail($return->transaction_item_id);
                $refundAmount = $return->quantity * (float) $item->unit_price;

                if ($return->restock) {
                    $this->restock($item->variant_id, $return->quantity, "Return #{$return->id} restock", $item->transaction_id);
                }

                $exchangeTransactionId = null;

                if ($return->type === 'exchange') {
                    $exchangeTransactionId = $this->createExchangeTransaction($return, $item);
                }

                $return->update([
                    'status' => 'approved',
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                    'refund_amount' => $refundAmount,
                    'exchange_transaction_id' => $exchangeTransactionId,
                ]);
            });
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Retur #{$return->id} berhasil disetujui.");
    }

    public function reject(Request $request, ReturnRequest $return): RedirectResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string'],
        ]);

        if ($return->status !== 'pending') {
            return back()->with('error', 'Retur ini sudah diproses sebelumnya.');
        }

        $return->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'admin_notes' => $validated['admin_notes'] ?? null,
        ]);

        return back()->with('success', "Retur #{$return->id} ditolak.");
    }

    private function restock(int $variantId, int $quantity, string $note, int $transactionId): void
    {
        $stock = Stock::where('variant_id', $variantId)->first();

        if (!$stock) {
            throw new \RuntimeException('Data stok untuk varian ini tidak ditemukan.');
        }

        $before = $stock->quantity;
        $stock->quantity += $quantity;
        $stock->save();

        StockMovement::create([
            'variant_id' => $variantId,
            'stock_id' => $stock->id,
            'transaction_id' => $transactionId,
            'movement_type' => 'in',
            'quantity_before' => $before,
            'quantity_after' => $stock->quantity,
            'notes' => $note,
            'transaction_date' => now(),
        ]);
    }

    private function createExchangeTransaction(ReturnRequest $return, TransactionItem $originalItem): int
    {
        $newVariant = ProductVariant::with(['stock', 'product'])->findOrFail($return->new_variant_id);
        $newStock = $newVariant->stock;

        if (!$newStock || $newStock->quantity < $return->new_quantity) {
            throw new \RuntimeException("Stok varian pengganti ({$newVariant->product->name}) tidak mencukupi.");
        }

        $unitPrice = $newVariant->sellingPrice();
        $lineTotal = $unitPrice * $return->new_quantity;
        $taxAmount = round($lineTotal * 0.11);
        $totalAmount = $lineTotal + $taxAmount;

        $originalTransaction = $originalItem->transaction;

        $txNumber = 'TRX-' . now()->format('ymd') . '-' . str_pad(
            Transaction::whereDate('created_at', today())->count() + 1, 3, '0', STR_PAD_LEFT
        );

        $exchangeTx = Transaction::create([
            'transaction_number' => $txNumber,
            'cashier_id' => $return->requested_by,
            'shift_id' => null,
            'customer_id' => $originalTransaction->customer_id,
            'payment_method_id' => null,
            'transaction_date' => now(),
            'status' => 'completed',
            'notes' => "Exchange for return #{$return->id} (original transaction {$originalTransaction->transaction_number})",
            'subtotal' => $lineTotal,
            'discount_amount' => 0,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'amount_paid' => $totalAmount,
            'change_amount' => 0,
        ]);

        TransactionItem::create([
            'transaction_id' => $exchangeTx->id,
            'variant_id' => $newVariant->id,
            'quantity' => $return->new_quantity,
            'unit_price' => $unitPrice,
            'item_discount' => 0,
            'subtotal' => $lineTotal,
        ]);

        $before = $newStock->quantity;
        $newStock->quantity -= $return->new_quantity;
        $newStock->save();

        StockMovement::create([
            'variant_id' => $newVariant->id,
            'stock_id' => $newStock->id,
            'transaction_id' => $exchangeTx->id,
            'movement_type' => 'out',
            'quantity_before' => $before,
            'quantity_after' => $newStock->quantity,
            'notes' => "Exchange for return #{$return->id}",
            'transaction_date' => now(),
        ]);

        return $exchangeTx->id;
    }
}
