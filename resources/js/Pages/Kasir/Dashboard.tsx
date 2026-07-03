import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import KasirLayout from '@/Layouts/KasirLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ShoppingCart, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface RecentTransaction {
    id: number;
    transaction_number: string;
    created_at: string;
    total_amount: number;
    status: string;
    customer_name: string;
    payment_method_code: string;
    item_count: number;
}

interface KasirDashboardProps {
    stats: {
        todayTransactions: number;
        todayRevenue: number;
        totalProducts: number;
        availableProducts: number;
        transactionDelta: number;
        revenueDelta: number;
    };
    recentTransactions: RecentTransaction[];
}

function LiveClock() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-foreground">{timeStr}</p>
            <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
    );
}

const PAYMENT_ICONS: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    transfer: 'Transfer',
    debit: 'Kartu',
    ewallet: 'E-Wallet',
};

export default function Dashboard() {
    const { stats, recentTransactions } = usePage<PageProps & KasirDashboardProps>().props;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
    const cashierName = usePage<PageProps>().props.auth?.user?.username || 'Kasir';

    return (
        <>
            <Head title="Dasbor Kasir" />
            <KasirLayout title="Dasbor" subtitle="Ringkasan kasir Anda hari ini" activeRoute="/kasir/dashboard">
                <div className="space-y-6">
                    {/* Greeting + Clock */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {greeting}, {cashierName}!
                            </h1>
                            <p className="text-muted-foreground">Semoga harimu menyenangkan dan produktif.</p>
                        </div>
                        <LiveClock />
                    </div>

                    {/* CTA Banner */}
                    <Link href="/kasir/cashier">
                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-6 shadow-glow transition hover:shadow-elevated">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                        <ShoppingCart className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Mulai Transaksi Baru</h2>
                                        <p className="text-sm text-white/80">Pilih produk dan proses pembayaran dengan cepat</p>
                                    </div>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition group-hover:translate-x-1">
                                    <ArrowRight className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Today's Transactions */}
                        <Card className="overflow-hidden transition hover:shadow-elevated">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Transaksi Hari Ini
                                </CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-extrabold tracking-tight">
                                        {stats.todayTransactions}
                                    </p>
                                    {stats.transactionDelta !== 0 && (
                                        <div className={`flex items-center gap-1 text-sm font-semibold ${
                                            stats.transactionDelta > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {stats.transactionDelta > 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {Math.abs(stats.transactionDelta)}%
                                        </div>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">vs kemarin</p>
                            </CardContent>
                        </Card>

                        {/* Today's Revenue */}
                        <Card className="overflow-hidden transition hover:shadow-elevated">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Pendapatan Hari Ini
                                </CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-sm">
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-extrabold tracking-tight">
                                        {formatCurrency(stats.todayRevenue)}
                                    </p>
                                    {stats.revenueDelta !== 0 && (
                                        <div className={`flex items-center gap-1 text-sm font-semibold ${
                                            stats.revenueDelta > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {stats.revenueDelta > 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {Math.abs(stats.revenueDelta)}%
                                        </div>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">vs kemarin</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Transaksi Terakhir Saya</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/kasir/transactions" className="flex items-center gap-1 text-sm text-primary hover:underline">
                                    Lihat riwayat
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">Belum ada transaksi. Mulai transaksi pertama Anda sekarang!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentTransactions.map((trx) => (
                                        <div
                                            key={trx.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                    <Wallet className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{trx.transaction_number}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {trx.customer_name} · {trx.item_count} item · {PAYMENT_ICONS[trx.payment_method_code] || trx.payment_method_code}
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </KasirLayout>
        </>
    );
}
