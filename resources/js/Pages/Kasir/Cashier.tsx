import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { ProgressStepper } from '@/Components/ui/progress-stepper';
import { useToast } from '@/Components/ui/toast';
import KasirLayout from '@/Layouts/KasirLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    Check,
    CheckCircle,
    CreditCard,
    Info,
    Loader2,
    Mail,
    Minus,
    Package,
    Plus,
    Printer,
    QrCode,
    Search,
    ShoppingCart,
    Smartphone,
    Tag,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps, TransactionReceipt } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CashierProduct {
    id: number;
    product_id: number;
    category_id: number | null;
    name: string;
    variant_label: string;
    sku: string | null;
    barcode: string | null;
    brand: string | null;
    selling_price: number;
    stock: number;
    category: string | null;
}

interface CashierCustomer {
    id: number;
    member_code: string | null;
    full_name: string;
    phone: string | null;
    email: string | null;
    points_balance: number;
    tier: 'bronze' | 'silver' | 'gold';
}

interface LoyaltySettings {
    earn_rate: number;
    redeem_value: number;
    silver_threshold: number;
    gold_threshold: number;
}

const TIER_LABELS: Record<CashierCustomer['tier'], string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };

interface PaymentMethod {
    id: number;
    code: string;
    label: string;
}

interface ActiveDiscount {
    id: number;
    name: string;
    rule_type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';
    value: number | null;
    target_type: 'all' | 'category' | 'product' | 'variant';
    target_ids: number[] | null;
    min_qty: number;
    buy_quantity: number | null;
    get_quantity: number | null;
    get_discount_percent: number;
}

interface CashierPageProps {
    products: CashierProduct[];
    customers: CashierCustomer[];
    paymentMethods: PaymentMethod[];
    activeDiscounts: ActiveDiscount[];
    loyaltySettings: LoyaltySettings;
}

interface CartItem {
    product: CashierProduct;
    quantity: number;
}

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
    cash: Banknote,
    qris: QrCode,
    transfer: Smartphone,
    debit: CreditCard,
    ewallet: CreditCard,
};

type CheckoutStep = 'produk' | 'konfirmasi' | 'bayar' | 'selesai';

const STEPS: { label: string }[] = [
    { label: 'Produk' },
    { label: 'Konfirmasi' },
    { label: 'Bayar' },
    { label: 'Selesai' },
];

