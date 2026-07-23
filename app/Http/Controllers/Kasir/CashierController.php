<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\AppMaster;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\ProductVariant;
use App\Models\Shift;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CashierController extends Controller
{
    public function index(): Response
    {
        $variants = ProductVariant::with(['product.category', 'product.discount', 'stock'])
            ->where('status', 'active')
            ->whereHas('product', fn ($q) => $q->where('status', 'active'))
            ->orderBy('sku')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->product->name,
                'variant_label' => $v->label(),
                'sku' => $v->sku,
                'barcode' => $v->barcode,
                'brand' => $v->product->brand,
                'selling_price' => $v->sellingPrice(),
                'stock' => $v->stock?->quantity ?? 0,
                'category' => $v->product->category?->name,
                'discount' => $v->product->discount ? [
                    'id' => $v->product->discount->id,
                    'name' => $v->product->discount->name,
                    'type' => $v->product->discount->type,
                    'value' => (float) $v->product->discount->value,
                ] : null,
            ]);

        $customers = Customer::where('status', 'active')
            ->orderBy('full_name')
            ->get(['id', 'member_code', 'full_name', 'phone', 'email']);

        $paymentMethods = AppMaster::where('type', 'payment_method')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'label']);

        $activeDiscounts = Discount::where('status', 'active')
            ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', today()))
            ->get(['id', 'name', 'type', 'value', 'applies_to', 'target_ids']);

        return Inertia::render('Kasir/Cashier', [
            'products' => $variants,
            'customers' => $customers,
            'paymentMethods' => $paymentMethods,
            'activeDiscounts' => $activeDiscounts,
        ]);
    }

    public function history(Request $request): Response
    {
        $cashierId = $request->user()->id;

        $transactions = Transaction::with(['customer', 'items.variant.product', 'paymentMethod', 'payments.paymentMethod'])
            ->where('cashier_id', $cashierId)
            ->latest('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'transaction_number' => $t->transaction_number,
                'created_at' => $t->created_at,
                'total_amount' => (float) $t->total_amount,
                'status' => $t->status,
                'customer_name' => $t->customer?->full_name ?? 'Guest',
                'payment_method_code' => $t->paymentMethod?->code ?? 'cash',
                'payment_method_label' => $t->paymentMethod?->label ?? 'Tunai',
                'payments' => $t->payments->map(fn ($p) => [
                    'method_label' => $p->paymentMethod?->label ?? 'Tunai',
                    'amount' => (float) $p->amount,
                    'reference_no' => $p->reference_no,
                ]),
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

        return Inertia::render('Kasir/Transactions', [
            'transactions' => $transactions,
        ]);
    }

    public function customers(): Response
    {
        $customers = Customer::where('status', 'active')
            ->orderBy('full_name')
            ->get(['id', 'member_code', 'full_name', 'phone', 'email', 'total_purchases', 'total_spent', 'created_at'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'member_code' => $c->member_code,
                'full_name' => $c->full_name,
                'phone' => $c->phone,
                'email' => $c->email,
                'total_purchases' => $c->total_purchases ?? 0,
                'total_spent' => (float) ($c->total_spent ?? 0),
                'created_at' => $c->created_at,
            ]);

        return Inertia::render('Kasir/Customers', [
            'customers' => $customers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.payment_method_id' => ['required', 'exists:app_master,id'],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01'],
            'payments.*.reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $activeShift = Shift::where('cashier_id', $request->user()->id)->where('status', 'open')->first();

        if (config('pace.require_shift') && !$activeShift) {
            return back()->with('error', 'Anda harus membuka shift terlebih dahulu sebelum membuat transaksi.');
        }

        return DB::transaction(function () use ($validated, $request, $activeShift) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $variant = ProductVariant::with('stock')->findOrFail($item['variant_id']);
                $stock = $variant->stock;

                if (!$stock || $stock->quantity < $item['quantity']) {
                    return back()->with('error', "Stok tidak mencukupi untuk {$variant->product->name}.");
                }

                $lineTotal = $item['unit_price'] * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'item_discount' => 0,
                    'subtotal' => $lineTotal,
                ];
            }

            $discountAmount = 0;
            $activeDiscounts = Discount::where('status', 'active')
                ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', today()))
                ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', today()))
                ->get();

            $variantProductMap = ProductVariant::whereIn('id', collect($itemsData)->pluck('variant_id'))
                ->pluck('product_id', 'id');

            foreach ($activeDiscounts as $discount) {
                if ($discount->applies_to === 'all') {
                    $base = $subtotal;
                } elseif ($discount->applies_to === 'product') {
                    $targetIds = $discount->target_ids ?? [];
                    $base = collect($itemsData)
                        ->filter(fn ($i) => in_array($variantProductMap[$i['variant_id']] ?? null, $targetIds))
                        ->sum('subtotal');
                } else {
                    $base = 0;
                }

                if ($base > 0) {
                    $discountAmount += $discount->type === 'percentage'
                        ? round($base * $discount->value / 100)
                        : min($discount->value, $base);
                }
            }

            $afterDiscount = $subtotal - $discountAmount;
            $taxAmount = round($afterDiscount * 0.11);
            $totalAmount = $afterDiscount + $taxAmount;

            $totalPaid = collect($validated['payments'])->sum('amount');

            if ($totalPaid < $totalAmount) {
                return back()->with('error', 'Total pembayaran belum mencukupi total transaksi.');
            }

            $changeAmount = $totalPaid - $totalAmount;

            $txNumber = 'TRX-' . now()->format('ymd') . '-' . str_pad(
                Transaction::whereDate('created_at', today())->count() + 1, 3, '0', STR_PAD_LEFT
            );

            $transaction = Transaction::create([
                'transaction_number' => $txNumber,
                'cashier_id' => $request->user()->id,
                'shift_id' => $activeShift?->id,
                'customer_id' => $validated['customer_id'],
                'payment_method_id' => $validated['payments'][0]['payment_method_id'],
                'transaction_date' => now(),
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'amount_paid' => $totalPaid,
                'change_amount' => max(0, $changeAmount),
            ]);

            foreach ($validated['payments'] as $payment) {
                TransactionPayment::create([
                    'transaction_id' => $transaction->id,
                    'payment_method_id' => $payment['payment_method_id'],
                    'amount' => $payment['amount'],
                    'reference_no' => $payment['reference_no'] ?? null,
                ]);
            }

            foreach ($itemsData as $item) {
                $item['transaction_id'] = $transaction->id;
                TransactionItem::create($item);

                $stock = Stock::where('variant_id', $item['variant_id'])->first();
                $before = $stock->quantity;
                $stock->quantity -= $item['quantity'];
                $stock->save();

                StockMovement::create([
                    'variant_id' => $item['variant_id'],
                    'stock_id' => $stock->id,
                    'transaction_id' => $transaction->id,
                    'movement_type' => 'out',
                    'quantity_before' => $before,
                    'quantity_after' => $stock->quantity,
                    'notes' => "Sale {$txNumber}",
                    'transaction_date' => now(),
                ]);
            }

            if ($validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                $customer->increment('total_purchases');
                $customer->increment('total_spent', $totalAmount);
            }

            $transaction->load(['items.variant.product', 'payments.paymentMethod']);

            $paymentMethodLabel = $transaction->payments->first()?->paymentMethod?->label ?? 'Tunai';
            $customerName = $validated['customer_id'] ? Customer::where('id', $validated['customer_id'])->value('full_name') : null;

            return back()->with('success', "Transaksi {$txNumber} berhasil diselesaikan.")->with('transaction', [
                'transaction_number' => $transaction->transaction_number,
                'subtotal' => (float) $transaction->subtotal,
                'discount_amount' => (float) $transaction->discount_amount,
                'tax_amount' => (float) $transaction->tax_amount,
                'total_amount' => (float) $transaction->total_amount,
                'amount_paid' => (float) $transaction->amount_paid,
                'change_amount' => (float) $transaction->change_amount,
                'payment_method' => $paymentMethodLabel,
                'payments' => $transaction->payments->map(fn ($p) => [
                    'method_label' => $p->paymentMethod?->label ?? 'Tunai',
                    'amount' => (float) $p->amount,
                    'reference_no' => $p->reference_no,
                ]),
                'customer_name' => $customerName,
                'items' => $transaction->items->map(fn ($item) => [
                    'name' => $item->variant->product->name . ($item->variant->label() !== 'Default' ? ' (' . $item->variant->label() . ')' : ''),
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                ]),
                'created_at' => $transaction->created_at->toDateTimeString(),
            ]);
        });
    }
}
