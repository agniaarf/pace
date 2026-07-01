import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { Boxes, DollarSign, ShoppingCart, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import type { PageProps } from '@/types';

interface AdminDashboardProps {
    stats: {
        totalProducts: number;
        totalCustomers: number;
        totalTransactions: number;
        lowStockCount: number;
    };
}

export default function Dashboard() {
    const { stats } = usePage<PageProps & AdminDashboardProps>().props;

    const cards = [
        {
            label: 'Total Products',
            value: stats.totalProducts,
            icon: Boxes,
            gradient: 'from-orange-500 to-red-500',
        },
        {
            label: 'Total Customers',
            value: stats.totalCustomers,
            icon: Users,
            gradient: 'from-amber-500 to-orange-500',
        },
        {
            label: 'Total Transactions',
            value: stats.totalTransactions,
            icon: ShoppingCart,
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Low Stock Alerts',
            value: stats.lowStockCount,
            icon: AlertTriangle,
            gradient: 'from-red-500 to-rose-500',
        },
    ];

    return (
        <>
            <Head title="Admin Dashboard" />
            <AdminLayout title="Dashboard" subtitle="Overview of your store performance" activeRoute="/admin/dashboard">
                <div className="space-y-6">
                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {cards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="overflow-hidden transition hover:shadow-elevated">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                                            {card.label}
                                        </CardTitle>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-extrabold tracking-tight">
                                            {card.value.toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Quick actions */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    No recent activity to show. Start by adding products and processing transactions.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Revenue Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Revenue charts will appear here once transactions are recorded.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
