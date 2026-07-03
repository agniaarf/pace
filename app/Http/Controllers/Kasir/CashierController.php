<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\AppMaster;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CashierController extends Controller
{
    public function index(): Response
    {
        $products = Product::with(['category', 'stock', 'discount'])
            ->where('status', 'active')
            ->whereHas('stock', fn ($q) => $q->where('quantity', '>', 0))
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'brand' => $p->brand,
                'selling_price' => (float) $p->selling_price,
                'stock' => $p->stock?->quantity ?? 0,
                'category' => $p->category?->name,
                'discount' => $p->discount ? [
                    'id' => $p->discount->id,
                    'name' => $p->discount->name,
                    'type' => $p->discount->type,
                    'value' => (float) $p->discount->value,
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
            'products' => $products,
            'customers' => $customers,
            'paymentMethods' => $paymentMethods,
            'activeDiscounts' => $activeDiscounts,
        ]);
    }

    public function history(Request $request): Response
    {
        $cashierId = $request->user()->id;

        $transactions = Transaction::with(['customer', 'items', 'paymentMethod'])
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
                'item_count' => $t->items->count(),
                'items' => $t->items->map(fn ($item) => [
                    'name' => $item->product->name,
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
            'payment_method_id' => ['nullable', 'exists:app_master,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::with('stock')->findOrFail($item['product_id']);
                $stock = $product->stock;

                if (!$stock || $stock->quantity < $item['quantity']) {
                    return back()->with('error', "Stok tidak mencukupi untuk {$product->name}.");
                }

                $lineTotal = $item['unit_price'] * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id' => $item['product_id'],
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

            foreach ($activeDiscounts as $discount) {
                if ($discount->applies_to === 'all') {
                    $base = $subtotal;
                } elseif ($discount->applies_to === 'product') {
                    $targetIds = $discount->target_ids ?? [];
                    $base = collect($itemsData)
                        ->filter(fn ($i) => in_array($i['product_id'], $targetIds))
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
            $changeAmount = $validated['amount_paid'] - $totalAmount;

            $txNumber = 'TRX-' . now()->format('ymd') . '-' . str_pad(
                Transaction::whereDate('created_at', today())->count() + 1, 3, '0', STR_PAD_LEFT
            );

            $transaction = Transaction::create([
                'transaction_number' => $txNumber,
                'cashier_id' => $request->user()->id,
                'customer_id' => $validated['customer_id'],
                'payment_method_id' => $validated['payment_method_id'],
                'transaction_date' => now(),
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'amount_paid' => $validated['amount_paid'],
                'change_amount' => max(0, $changeAmount),
            ]);

            foreach ($itemsData as $item) {
                $item['transaction_id'] = $transaction->id;
                TransactionItem::create($item);

                $stock = Stock::where('product_id', $item['product_id'])->first();
                $before = $stock->quantity;
                $stock->quantity -= $item['quantity'];
                $stock->save();

                StockMovement::create([
                    'product_id' => $item['product_id'],
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

            $transaction->load('items.product');

            $paymentMethodLabel = AppMaster::where('id', $validated['payment_method_id'])->value('label') ?? 'Tunai';
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
                'customer_name' => $customerName,
                'items' => $transaction->items->map(fn ($item) => [
                    'name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                ]),
                'created_at' => $transaction->created_at->toDateTimeString(),
            ]);
        });
    }
}
