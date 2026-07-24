import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { DatePicker } from '@/Components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Clock, Download, DollarSign, Receipt, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DailyRevenue {
    date: string;
    revenue: number;
    count: number;
}

interface TopProduct {
    name: string;
    total_sold: number;
    total_revenue: number;
}

interface PeakHour {
    hour: number;
    count: number;
    revenue: number;
}

interface ShiftPerformance {
    id: number;
    cashier_name: string;
    opened_at: string;
    closed_at: string | null;
    transaction_count: number;
    total_revenue: number;
    variance: number;
}

interface ReportsPageProps {
    stats: {
        totalRevenue: number;
        totalTransactions: number;
        avgTransactionValue: number;
    };
    dailyRevenue: DailyRevenue[];
    topProducts: TopProduct[];
    peakHours: PeakHour[];
    shiftPerformance: ShiftPerformance[];
    days: number;
    from: string;
    to: string;
}

export default function ReportsIndex() {
    const { stats, dailyRevenue, topProducts, peakHours, shiftPerformance, days, from, to } = usePage<PageProps & ReportsPageProps>().props;
    const [fromInput, setFromInput] = useState(from);
    const [toInput, setToInput] = useState(to);

    const chartData = dailyRevenue.map((d) => ({
        date: new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        count: d.count,
    }));

    const productData = topProducts.map((p) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        sold: p.total_sold,
        revenue: p.total_revenue,
    }));

    const peakHourData = peakHours.map((h) => ({
        hour: `${h.hour.toString().padStart(2, '0')}:00`,
        count: h.count,
    }));
    const busiestHour = peakHours.reduce((best, h) => (h.count > best.count ? h : best), peakHours[0]);

    const cards = [
        { label: 'Total Pendapatan', value: formatCurrency(stats.totalRevenue), icon: DollarSign, gradient: 'from-green-500 to-emerald-500' },
        { label: 'Total Transaksi', value: stats.totalTransactions.toString(), icon: Receipt, gradient: 'from-orange-500 to-red-500' },
        { label: 'Rata-rata Nilai Transaksi', value: formatCurrency(stats.avgTransactionValue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
        { label: 'Produk Terjual', value: topProducts.reduce((sum, p) => sum + p.total_sold, 0).toString(), icon: ShoppingBag, gradient: 'from-violet-500 to-purple-500' },
    ];

    const applyCustomRange = () => {
        if (!fromInput || !toInput) return;
        router.get('/admin/reports', { from: fromInput, to: toInput }, { preserveState: true });
    };

    return (
        <>
            <Head title="Laporan" />
            <AdminLayout title="Laporan" subtitle="Analisis bisnis dan wawasan" activeRoute="/admin/reports">
                <div className="space-y-6">
                    {/* Period selector + export */}
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-wrap gap-2">
                                <Link href="/admin/reports?days=7"><Button variant={days === 7 ? 'default' : 'outline'} size="sm" className="w-full sm:w-auto">7 Hari Terakhir</Button></Link>
                                <Link href="/admin/reports?days=30"><Button variant={days === 30 ? 'default' : 'outline'} size="sm" className="w-full sm:w-auto">30 Hari Terakhir</Button></Link>
                                <Link href="/admin/reports?days=90"><Button variant={days === 90 ? 'default' : 'outline'} size="sm" className="w-full sm:w-auto">90 Hari Terakhir</Button></Link>
                            </div>
                            <div className="flex flex-wrap items-end gap-2 border-l border-border pl-3">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Dari</p>
                                    <DatePicker value={fromInput} onChange={setFromInput} placeholder="Tanggal mulai" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Sampai</p>
                                    <DatePicker value={toInput} onChange={setToInput} placeholder="Tanggal akhir" />
                                </div>
                                <Button variant="secondary" size="sm" onClick={applyCustomRange}>Terapkan</Button>
                            </div>
                        </div>
                        <a href={`/admin/reports/export?from=${from}&to=${to}`} className="block">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <Download className="h-4 w-4" />Ekspor CSV
                            </Button>
                        </a>
                    </div>

                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {cards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="overflow-hidden transition hover:shadow-elevated">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-semibold text-muted-foreground">{card.label}</CardTitle>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-extrabold tracking-tight">{card.value}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Revenue chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Tren Pendapatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,10,0,0.06)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9a6540' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#9a6540' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(v) => [formatCurrency(Number(v)), 'Pendapatan']}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid rgba(28,10,0,0.09)', background: '#ffffff' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} fill="url(#revenueGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada data pendapatan untuk periode ini.</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Top products */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                    Produk Terlaris
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {productData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={productData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,10,0,0.06)" />
                                            <XAxis type="number" tick={{ fontSize: 12, fill: '#9a6540' }} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9a6540' }} width={120} />
                                            <Tooltip
                                                formatter={(v) => [`${v} unit`, 'Terjual']}
                                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(28,10,0,0.09)', background: '#ffffff' }}
                                            />
                                            <Bar dataKey="sold" fill="#ea580c" radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada data penjualan produk untuk periode ini.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Peak hours */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Jam Sibuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {busiestHour && busiestHour.count > 0 && (
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Jam tersibuk: <span className="font-semibold text-foreground">{busiestHour.hour.toString().padStart(2, '0')}:00</span> ({busiestHour.count} transaksi)
                                    </p>
                                )}
                                {peakHourData.some((h) => h.count > 0) ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={peakHourData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,10,0,0.06)" />
                                            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9a6540' }} interval={2} />
                                            <YAxis tick={{ fontSize: 12, fill: '#9a6540' }} allowDecimals={false} />
                                            <Tooltip
                                                formatter={(v) => [`${v} transaksi`, 'Jumlah']}
                                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(28,10,0,0.09)', background: '#ffffff' }}
                                            />
                                            <Bar dataKey="count" fill="#9a6540" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada data transaksi untuk periode ini.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shift performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Performa Shift per Kasir
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {shiftPerformance.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kasir</TableHead>
                                            <TableHead>Dibuka</TableHead>
                                            <TableHead>Ditutup</TableHead>
                                            <TableHead>Transaksi</TableHead>
                                            <TableHead>Pendapatan</TableHead>
                                            <TableHead>Selisih Kas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shiftPerformance.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">{s.cashier_name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{new Date(s.opened_at).toLocaleString('id-ID')}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{s.closed_at ? new Date(s.closed_at).toLocaleString('id-ID') : '—'}</TableCell>
                                                <TableCell>{s.transaction_count}</TableCell>
                                                <TableCell className="font-semibold">{formatCurrency(s.total_revenue)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={s.variance === 0 ? 'success' : s.variance > 0 ? 'default' : 'destructive'}>
                                                        {s.variance > 0 ? '+' : ''}{formatCurrency(s.variance)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada shift yang ditutup pada periode ini.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>
        </>
    );
}
