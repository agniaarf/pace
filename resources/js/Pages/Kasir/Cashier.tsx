import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
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
    Banknote,
    Check,
    CheckCircle,
    CreditCard,
    Loader2,
    Minus,
    Package,
    Plus,
    QrCode,
    Search,
    ShoppingCart,
    Smartphone,
    Tag,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CashierProduct {
    id: number;
    name: string;
    sku: string | null;
    brand: string | null;
    selling_price: number;
    stock: number;
    category: string | null;
    discount: { id: number; name: string; type: 'percentage' | 'nominal'; value: number } | null;
}

interface CashierCustomer {
    id: number;
    member_code: string | null;
    full_name: string;
    phone: string | null;
    email: string | null;
}

interface PaymentMethod {
    id: number;
    code: string;
    label: string;
}

interface ActiveDiscount {
    id: number;
    name: string;
    type: 'percentage' | 'nominal';
    value: number;
    applies_to: 'all' | 'category' | 'product';
    target_ids: number[] | null;
}

interface CashierPageProps {
    products: CashierProduct[];
    customers: CashierCustomer[];
    paymentMethods: PaymentMethod[];
    activeDiscounts: ActiveDiscount[];
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

export default function Cashier() {
    const { products, customers, paymentMethods, activeDiscounts, flash } = usePage<PageProps & CashierPageProps>().props;
    const { toast } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<CashierCustomer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success' | null>(null);
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [cashInput, setCashInput] = useState('');
    const [txResult, setTxResult] = useState<{ number: string; total: number; change: number } | null>(null);

    const { setData, post, processing, reset } = useForm<{
        items: { product_id: number; quantity: number; unit_price: number }[];
        customer_id: number | null;
        payment_method_id: number | null;
        amount_paid: number;
    }>({
        items: [],
        customer_id: null,
        payment_method_id: null,
        amount_paid: 0,
    });

    const filteredProducts = useMemo(() =>
        products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())),
        [products, search]);

    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.phone?.includes(customerSearch) ||
            c.member_code?.toLowerCase().includes(customerSearch.toLowerCase())),
        [customers, customerSearch]);

    const addToCart = (product: CashierProduct) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQty = (productId: number, delta: number) => {
        setCart(prev => prev
            .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
            .filter(i => i.quantity > 0));
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    };

    const subtotal = cart.reduce((s, i) => s + i.product.selling_price * i.quantity, 0);

    const appliedDiscounts = useMemo(() => {
        if (cart.length === 0) return [];
        return activeDiscounts.flatMap(d => {
            let base = 0;
            if (d.applies_to === 'all') {
                base = subtotal;
            } else if (d.applies_to === 'product') {
                const targetIds = d.target_ids ?? [];
                base = cart.filter(i => targetIds.includes(i.product.id)).reduce((s, i) => s + i.product.selling_price * i.quantity, 0);
            }
            if (base <= 0) return [];
            const amount = d.type === 'percentage' ? Math.round(base * d.value / 100) : Math.min(d.value, base);
            return [{ name: d.name, amount }];
        });
    }, [cart, subtotal, activeDiscounts]);

    const totalDiscount = appliedDiscounts.reduce((s, d) => s + d.amount, 0);
    const afterDiscount = subtotal - totalDiscount;
    const taxAmount = Math.round(afterDiscount * 0.11);
    const totalAmount = afterDiscount + taxAmount;
    const cashAmount = parseInt(cashInput.replace(/\D/g, '')) || 0;
    const change = cashAmount - totalAmount;

    const getProductDiscount = (product: CashierProduct) => {
        if (product.discount) return product.discount;
        const global = activeDiscounts.find(d => d.applies_to === 'all');
        return global ?? null;
    };

    const discountedPrice = (product: CashierProduct) => {
        const d = getProductDiscount(product);
        if (!d) return product.selling_price;
        if (d.type === 'percentage') return Math.round(product.selling_price * (1 - d.value / 100));
        return Math.max(0, product.selling_price - d.value);
    };

    const discountLabel = (product: CashierProduct) => {
        const d = getProductDiscount(product);
        if (!d) return '';
        return d.type === 'percentage' ? `-${d.value}%` : `-${formatCurrency(d.value)}`;
    };

    const handleCheckout = () => {
        setData({
            items: cart.map(i => ({
                product_id: i.product.id,
                quantity: i.quantity,
                unit_price: i.product.selling_price,
            })),
            customer_id: selectedCustomer?.id ?? null,
            payment_method_id: paymentMethodId,
            amount_paid: cashAmount || totalAmount,
        });
        post('/kasir/cashier', {
            onSuccess: (page) => {
                const flash = (page.props.flash as { success?: string });
                setTxResult({ number: flash.success ?? 'Transaksi selesai', total: totalAmount, change: Math.max(0, change) });
                setCheckoutStep('success');
                setCart([]);
                setSelectedCustomer(null);
                setCashInput('');
                setPaymentMethodId(null);
                reset();
                toast('Transaksi berhasil diselesaikan!', 'success');
            },
            onError: () => {
                toast('Gagal memproses transaksi. Silakan coba lagi.', 'error');
            },
        });
    };

    const quickCash = [50000, 100000, 150000, 200000, 250000, 300000];

    return (
        <>
            <Head title="Kasir" />
            <KasirLayout title="Kasir" subtitle="Proses transaksi baru" activeRoute="/kasir/cashier">
                {flash.error && (
                    <div className="animate-fade-in mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {flash.error}
                    </div>
                )}

                <div className="flex h-[calc(100vh-140px)] flex-col gap-4 overflow-hidden lg:flex-row">
                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 animate-fade-in">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari produk atau pindai barcode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map(p => {
                                const inCart = cart.find(i => i.product.id === p.id);
                                const hasDiscount = !!getProductDiscount(p);
                                const finalPrice = discountedPrice(p);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className={`relative rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                                            inCart ? 'border-primary bg-accent' :
                                            hasDiscount ? 'border-red-200 bg-red-50/30 hover:border-red-300' :
                                            'border-border bg-card hover:border-orange-300'
                                        }`}
                                    >
                                        {hasDiscount && (
                                            <span className="absolute right-2 top-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                {discountLabel(p)}
                                            </span>
                                        )}
                                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="mb-2 text-xs font-semibold leading-tight text-foreground">{p.name}</div>
                                        <div className="flex items-end justify-between gap-1">
                                            <div>
                                                <div className={`font-mono text-sm font-bold leading-tight ${hasDiscount ? 'text-red-500' : 'text-primary'}`}>
                                                    {formatCurrency(finalPrice)}
                                                </div>
                                                {hasDiscount && (
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
                    <div className="flex w-full flex-shrink-0 flex-col rounded-xl border border-border bg-card lg:w-80 animate-fade-in">
                        {/* Customer */}
                        <div className="border-b border-border px-4 py-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">Pelanggan</span>
                                <button onClick={() => setShowCustomerModal(true)} className="text-xs font-semibold text-primary hover:underline">
                                    {selectedCustomer ? 'Ganti' : 'Pilih Member'}
                                </button>
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
                        <div className="flex-1 space-y-2 overflow-y-auto p-4">
                            {cart.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <ShoppingCart className="mb-3 h-8 w-8 opacity-40" />
                                    <p className="text-xs">Keranjang kosong. Tambahkan produk dari sebelah kiri.</p>
                                </div>
                            )}
                            {cart.map(item => (
                                <div key={item.product.id} className="animate-scale-in rounded-xl border border-border bg-background p-3">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="text-xs font-semibold leading-tight text-foreground">{item.product.name}</div>
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
                                {appliedDiscounts.map(d => (
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
                            {appliedDiscounts.length > 0 && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle className="h-3 w-3" />
                                    {appliedDiscounts.length} diskon aktif — hemat {formatCurrency(totalDiscount)}
                                </div>
                            )}
                            <Button
                                variant="gradient"
                                className="w-full justify-center"
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={() => setCheckoutStep('payment')}
                            >
                                {cart.length > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                                    </span>
                                )}
                                Lanjut ke Pembayaran
                            </Button>
                        </div>
                    </div>
                </div>
            </KasirLayout>

            {/* Customer selection modal */}
            <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
                <DialogContent className="sm:max-w-md">
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
                                </button>
                            ))}
                            {customerSearch && filteredCustomers.length === 0 && (
                                <p className="py-4 text-center text-sm text-muted-foreground">Pelanggan tidak ditemukan.</p>
                            )}
                        </div>
                        <Button variant="outline" className="w-full justify-center" onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false); setCustomerSearch(''); }}>
                            Lanjut sebagai Umum
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment dialog */}
            <Dialog open={checkoutStep === 'payment'} onOpenChange={(open) => { if (!open) setCheckoutStep(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Pembayaran</DialogTitle>
                    </DialogHeader>
                    <ProgressStepper
                        steps={[
                            { label: 'Keranjang' },
                            { label: 'Pembayaran' },
                            { label: 'Selesai' },
                        ]}
                        currentStep={1}
                        className="mb-4"
                    />
                    <div className="space-y-4">
                        {/* Order summary */}
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <div className="mb-3 space-y-1.5">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between text-sm">
                                        <span>{item.product.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                        <span className="font-mono">{formatCurrency(item.product.selling_price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1 border-t border-border pt-2">
                                <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-600"><span>Diskon</span><span className="font-mono">−{formatCurrency(totalDiscount)}</span></div>
                                )}
                                <div className="flex justify-between text-xs text-muted-foreground"><span>Pajak (11%)</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>
                                <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span className="font-mono text-primary">{formatCurrency(totalAmount)}</span></div>
                            </div>
                        </div>

                        {/* Payment methods */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Metode Pembayaran</p>
                            <div className="grid grid-cols-2 gap-2">
                                {paymentMethods.map(m => {
                                    const Icon = PAYMENT_ICONS[m.code] ?? Banknote;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setPaymentMethodId(m.id)}
                                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                                                paymentMethodId === m.id ? 'border-primary bg-accent shadow-sm' : 'border-border bg-card hover:border-orange-300'
                                            }`}
                                        >
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${paymentMethodId === m.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-semibold">{m.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cash input */}
                        {paymentMethodId && (
                            <div className="animate-fade-in space-y-3">
                                <div>
                                    <p className="mb-1.5 text-xs font-semibold">Jumlah Diterima</p>
                                    <Input
                                        type="text"
                                        placeholder="Rp 0"
                                        value={cashInput ? `Rp ${parseInt(cashInput.replace(/\D/g, '')).toLocaleString('id-ID')}` : ''}
                                        onChange={e => setCashInput(e.target.value.replace(/\D/g, ''))}
                                        className="font-mono text-xl font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {quickCash.map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setCashInput(String(n))}
                                            className="rounded-lg border border-border bg-card py-2 font-mono text-sm font-semibold transition-all hover:bg-muted hover:border-orange-300"
                                        >
                                            {n >= 1000000 ? `${n / 1000000}jt` : `${n / 1000}rb`}
                                        </button>
                                    ))}
                                </div>
                                {cashAmount > 0 && (
                                    <div className={`rounded-xl p-3 ${change >= 0 ? 'border border-emerald-200 bg-emerald-50' : 'border border-red-200 bg-red-50'}`}>
                                        <p className="mb-0.5 text-xs font-semibold text-muted-foreground">Kembalian</p>
                                        <p className={`font-mono text-xl font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {change >= 0 ? formatCurrency(change) : `Kurang ${formatCurrency(Math.abs(change))}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setCheckoutStep(null)}>
                                <ArrowLeft className="h-4 w-4" />Kembali
                            </Button>
                            <Button
                                variant="gradient"
                                className="flex-1 justify-center"
                                disabled={!paymentMethodId || (cashAmount < totalAmount && cashAmount > 0) || processing}
                                onClick={handleCheckout}
                            >
                                {processing ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" />Memproses...</>
                                ) : 'Selesaikan Transaksi'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success dialog */}
            <Dialog open={checkoutStep === 'success'} onOpenChange={(open) => { if (!open) { setCheckoutStep(null); setTxResult(null); } }}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 animate-scale-in">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h2 className="mb-1 text-xl font-bold">Transaksi Berhasil!</h2>
                        <p className="mb-1 text-sm text-muted-foreground">{txResult?.number}</p>
                        <p className="mb-6 text-sm text-muted-foreground">
                            Total: <b className="text-foreground">{txResult && formatCurrency(txResult.total)}</b>
                            {txResult && txResult.change > 0 && ` — Kembalian: ${formatCurrency(txResult.change)}`}
                        </p>

                        {/* Receipt preview */}
                        <div className="mb-6 w-full rounded-xl border border-border bg-card p-4 text-left">
                            <div className="mb-3 border-b border-dashed border-border pb-2 text-center text-xs font-semibold text-muted-foreground">
                                STRUK PACE POS
                            </div>
                            <div className="space-y-1">
                                {cart.length === 0 && txResult && (
                                    <p className="text-center text-xs text-muted-foreground">Item telah dikosongkan.</p>
                                )}
                            </div>
                            <div className="mt-3 border-t border-dashed border-border pt-2 text-center text-xs text-muted-foreground">
                                Terima kasih telah berbelanja! 🛍️
                            </div>
                        </div>

                        <Button variant="gradient" className="w-full justify-center" onClick={() => { setCheckoutStep(null); setTxResult(null); }}>
                            <Check className="h-4 w-4" />Transaksi Baru
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
