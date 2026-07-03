import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Banknote,
    CreditCard,
    Mail,
    Printer,
    QrCode,
    Search,
    Smartphone,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export interface TransactionItem {
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface TransactionData {
    id: number;
    transaction_number: string;
    created_at: string;
    total_amount: number;
    status: string;
    customer_name: string;
    cashier_name?: string;
    payment_method_code: string;
    payment_method_label: string;
    item_count: number;
    items: TransactionItem[];
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    amount_paid: number;
    change_amount: number;
}

interface TransactionListProps {
    transactions: TransactionData[];
    showCashier?: boolean;
}

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
    cash: Banknote,
    qris: QrCode,
    transfer: Smartphone,
    debit: CreditCard,
    ewallet: CreditCard,
};

export function TransactionList({ transactions, showCashier = false }: TransactionListProps) {
    const [search, setSearch] = useState('');
    const [selectedTrx, setSelectedTrx] = useState<TransactionData | null>(null);

    const filtered = useMemo(() =>
        transactions.filter(t =>
            t.transaction_number.toLowerCase().includes(search.toLowerCase()) ||
            t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            (t.cashier_name ?? '').toLowerCase().includes(search.toLowerCase())),
        [transactions, search]);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Riwayat Transaksi ({filtered.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nomor transaksi, pelanggan, atau kasir..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                {search ? 'Transaksi tidak ditemukan.' : 'Belum ada transaksi.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((trx) => {
                                const Icon = PAYMENT_ICONS[trx.payment_method_code] ?? Banknote;
                                return (
                                    <div
                                        key={trx.id}
                                        className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{trx.transaction_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {trx.customer_name} · {trx.item_count} item · {trx.payment_method_label}
                                                    {showCashier && trx.cashier_name && (
                                                        <span className="text-muted-foreground/70"> · Kasir: {trx.cashier_name}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-bold text-foreground">{formatCurrency(trx.total_amount)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(trx.created_at).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <Badge variant={trx.status === 'completed' ? 'success' : 'secondary'}>
                                                {trx.status === 'completed' ? 'Selesai' : trx.status}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedTrx(trx)}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Receipt preview modal */}
            <Dialog open={!!selectedTrx} onOpenChange={(open) => { if (!open) setSelectedTrx(null); }}>
                <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pratinjau Struk</DialogTitle>
                    </DialogHeader>
                    {selectedTrx && (
                        <div className="space-y-4">
                            <div className="w-full rounded-xl border border-border bg-card p-4 text-left" data-receipt>
                                <div className="mb-3 border-b border-dashed border-border pb-2 text-center">
                                    <p className="text-sm font-bold text-foreground">PACE POS</p>
                                    <p className="text-xs text-muted-foreground">{new Date(selectedTrx.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="mb-2 text-xs text-muted-foreground">
                                    No: <span className="font-medium text-foreground">{selectedTrx.transaction_number}</span>
                                </div>
                                <div className="mb-2 text-xs text-muted-foreground">
                                    Pelanggan: <span className="font-medium text-foreground">{selectedTrx.customer_name}</span>
                                </div>
                                {showCashier && selectedTrx.cashier_name && (
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        Kasir: <span className="font-medium text-foreground">{selectedTrx.cashier_name}</span>
                                    </div>
                                )}
                                <div className="mb-2 max-h-40 space-y-1 overflow-y-auto border-t border-dashed border-border pt-2">
                                    {selectedTrx.items.map((item, idx) => (
                                        <div key={idx} className="text-xs">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-foreground">{item.name}</span>
                                                <span className="font-mono">{formatCurrency(item.subtotal)}</span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                {item.quantity} x {formatCurrency(item.unit_price)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1 border-t border-dashed border-border pt-2 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-mono">{formatCurrency(selectedTrx.subtotal)}</span>
                                    </div>
                                    {selectedTrx.discount_amount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Diskon</span>
                                            <span className="font-mono">−{formatCurrency(selectedTrx.discount_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Pajak (11%)</span>
                                        <span className="font-mono">{formatCurrency(selectedTrx.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
                                        <span>Total</span>
                                        <span className="font-mono text-primary">{formatCurrency(selectedTrx.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Bayar ({selectedTrx.payment_method_label})</span>
                                        <span className="font-mono">{formatCurrency(selectedTrx.amount_paid)}</span>
                                    </div>
                                    {selectedTrx.change_amount > 0 && (
                                        <div className="flex justify-between font-semibold text-emerald-600">
                                            <span>Kembalian</span>
                                            <span className="font-mono">{formatCurrency(selectedTrx.change_amount)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 border-t border-dashed border-border pt-2 text-center">
                                    <p className="text-xs text-muted-foreground">Own Your Pace, Unleash Your Power</p>
                                    <div className="mt-2 flex justify-center">
                                        <div className="font-mono text-xs tracking-widest text-foreground">||| |||| | ||| ||</div>
                                    </div>
                                    <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedTrx.transaction_number}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 justify-center" onClick={() => window.print()}>
                                    <Printer className="h-4 w-4" />Cetak Struk
                                </Button>
                                <Button variant="gradient" className="flex-1 justify-center" onClick={() => window.alert('Fitur kirim email akan segera hadir.')}>
                                    <Mail className="h-4 w-4" />Kirim Email
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
