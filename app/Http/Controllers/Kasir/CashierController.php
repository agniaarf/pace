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
        $variants = ProductVariant::with(['product.category', 'stock'])
            ->where('status', 'active')
            ->whereHas('product', fn ($q) => $q->where('status', 'active'))
            ->orderBy('sku')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'product_id' => $v->product_id,
                'category_id' => $v->product->category_id,
                'name' => $v->product->name,
                'variant_label' => $v->label(),
                'sku' => $v->sku,
                'barcode' => $v->barcode,
                'brand' => $v->product->brand,
                'selling_price' => $v->sellingPrice(),
                'stock' => $v->stock?->quantity ?? 0,
                'category' => $v->product->category?->name,
            ]);

        $customers = Customer::where('status', 'active')
            ->with('loyaltyBalances')
            ->orderBy('full_name')
            ->get(['id', 'member_code', 'full_name', 'phone', 'email'])
            ->map(function (Customer $c) {
                $balance = $c->loyaltyBalances->firstWhere('outlet_id', 1);

                return [
                    'id' => $c->id,
                    'member_code' => $c->member_code,
                    'full_name' => $c->full_name,
                    'phone' => $c->phone,
                    'email' => $c->email,
                    'points_balance' => $balance->points_balance ?? 0,
                    'tier' => $balance->tier ?? 'bronze',
                ];
            });

        $paymentMethods = AppMaster::where('type', 'payment_method')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'label']);

        $activeDiscounts = $this->activeDiscounts();

        return Inertia::render('Kasir/Cashier', [
            'products' => $variants,
            'customers' => $customers,
            'paymentMethods' => $paymentMethods,
            'activeDiscounts' => $activeDiscounts,
            'loyaltySettings' => $this->loyaltySettings(),
        ]);
    }

    private function loyaltySettings(): array
    {
        $defaults = ['earn_rate' => 10000, 'redeem_value' => 100, 'silver_threshold' => 500, 'gold_threshold' => 2000];
        $value = AppMaster::where('type', 'loyalty_setting')->where('code', 'default')->value('value');

        return array_merge($defaults, $value ?? []);
    }

    private function activeDiscounts(): \Illuminate\Support\Collection
    {
        return Discount::where('status', 'active')
            ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', today()))
            ->get([
                'id', 'name', 'rule_type', 'value', 'target_type', 'target_ids',
                'min_qty', 'buy_quantity', 'get_quantity', 'get_discount_percent',
            ]);
    }

    private function discountMatchesItem(Discount $discount, array $item): bool
    {
        return match ($discount->target_type) {
            'all' => true,
            'category' => in_array($item['category_id'], $discount->target_ids ?? [], true),
            'product' => in_array($item['product_id'], $discount->target_ids ?? [], true),
            'variant' => in_array($item['variant_id'], $discount->target_ids ?? [], true),
            default => false,
        };
    }

    private function targetKeyFor(string $targetType): string
    {
        return match ($targetType) {
            'category' => 'category_id',
            'product' => 'product_id',
            default => 'variant_id',
        };
    }

    /**
     * Authoritative cart-level discount calculation, covering all four rule types.
     * $itemsData rows must each carry variant_id, product_id, category_id, quantity, unit_price, subtotal.
     *
     * @return array{amount: int, breakdown: array<int, array{name: string, amount: int}>}
     */
    private function calculateDiscounts(\Illuminate\Support\Collection $discounts, array $itemsData): array
    {
        $totalDiscount = 0;
        $breakdown = [];

        foreach ($discounts as $discount) {
            $targetItems = collect($itemsData)->filter(fn ($i) => $this->discountMatchesItem($discount, $i));
            if ($targetItems->isEmpty()) {
                continue;
            }

            $amount = 0;

            if (in_array($discount->rule_type, ['percentage', 'fixed'], true)) {
                $totalQty = $targetItems->sum('quantity');
                if ($totalQty < max(1, $discount->min_qty)) {
                    continue;
                }
                $base = $targetItems->sum('subtotal');
                $amount = $discount->rule_type === 'percentage'
                    ? (int) round($base * (float) $discount->value / 100)
                    : (int) min((float) $discount->value, $base);
            } elseif ($discount->rule_type === 'buy_x_get_y') {
                $buyQty = max(1, (int) $discount->buy_quantity);
                $getQty = max(1, (int) $discount->get_quantity);
                $setSize = $buyQty + $getQty;

                $units = [];
                foreach ($targetItems as $i) {
                    for ($n = 0; $n < $i['quantity']; $n++) {
                        $units[] = $i['unit_price'];
                    }
                }
                sort($units);

                $sets = intdiv(count($units), $setSize);
                $discountedUnitsCount = $sets * $getQty;

                if ($discountedUnitsCount > 0) {
                    $amount = (int) round(array_sum(array_slice($units, 0, $discountedUnitsCount)) * (float) $discount->get_discount_percent / 100);
                }
            } elseif ($discount->rule_type === 'bundle') {
                $distinctTargets = $targetItems->pluck($this->targetKeyFor($discount->target_type))->unique()->count();
                if ($distinctTargets < max(1, $discount->min_qty)) {
                    continue;
                }
                $base = $targetItems->sum('subtotal');
                $amount = (int) max(0, $base - (float) $discount->value);
            }

            if ($amount > 0) {
                $totalDiscount += $amount;
                $breakdown[] = ['name' => $discount->name, 'amount' => $amount];
            }
        }

        return ['amount' => $totalDiscount, 'breakdown' => $breakdown];
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
            'redeem_points' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $activeShift = Shift::where('cashier_id', $request->user()->id)->where('status', 'open')->first();

        if (config('pace.require_shift') && !$activeShift) {
            return back()->with('error', 'Anda harus membuka shift terlebih dahulu sebelum membuat transaksi.');
        }

        return DB::transaction(function () use ($validated, $request, $activeShift) {
            $subtotal = 0;
            $itemsData = [];

            $variants = ProductVariant::with(['stock', 'product'])
                ->whereIn('id', collect($validated['items'])->pluck('variant_id'))
                ->get()
                ->keyBy('id');

            foreach ($validated['items'] as $item) {
                $variant = $variants[$item['variant_id']];
                $stock = $variant->stock;

                if (!$stock || $stock->quantity < $item['quantity']) {
                    return back()->with('error', "Stok tidak mencukupi untuk {$variant->product->name}.");
                }

                $lineTotal = $item['unit_price'] * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'variant_id' => $item['variant_id'],
                    'product_id' => $variant->product_id,
                    'category_id' => $variant->product->category_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'item_discount' => 0,
                    'subtotal' => $lineTotal,
                ];
            }

            $discountResult = $this->calculateDiscounts($this->activeDiscounts(), $itemsData);
            $discountAmount = $discountResult['amount'];
            $breakdown = $discountResult['breakdown'];

            // item_discount/product_id/category_id were only needed for the discount
            // calculation above; TransactionItem::create() below ignores unknown keys
            // via mass-assignment guarding, so no further stripping is needed.

            $loyaltySettings = $this->loyaltySettings();
            $loyaltyBalance = null;
            $pointsRedeemed = 0;

            if ($validated['customer_id'] && ($validated['redeem_points'] ?? 0) > 0) {
                $customer = Customer::findOrFail($validated['customer_id']);
                $loyaltyBalance = $customer->loyaltyBalance();

                $remainingAfterItemDiscount = max(0, $subtotal - $discountAmount);
                $maxRedeemableByValue = intdiv($remainingAfterItemDiscount, $loyaltySettings['redeem_value']);
                $pointsRedeemed = min($validated['redeem_points'], $loyaltyBalance->points_balance, $maxRedeemableByValue);

                if ($pointsRedeemed > 0) {
                    $redemptionValue = $pointsRedeemed * $loyaltySettings['redeem_value'];
                    $discountAmount += $redemptionValue;
                    $breakdown[] = ['name' => "Penukaran {$pointsRedeemed} Poin", 'amount' => $redemptionValue];
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

            $pointsEarned = 0;
            $newPointsBalance = null;
            $newTier = null;

            if ($validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                $customer->increment('total_purchases');
                $customer->increment('total_spent', $totalAmount);

                $loyaltyBalance ??= $customer->loyaltyBalance();
                $pointsEarned = intdiv((int) $totalAmount, $loyaltySettings['earn_rate']);

                $loyaltyBalance->points_balance = $loyaltyBalance->points_balance - $pointsRedeemed + $pointsEarned;
                $loyaltyBalance->lifetime_points += $pointsEarned;
                $loyaltyBalance->recalculateTier($loyaltySettings);
                $loyaltyBalance->save();

                $newPointsBalance = $loyaltyBalance->points_balance;
                $newTier = $loyaltyBalance->tier;
            }

            $transaction->load(['items.variant.product', 'payments.paymentMethod']);

            $paymentMethodLabel = $transaction->payments->first()?->paymentMethod?->label ?? 'Tunai';
            $customerName = $validated['customer_id'] ? Customer::where('id', $validated['customer_id'])->value('full_name') : null;

            return back()->with('success', "Transaksi {$txNumber} berhasil diselesaikan.")->with('transaction', [
                'transaction_number' => $transaction->transaction_number,
                'subtotal' => (float) $transaction->subtotal,
                'discount_amount' => (float) $transaction->discount_amount,
                'discounts' => $breakdown,
                'points_earned' => $pointsEarned,
                'points_balance' => $newPointsBalance,
                'tier' => $newTier,
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