export default function Cashier() {
    const { products, customers, paymentMethods, activeDiscounts, loyaltySettings, flash, activeShift, requireShift } = usePage<PageProps & CashierPageProps>().props;
    const shiftBlocked = requireShift && !activeShift;
    const { toast } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CashierCustomer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [step, setStep] = useState<CheckoutStep>('produk');
    const [payments, setPayments] = useState<{ payment_method_id: number; amount: number; reference_no: string }[]>([]);
    const [redeemPointsInput, setRedeemPointsInput] = useState('');
    const [newMethodId, setNewMethodId] = useState<number | null>(null);
    const [newAmountInput, setNewAmountInput] = useState('');
    const [newReference, setNewReference] = useState('');
    const [txResult, setTxResult] = useState<TransactionReceipt | null>(null);
    const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', email: '' });

    const currentStepIndex = STEPS.findIndex(s => s.label.toLowerCase() === step);

    const { setData, post, processing, reset } = useForm<{
        items: { variant_id: number; quantity: number; unit_price: number }[];
        customer_id: number | null;
        payments: { payment_method_id: number; amount: number; reference_no: string | null }[];
        redeem_points: number;
    }>({
        items: [],
        customer_id: null,
        payments: [],
        redeem_points: 0,
    });

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.variant_label.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(search.toLowerCase())),
        [products, search]);

    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.phone?.includes(customerSearch) ||
            c.member_code?.toLowerCase().includes(customerSearch.toLowerCase())),
        [customers, customerSearch]);

    const addToCart = (product: CashierProduct) => {
        if (product.stock <= 0) return;
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    useEffect(() => {
        if (step === 'produk') {
            searchInputRef.current?.focus();
        }
    }, [step]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const code = search.trim();
        if (!code) return;
        const match = products.find(p => p.barcode === code);
        if (match) {
            if (match.stock <= 0) {
                toast(`"${displayName(match)}" habis stok.`, 'error');
            } else {
                addToCart(match);
                toast(`${displayName(match)} ditambahkan ke keranjang.`, 'success');
            }
            setSearch('');
        }
    };

    const displayName = (product: CashierProduct) =>
        product.variant_label && product.variant_label !== 'Default'
            ? `${product.name} (${product.variant_label})`
            : product.name;

    const updateQty = (productId: number, delta: number) => {
        setCart(prev => prev
            .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
            .filter(i => i.quantity > 0));
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    };

    const subtotal = cart.reduce((s, i) => s + i.product.selling_price * i.quantity, 0);

    const matchesDiscountTarget = (d: ActiveDiscount, item: CartItem) => {
        const targetIds = d.target_ids ?? [];
        switch (d.target_type) {
            case 'all': return true;
            case 'category': return item.product.category_id !== null && targetIds.includes(item.product.category_id);
            case 'product': return targetIds.includes(item.product.product_id);
            case 'variant': return targetIds.includes(item.product.id);
            default: return false;
        }
    };

    const targetKeyFor = (d: ActiveDiscount, item: CartItem) => {
        if (d.target_type === 'category') return item.product.category_id;
        if (d.target_type === 'product') return item.product.product_id;
        return item.product.id;
    };

    const appliedDiscounts = useMemo(() => {
        if (cart.length === 0) return [];
        return activeDiscounts.flatMap(d => {
            const targetItems = cart.filter(i => matchesDiscountTarget(d, i));
            if (targetItems.length === 0) return [];

            let amount = 0;

            if (d.rule_type === 'percentage' || d.rule_type === 'fixed') {
                const totalQty = targetItems.reduce((s, i) => s + i.quantity, 0);
                if (totalQty < Math.max(1, d.min_qty)) return [];
                const base = targetItems.reduce((s, i) => s + i.product.selling_price * i.quantity, 0);
                amount = d.rule_type === 'percentage' ? Math.round(base * (d.value ?? 0) / 100) : Math.min(d.value ?? 0, base);
            } else if (d.rule_type === 'buy_x_get_y') {
                const buyQty = Math.max(1, d.buy_quantity ?? 1);
                const getQty = Math.max(1, d.get_quantity ?? 1);
                const setSize = buyQty + getQty;
                const units: number[] = [];
                targetItems.forEach(i => { for (let n = 0; n < i.quantity; n++) units.push(i.product.selling_price); });
                units.sort((a, b) => a - b);
                const sets = Math.floor(units.length / setSize);
                const discountedUnitsCount = sets * getQty;
                if (discountedUnitsCount > 0) {
                    const discountedSum = units.slice(0, discountedUnitsCount).reduce((s, v) => s + v, 0);
                    amount = Math.round(discountedSum * d.get_discount_percent / 100);
                }
            } else if (d.rule_type === 'bundle') {
                const distinctTargets = new Set(targetItems.map(i => targetKeyFor(d, i))).size;
                if (distinctTargets < Math.max(1, d.min_qty)) return [];
                const base = targetItems.reduce((s, i) => s + i.product.selling_price * i.quantity, 0);
                amount = Math.max(0, base - (d.value ?? 0));
            }

            if (amount <= 0) return [];
            return [{ name: d.name, amount }];
        });
    }, [cart, activeDiscounts]);

    const itemDiscount = appliedDiscounts.reduce((s, d) => s + d.amount, 0);
    const remainingAfterItemDiscount = Math.max(0, subtotal - itemDiscount);
    const maxRedeemablePoints = selectedCustomer
        ? Math.min(selectedCustomer.points_balance, Math.floor(remainingAfterItemDiscount / loyaltySettings.redeem_value))
        : 0;
    const redeemPoints = Math.min(parseInt(redeemPointsInput.replace(/\D/g, '')) || 0, maxRedeemablePoints);
    const redeemValue = redeemPoints * loyaltySettings.redeem_value;
    const discountsWithRedeem = redeemValue > 0
        ? [...appliedDiscounts, { name: `Penukaran ${redeemPoints} Poin`, amount: redeemValue }]
        : appliedDiscounts;
    const totalDiscount = itemDiscount + redeemValue;
    const afterDiscount = subtotal - totalDiscount;
    const taxAmount = Math.round(afterDiscount * 0.11);
    const totalAmount = afterDiscount + taxAmount;
    const totalPaidSoFar = payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, totalAmount - totalPaidSoFar);
    const changeAmount = Math.max(0, totalPaidSoFar - totalAmount);

    const newAmount = parseInt(newAmountInput.replace(/\D/g, '')) || 0;
    const newMethod = paymentMethods.find(m => m.id === newMethodId);
    const isNewMethodCash = !newMethod || newMethod.code === 'cash';

    const addPayment = () => {
        if (!newMethodId || newAmount <= 0) return;
        setPayments(prev => [...prev, { payment_method_id: newMethodId, amount: newAmount, reference_no: newReference }]);
        setNewMethodId(null);
        setNewAmountInput('');
        setNewReference('');
    };

    const removePayment = (idx: number) => {
        setPayments(prev => prev.filter((_, i) => i !== idx));
    };

    const methodLabel = (id: number) => paymentMethods.find(m => m.id === id)?.label ?? 'Tunai';

    // Tile-level preview only covers percentage/fixed rules with min_qty 1 — buy-x-get-y and
    // bundle discounts are cart-level and only resolve to a concrete amount once quantities
    // are known, so they're surfaced as a plain promo badge instead of a per-unit price.
    const getProductDiscount = (product: CashierProduct) => {
        const simple = activeDiscounts.filter(d => (d.rule_type === 'percentage' || d.rule_type === 'fixed') && (d.min_qty ?? 1) <= 1);
        const matches = (d: ActiveDiscount) => {
            const targetIds = d.target_ids ?? [];
            switch (d.target_type) {
                case 'all': return true;
                case 'category': return product.category_id !== null && targetIds.includes(product.category_id);
                case 'product': return targetIds.includes(product.product_id);
                case 'variant': return targetIds.includes(product.id);
                default: return false;
            }
        };
        return simple.find(d => d.target_type === 'variant' && matches(d))
            ?? simple.find(d => d.target_type === 'product' && matches(d))
            ?? simple.find(d => d.target_type === 'category' && matches(d))
            ?? simple.find(d => d.target_type === 'all')
            ?? null;
    };

    const getPromoBadge = (product: CashierProduct) => {
        const matches = (d: ActiveDiscount) => {
            const targetIds = d.target_ids ?? [];
            switch (d.target_type) {
                case 'all': return true;
                case 'category': return product.category_id !== null && targetIds.includes(product.category_id);
                case 'product': return targetIds.includes(product.product_id);
                case 'variant': return targetIds.includes(product.id);
                default: return false;
            }
        };
        return activeDiscounts.find(d => (d.rule_type === 'buy_x_get_y' || d.rule_type === 'bundle') && matches(d)) ?? null;
    };

    const discountedPrice = (product: CashierProduct) => {
        const d = getProductDiscount(product);
        if (!d) return product.selling_price;
        if (d.rule_type === 'percentage') return Math.round(product.selling_price * (1 - (d.value ?? 0) / 100));
        return Math.max(0, product.selling_price - (d.value ?? 0));
    };

    const discountLabel = (product: CashierProduct) => {
        const d = getProductDiscount(product);
        if (!d) return '';
        return d.rule_type === 'percentage' ? `-${d.value}%` : `-${formatCurrency(d.value ?? 0)}`;
    };

    const handleCheckout = () => {
        setData({
            items: cart.map(i => ({
                variant_id: i.product.id,
                quantity: i.quantity,
                unit_price: i.product.selling_price,
            })),
            customer_id: selectedCustomer?.id ?? null,
            payments: payments.map(p => ({
                payment_method_id: p.payment_method_id,
                amount: p.amount,
                reference_no: p.reference_no || null,
            })),
            redeem_points: redeemPoints,
        });
        post('/kasir/cashier', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                const tx = (page.props.flash as { transaction?: TransactionReceipt }).transaction;
                if (tx) {
                    setTxResult(tx);
                } else {
                    setTxResult({
                        transaction_number: 'TRX-',
                        subtotal,
                        discount_amount: totalDiscount,
                        discounts: discountsWithRedeem,
                        points_earned: 0,
                        points_balance: selectedCustomer ? selectedCustomer.points_balance - redeemPoints : null,
                        tier: selectedCustomer?.tier ?? null,
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                        amount_paid: totalPaidSoFar,
                        change_amount: changeAmount,
                        payment_method: payments[0] ? methodLabel(payments[0].payment_method_id) : '',
                        payments: payments.map(p => ({
                            method_label: methodLabel(p.payment_method_id),
                            amount: p.amount,
                            reference_no: p.reference_no || null,
                        })),
                        customer_name: selectedCustomer?.full_name ?? null,
                        items: cart.map(i => ({ name: displayName(i.product), quantity: i.quantity, unit_price: i.product.selling_price, subtotal: i.product.selling_price * i.quantity })),
                        created_at: new Date().toISOString(),
                    });
                }
                setStep('selesai');
                toast('Transaksi berhasil diselesaikan!', 'success');
            },
            onError: () => {
                toast('Gagal memproses transaksi. Silakan coba lagi.', 'error');
            },
        });
    };

    const quickCash = [50000, 100000, 150000, 200000, 250000, 300000];

    const handleNewCustomer = () => {
        if (!newCustomer.full_name || !newCustomer.phone) {
            toast('Nama lengkap dan nomor HP wajib diisi.', 'error');
            return;
        }
        post('/admin/customers', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setShowNewCustomerModal(false);
                setNewCustomer({ full_name: '', phone: '', email: '' });
                toast('Pelanggan baru berhasil didaftarkan!', 'success');
            },
            onError: () => {
                toast('Gagal mendaftarkan pelanggan baru.', 'error');
            },
        });
    };

    const resetTransaction = () => {
        setStep('produk');
        setCart([]);
        setSelectedCustomer(null);
        setPayments([]);
        setNewMethodId(null);
        setNewAmountInput('');
        setNewReference('');
        setRedeemPointsInput('');
        setTxResult(null);
        reset();
    };

    return (
        <>
            <Head title="Kasir" />
            <KasirLayout title="Kasir" subtitle="Proses transaksi baru" activeRoute="/kasir/cashier">
                {flash.error && (
                    <div className="animate-fade-in mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {flash.error}
                    </div>
                )}

                {shiftBlocked && (
                    <div className="animate-fade-in mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        Anda harus membuka shift terlebih dahulu sebelum membuat transaksi. Gunakan tombol "Buka Shift" di pojok kanan atas.
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="mb-4">
                    <ProgressStepper steps={STEPS} currentStep={currentStepIndex} />
                </div>

                {/* Step 1: Produk */}
                {step === 'produk' && (
                <div className="flex h-auto flex-col gap-4 lg:h-[calc(100vh-200px)] lg:flex-row lg:overflow-hidden animate-fade-in">
                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 animate-fade-in">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Cari produk atau pindai barcode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="pl-10"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map(p => {
                                const inCart = cart.find(i => i.product.id === p.id);
                                const hasDiscount = !!getProductDiscount(p);
                                const promoBadge = getPromoBadge(p);
                                const finalPrice = discountedPrice(p);
                                const outOfStock = p.stock <= 0;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        disabled={outOfStock}
                                        className={`relative rounded-xl border p-3 text-left transition-all ${
                                            outOfStock ? 'cursor-not-allowed border-border bg-muted/40 opacity-60' :
                                            'hover:shadow-sm ' + (inCart ? 'border-primary bg-accent' :
                                            hasDiscount ? 'border-red-200 bg-red-50/30 hover:border-red-300' :
                                            'border-border bg-card hover:border-orange-300')
                                        }`}
                                    >
                                        {outOfStock ? (
                                            <span className="absolute right-2 top-2 rounded-md bg-muted-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                Habis
                                            </span>
                                        ) : hasDiscount && (
                                            <span className="absolute right-2 top-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                {discountLabel(p)}
                                            </span>
                                        )}
                                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        {!outOfStock && promoBadge && (
                                            <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                                                <Tag className="h-2.5 w-2.5" />{promoBadge.name}
                                            </span>
                                        )}
                                        <div className="mb-2 text-xs font-semibold leading-tight text-foreground">{displayName(p)}</div>
                                        <div className="flex items-end justify-between gap-1">
                                            <div>
                                                <div className={`font-mono text-sm font-bold leading-tight ${hasDiscount && !outOfStock ? 'text-red-500' : 'text-primary'}`}>
                                                    {formatCurrency(finalPrice)}
                                                </div>
                                                {hasDiscount && !outOfStock && (
                                                    <div className="font-mono text-xs leading-tight text-muted-foreground line-through">
                                                        {formatCurrency(p.selling_price)}
                                                    </div>
                                                )}
                                            </div>
                                            {inCart ? (
                                                <Badge variant="default">{inCart.quantity}x</Badge>
                                            ) : (
                                                <span className="flex-shrink-0 text-xs text-muted-foreground">Stok {p.stock}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-2 flex flex-col items-center justify-center py-12 text-muted-foreground sm:col-span-3 xl:col-span-4">
                                    <Package className="mb-3 h-10 w-10 opacity-40" />
                                    <p className="text-sm">Produk tidak ditemukan.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart sidebar */}
                    <div className="flex w-full flex-shrink-0 flex-col rounded-xl border border-border bg-card lg:w-80 lg:flex-shrink-0 animate-fade-in lg:overflow-hidden">
                        {/* Customer */}
                        <div className="border-b border-border px-4 py-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">Pelanggan</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowNewCustomerModal(true)} className="text-xs font-semibold text-primary hover:underline">
                                            Daftar Baru
                                        </button>
                                        <button onClick={() => setShowCustomerModal(true)} className="text-xs font-semibold text-primary hover:underline">
                                            {selectedCustomer ? 'Ganti' : 'Pilih Member'}
                                        </button>
                                    </div>
                            </div>
                            {selectedCustomer ? (
                                <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-accent p-2">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                                        {selectedCustomer.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xs font-semibold text-foreground">{selectedCustomer.full_name}</div>
                                        <div className="font-mono text-xs text-primary">{selectedCustomer.member_code ?? selectedCustomer.phone}</div>
                                    </div>
                                    <Badge variant="outline" className="flex-shrink-0 text-[10px]">{selectedCustomer.points_balance} poin · {TIER_LABELS[selectedCustomer.tier]}</Badge>
                                    <button onClick={() => setSelectedCustomer(null)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-2">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                                        <Users className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">Pelanggan umum (non-member)</span>
                                </div>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="border-b border-border px-5 py-3">
                            <h3 className="text-sm font-bold text-foreground">Keranjang ({cart.length})</h3>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto p-4 max-h-[40vh] lg:max-h-none">
                            {cart.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <ShoppingCart className="mb-3 h-8 w-8 opacity-40" />
                                    <p className="text-xs">Keranjang kosong. Tambahkan produk dari sebelah kiri.</p>
                                </div>
                            )}
                            {cart.map(item => (
                                <div key={item.product.id} className="animate-scale-in rounded-xl border border-border bg-background p-3">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="text-xs font-semibold leading-tight text-foreground">{displayName(item.product)}</div>
                                        <button onClick={() => removeFromCart(item.product.id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => updateQty(item.product.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-muted transition-colors hover:bg-secondary">
                                                <Minus className="h-2.5 w-2.5" />
                                            </button>
                                            <span className="w-8 text-center font-mono text-sm font-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQty(item.product.id, 1)}
                                                disabled={item.quantity >= item.product.stock}
                                                className="flex h-6 w-6 items-center justify-center rounded-md bg-muted transition-colors hover:bg-secondary disabled:opacity-40"
                                            >
                                                <Plus className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                        <span className="font-mono text-sm font-bold">{formatCurrency(item.product.selling_price * item.quantity)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary + checkout */}
                        <div className="space-y-3 border-t border-border p-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>
                                {discountsWithRedeem.map(d => (
                                    <div key={d.name} className="flex justify-between text-xs font-medium text-emerald-600">
                                        <span className="flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{d.name}</span>
                                        <span className="font-mono">−{formatCurrency(d.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Pajak (11%)</span>
                                    <span className="font-mono">{formatCurrency(taxAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
                                    <span>Total</span>
                                    <span className="font-mono text-primary">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                            {discountsWithRedeem.length > 0 && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle className="h-3 w-3" />
                                    {discountsWithRedeem.length} diskon aktif — hemat {formatCurrency(totalDiscount)}
                                </div>
                            )}
                            <Button
                                variant="gradient"
                                className="w-full justify-center"
                                size="lg"
                                disabled={cart.length === 0 || shiftBlocked}
                                onClick={() => setStep('konfirmasi')}
                            >
                                Lanjut ke Pembayaran
                            </Button>
                        </div>
                    </div>
                </div>
                )}

                {/* Step 2: Konfirmasi */}
                {step === 'konfirmasi' && (
                    <div className="flex h-auto flex-col gap-4 lg:h-[calc(100vh-200px)] lg:flex-row lg:overflow-hidden animate-fade-in">
                        <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-4">
                            <div>
                                <h3 className="mb-3 text-sm font-bold text-foreground">Ringkasan Pesanan</h3>
                                <div className="rounded-xl border border-border bg-muted/30 p-4">
                                    <div className="mb-3 space-y-2">
                                        {cart.map(item => (
                                            <div key={item.product.id} className="flex justify-between text-sm">
                                                <span>{displayName(item.product)} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                                <span className="font-mono">{formatCurrency(item.product.selling_price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-1 border-t border-border pt-2">
                                        <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
                                        {discountsWithRedeem.map(d => (
                                            <div key={d.name} className="flex justify-between text-xs text-emerald-600">
                                                <span>Diskon: {d.name}</span>
                                                <span className="font-mono">−{formatCurrency(d.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-xs text-muted-foreground"><span>Pajak (11%)</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>
                                    </div>
                                </div>
                            </div>
                            {discountsWithRedeem.length > 0 && (
                                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                    <Tag className="h-4 w-4" />
                                    Hemat {formatCurrency(totalDiscount)} dengan {discountsWithRedeem.length} diskon aktif
                                </div>
                            )}
                        </div>
                        <div className="flex w-full flex-shrink-0 flex-col rounded-xl border border-border bg-card lg:w-80 lg:overflow-hidden">
                            <div className="border-b border-border px-5 py-3">
                                <h3 className="text-sm font-bold text-foreground">Total Pembayaran</h3>
                            </div>
                            <div className="flex-1 space-y-3 p-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
                                    {discountsWithRedeem.map(d => (
                                        <div key={d.name} className="flex justify-between text-xs font-medium text-emerald-600"><span>{d.name}</span><span className="font-mono">−{formatCurrency(d.amount)}</span></div>
                                    ))}
                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Pajak (11%)</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>
                                    <div className="flex justify-between border-t border-border pt-2 text-lg font-bold"><span>Total</span><span className="font-mono text-primary">{formatCurrency(totalAmount)}</span></div>
                                </div>
                                {selectedCustomer && (
                                    <div className="rounded-lg border border-orange-100 bg-accent p-2">
                                        <div className="text-xs font-semibold text-foreground">{selectedCustomer.full_name}</div>
                                        <div className="font-mono text-xs text-primary">{selectedCustomer.member_code ?? selectedCustomer.phone}</div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 border-t border-border p-4">
                                <Button variant="gradient" className="w-full justify-center" size="lg" onClick={() => setStep('bayar')}>
                                    Lanjut ke Pembayaran<ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="w-full justify-center" onClick={() => setStep('produk')}>
                                    <ArrowLeft className="h-4 w-4" />Kembali
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Bayar */}
                {step === 'bayar' && (
                    <div className="mx-auto max-w-2xl animate-fade-in space-y-4">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 text-lg font-bold text-foreground">Pembayaran</h3>
                            <div className="mb-6 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white">
                                <p className="text-sm text-white/80">Total Belanja</p>
                                <p className="font-mono text-3xl font-bold">{formatCurrency(totalAmount)}</p>
                            </div>

                            {selectedCustomer && selectedCustomer.points_balance > 0 && (
                                <div className="mb-4 space-y-2 rounded-xl border border-dashed border-border p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            Tukar Poin — Saldo {selectedCustomer.points_balance} poin ({TIER_LABELS[selectedCustomer.tier]})
                                        </p>
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-primary hover:underline"
                                            onClick={() => setRedeemPointsInput(String(maxRedeemablePoints))}
                                        >
                                            Gunakan Maks
                                        </button>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={redeemPointsInput}
                                        onChange={(e) => setRedeemPointsInput(e.target.value.replace(/\D/g, ''))}
                                    />
                                    {redeemPoints > 0 && (
                                        <p className="text-xs font-medium text-emerald-600">
                                            Potongan {formatCurrency(redeemValue)} dari {redeemPoints} poin
                                        </p>
                                    )}
                                </div>
                            )}

                            {payments.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {payments.map((p, idx) => {
                                        const m = paymentMethods.find(pm => pm.id === p.payment_method_id);
                                        const Icon = PAYMENT_ICONS[m?.code ?? 'cash'] ?? Banknote;
                                        return (
                                            <div key={idx} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-foreground">{m?.label ?? 'Tunai'}</div>
                                                    {p.reference_no && <div className="truncate text-xs text-muted-foreground">Ref: {p.reference_no}</div>}
                                                </div>
                                                <span className="font-mono text-sm font-bold">{formatCurrency(p.amount)}</span>
                                                <button onClick={() => removePayment(idx)} className="flex-shrink-0 text-muted-foreground hover:text-destructive">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mb-4 space-y-3 rounded-xl border border-dashed border-border p-4">
                                <p className="text-xs font-semibold text-muted-foreground">Tambah Pembayaran</p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {paymentMethods.map(m => {
                                        const Icon = PAYMENT_ICONS[m.code] ?? Banknote;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => setNewMethodId(m.id)}
                                                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                                                    newMethodId === m.id ? 'border-primary bg-accent shadow-sm' : 'border-border bg-card hover:border-orange-300'
                                                }`}
                                            >
                                                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${newMethodId === m.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-xs font-semibold">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div>
                                    <Label className="mb-1.5 block text-xs font-semibold text-foreground">Jumlah</Label>
                                    <Input type="text" placeholder="Rp 0" value={newAmountInput ? `Rp ${(parseInt(newAmountInput.replace(/\D/g, '')) || 0).toLocaleString('id-ID')}` : ''} onChange={e => setNewAmountInput(e.target.value.replace(/\D/g, ''))} className="font-mono text-lg font-bold h-11" />
                                </div>
                                {isNewMethodCash ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {quickCash.map(n => (
                                            <button key={n} onClick={() => setNewAmountInput(String(n))} className="rounded-lg border border-border bg-card py-2 font-mono text-xs font-semibold transition-all hover:bg-muted hover:border-orange-300">
                                                {n >= 1000000 ? `${n / 1000000}jt` : `${n / 1000}rb`}
                                            </button>
                                        ))}
                                        <button onClick={() => setNewAmountInput(String(remaining))} className="rounded-lg border-2 border-primary bg-primary/5 py-2 font-mono text-xs font-bold text-primary transition-all hover:bg-primary/10">
                                            Sisa Tagihan
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <Label className="mb-1.5 block text-xs font-semibold text-foreground">No. Referensi (Opsional)</Label>
                                        <Input value={newReference} onChange={e => setNewReference(e.target.value)} placeholder="e.g. kode transaksi QRIS" />
                                    </div>
                                )}
                                <Button variant="outline" className="w-full justify-center" disabled={!newMethodId || newAmount <= 0} onClick={addPayment}>
                                    <Plus className="h-4 w-4" />Tambah Pembayaran
                                </Button>
                            </div>

                            <div className={`rounded-xl p-4 ${remaining <= 0 ? 'border border-emerald-200 bg-emerald-50' : 'border border-amber-200 bg-amber-50'}`}>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-muted-foreground">Total Dibayar</span>
                                    <span className="font-mono font-bold">{formatCurrency(totalPaidSoFar)}</span>
                                </div>
                                {remaining > 0 ? (
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-amber-700">Sisa Tagihan</span>
                                        <span className="font-mono text-xl font-bold text-amber-600">{formatCurrency(remaining)}</span>
                                    </div>
                                ) : (
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-emerald-700">Kembalian</span>
                                        <span className="font-mono text-xl font-bold text-emerald-600">{formatCurrency(changeAmount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 justify-center" size="lg" onClick={() => setStep('konfirmasi')}>
                                <ArrowLeft className="h-4 w-4" />Kembali
                            </Button>
                            <Button variant="gradient" className="flex-1 justify-center" size="lg" disabled={remaining > 0 || payments.length === 0 || processing} onClick={handleCheckout}>
                                {processing ? <><Loader2 className="h-4 w-4 animate-spin" />Memproses...</> : 'Simpan & Selesai'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Selesai */}
                {step === 'selesai' && txResult && (
                    <div className="mx-auto max-w-md animate-fade-in">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <div className="mb-6 flex flex-col items-center text-center">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-scale-in">
                                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h2 className="mb-1 text-2xl font-bold text-foreground">Transaksi Berhasil!</h2>
                                <p className="text-sm text-muted-foreground">{txResult.transaction_number}</p>
                            </div>
                            <div className="mb-4 grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="font-mono text-lg font-bold text-foreground">{formatCurrency(txResult.total_amount)}</p>
                                </div>
                                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Kembalian</p>
                                    <p className="font-mono text-lg font-bold text-emerald-600">{formatCurrency(txResult.change_amount)}</p>
                                </div>
                            </div>
                            <div className="mb-6 w-full rounded-xl border border-border bg-card p-4 text-left" data-receipt>
                                <div className="mb-3 border-b border-dashed border-border pb-2 text-center">
                                    <p className="text-sm font-bold text-foreground">PACE POS</p>
                                    <p className="text-xs text-muted-foreground">{new Date(txResult.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                {txResult.customer_name && (
                                    <div className="mb-2 text-xs text-muted-foreground">Pelanggan: <span className="font-medium text-foreground">{txResult.customer_name}</span></div>
                                )}
                                <div className="mb-2 max-h-40 space-y-1 overflow-y-auto">
                                    {txResult.items.map((item, idx) => (
                                        <div key={idx} className="text-xs">
                                            <div className="flex justify-between"><span className="font-medium text-foreground">{item.name}</span><span className="font-mono">{formatCurrency(item.subtotal)}</span></div>
                                            <div className="text-muted-foreground">{item.quantity} x {formatCurrency(item.unit_price)}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1 border-t border-dashed border-border pt-2 text-xs">
                                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatCurrency(txResult.subtotal)}</span></div>
                                    {txResult.discounts && txResult.discounts.length > 0 ? (
                                        txResult.discounts.map((d, idx) => (
                                            <div key={idx} className="flex justify-between text-emerald-600"><span>{d.name}</span><span className="font-mono">−{formatCurrency(d.amount)}</span></div>
                                        ))
                                    ) : txResult.discount_amount > 0 && (
                                        <div className="flex justify-between text-emerald-600"><span>Diskon</span><span className="font-mono">−{formatCurrency(txResult.discount_amount)}</span></div>
                                    )}
                                    <div className="flex justify-between text-muted-foreground"><span>Pajak (11%)</span><span className="font-mono">{formatCurrency(txResult.tax_amount)}</span></div>
                                    <div className="flex justify-between border-t border-border pt-1 text-sm font-bold"><span>Total</span><span className="font-mono text-primary">{formatCurrency(txResult.total_amount)}</span></div>
                                    {txResult.payments && txResult.payments.length > 1 ? (
                                        txResult.payments.map((p, idx) => (
                                            <div key={idx} className="flex justify-between text-muted-foreground">
                                                <span>Bayar ({p.method_label}{p.reference_no ? ` · ${p.reference_no}` : ''})</span>
                                                <span className="font-mono">{formatCurrency(p.amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between text-muted-foreground"><span>Bayar ({txResult.payment_method})</span><span className="font-mono">{formatCurrency(txResult.amount_paid)}</span></div>
                                    )}
                                    {txResult.change_amount > 0 && <div className="flex justify-between font-semibold text-emerald-600"><span>Kembalian</span><span className="font-mono">{formatCurrency(txResult.change_amount)}</span></div>}
                                </div>
                                {txResult.points_balance !== null && txResult.points_balance !== undefined && (
                                    <div className="mt-2 border-t border-dashed border-border pt-2 text-xs text-primary">
                                        {!!txResult.points_earned && <span>+{txResult.points_earned} poin diperoleh · </span>}
                                        Saldo poin: {txResult.points_balance} ({TIER_LABELS[txResult.tier ?? 'bronze']})
                                    </div>
                                )}
                                <div className="mt-3 border-t border-dashed border-border pt-2 text-center text-xs text-muted-foreground">Own Your Pace, Unleash Your Power</div>
                            </div>
                            <div className="flex w-full gap-2">
                                <Button variant="outline" className="flex-1 justify-center" onClick={() => window.print()}><Printer className="h-4 w-4" />Cetak Struk</Button>
                                <Button variant="outline" className="flex-1 justify-center" onClick={() => toast('Fitur kirim email akan segera hadir.', 'info')}><Mail className="h-4 w-4" />Kirim Email</Button>
                                <Button variant="gradient" className="flex-1 justify-center" onClick={resetTransaction}><Check className="h-4 w-4" />Selesai</Button>
                            </div>
                        </div>
                    </div>
                )}
            </KasirLayout>

            {/* Customer selection modal */}
            <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pilih Pelanggan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Cari nama, telepon, atau kode member..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-10" />
                        </div>
                        <div className="max-h-56 space-y-2 overflow-y-auto">
                            {filteredCustomers.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); setCustomerSearch(''); }}
                                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-all hover:border-primary hover:bg-accent"
                                >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                                        {c.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-foreground">{c.full_name}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{c.member_code ?? '—'} · {c.phone ?? '—'}</div>
                                    </div>
                                    <Badge variant="outline" className="flex-shrink-0 text-[10px]">{c.points_balance} poin · {TIER_LABELS[c.tier]}</Badge>
                                </button>
                            ))}
                            {customerSearch && filteredCustomers.length === 0 && (
                                <p className="py-4 text-center text-sm text-muted-foreground">Pelanggan tidak ditemukan.</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 justify-center" onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false); setCustomerSearch(''); }}>
                                Lanjut sebagai Umum
                            </Button>
                            <Button variant="gradient" className="flex-1 justify-center" onClick={() => { setShowCustomerModal(false); setShowNewCustomerModal(true); }}>
                                Daftar Baru
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New customer modal */}
            <Dialog open={showNewCustomerModal} onOpenChange={setShowNewCustomerModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Daftarkan Member Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>Pelanggan akan otomatis terpilih untuk transaksi ini dan menerima kode member setelah pendaftaran berhasil.</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label className="mb-1.5 block text-sm font-semibold">Nama Lengkap</Label>
                                <Input value={newCustomer.full_name} onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })} placeholder="Masukkan nama lengkap" />
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-sm font-semibold">Nomor HP</Label>
                                <Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-sm font-semibold">Email <span className="text-muted-foreground">(opsional)</span></Label>
                                <Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="email@contoh.com" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 justify-center" onClick={() => setShowNewCustomerModal(false)}>Batal</Button>
                            <Button variant="gradient" className="flex-1 justify-center" onClick={handleNewCustomer}>Daftarkan</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
