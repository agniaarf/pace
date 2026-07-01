import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Boxes, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PageProps } from '@/types';

interface RecentTransaction {
    id: number;
    transaction_number: string;
    transaction_date: string;
    total_amount: number;
    status: string;
    cashier_name: string | null;
    customer_name: string | null;
}

interface DailyRevenue {
    date: string;
    revenue: number;
    count: number;
}

interface LowStockItem {
    id: number;
    product_name: string;
    quantity: number;
    minimum_quantity: number;
}

interface AdminDashboardProps {
    stats: {
        totalProducts: number;
        totalCustomers: number;
        totalTransactions: number;
        lowStockCount: number;
        totalRevenue: number;
        todayRevenue: number;
    };
    recentTransactions: RecentTransaction[];
    dailyRevenue: DailyRevenue[];
    lowStockItems: LowStockItem[];
}

export default function Dashboard() {
    const { stats, recentTransactions, dailyRevenue, lowStockItems } = usePage<PageProps & AdminDashboardProps>().props;

    const cards = [
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, gradient: 'from-orange-500 to-red-500' },
        { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
        { label: 'Total Transactions', value: stats.totalTransactions.toLocaleString(), icon: ShoppingCart, gradient: 'from-green-500 to-emerald-500' },
        { label: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: Boxes, gradient: 'from-blue-500 to-cyan-500' },
    ];

    const chartData = dailyRevenue.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: d.revenue,
        count: d.count,
    }));

    return (
        <>
            <Head title="Admin Dashboard" />
            <AdminLayout title="Dashboard" subtitle="Overview of your store performance" activeRoute="/admin/dashboard">
                <div className="space-y-6">
                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {cards.map((card, idx) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="animate-fade-in-up overflow-hidden transition hover:shadow-elevated" style={{ animationDelay: `${idx * 80}ms` }}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                                            {card.label}
                                        </CardTitle>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-extrabold tracking-tight">
                                            {card.value}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Revenue chart + low stock */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Revenue Trend (Last 7 Days)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={2} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-[280px] flex-col items-center justify-center text-muted-foreground">
                                        <TrendingUp className="mb-3 h-10 w-10 opacity-30" />
                                        <p className="text-sm">No transaction data yet. Revenue charts will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Low Stock Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {lowStockItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {lowStockItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{item.product_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Stock: <span className={item.quantity <= 0 ? 'font-bold text-red-500' : 'font-bold text-amber-600'}>{item.quantity}</span> / Min: {item.minimum_quantity}
                                                    </p>
                                                </div>
                                                <Badge variant={item.quantity <= 0 ? 'destructive' : 'default'}>
                                                    {item.quantity <= 0 ? 'Out' : 'Low'}
                                                </Badge>
                                            </div>
                                        ))}
                                        <Link href="/admin/stock">
                                            <Button variant="outline" size="sm" className="w-full justify-center">
                                                View All Stock <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                                        <Boxes className="mb-3 h-8 w-8 opacity-30" />
                                        <p className="text-sm">All products are well stocked.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent transactions */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                    Recent Transactions
                                </CardTitle>
                                <Link href="/admin/transactions">
                                    <Button variant="ghost" size="sm">
                                        View All <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {recentTransactions.map((tx) => (
                                        <Link key={tx.id} href={`/admin/transactions/${tx.id}`}>
                                            <div className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-primary hover:bg-accent">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                                                        <ShoppingCart className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{tx.transaction_number}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {tx.customer_name ?? 'Walk-in'} · {tx.cashier_name ?? 'Unknown'} · {new Date(tx.transaction_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-sm font-bold">{formatCurrency(tx.total_amount)}</span>
                                                    <Badge variant={tx.status === 'completed' ? 'success' : 'default'}>
                                                        {tx.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-[160px] flex-col items-center justify-center text-muted-foreground">
                                    <ShoppingCart className="mb-3 h-8 w-8 opacity-30" />
                                    <p className="text-sm">No transactions yet. Process sales from the cashier page.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>
        </>
    );
}
