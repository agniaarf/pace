import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, Download, DollarSign, Receipt, ShoppingBag, TrendingUp } from 'lucide-react';
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

interface ReportsPageProps {
    stats: {
        totalRevenue: number;
        totalTransactions: number;
        avgTransactionValue: number;
    };
    dailyRevenue: DailyRevenue[];
    topProducts: TopProduct[];
    days: number;
}

export default function ReportsIndex() {
    const { stats, dailyRevenue, topProducts, days } = usePage<PageProps & ReportsPageProps>().props;

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

    const cards = [
        { label: 'Total Pendapatan', value: formatCurrency(stats.totalRevenue), icon: DollarSign, gradient: 'from-green-500 to-emerald-500' },
        { label: 'Total Transaksi', value: stats.totalTransactions.toString(), icon: Receipt, gradient: 'from-orange-500 to-red-500' },
        { label: 'Rata-rata Nilai Transaksi', value: formatCurrency(stats.avgTransactionValue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
        { label: 'Produk Terjual', value: topProducts.reduce((sum, p) => sum + p.total_sold, 0).toString(), icon: ShoppingBag, gradient: 'from-violet-500 to-purple-500' },
    ];

    return (
        <>
            <Head title="Laporan" />
            <AdminLayout title="Laporan" subtitle="Analisis bisnis dan wawasan" activeRoute="/admin/reports">
                <div className="space-y-6">
                    {/* Period selector + export */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/reports?days=7"><Button variant={days === 7 ? 'default' : 'outline'} size="sm" className="w-full sm:w-auto">7 Hari Terakhir</Button></Link>
                            <Link href="/admin/reports?days=30"><Button variant={days === 30 ? 'default' : 'outline'} size="sm" className="w-full sm:w-auto">30 Hari Terakhir</Button></Link>
                            <Link href="/admin/reports?days=90"><Button variant={days === 90 ? 'default' : 'outline'} size="sm" className="w-full sm:w-auto">90 Hari Terakhir</Button></Link>
                        </div>
                        <a href={`/admin/reports/export?days=${days}`} className="block">
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
                </div>
            </AdminLayout>
        </>
    );
}
