import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import KasirLayout from '@/Layouts/KasirLayout';
import { Head, usePage } from '@inertiajs/react';
import { Boxes, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface KasirDashboardProps {
    stats: {
        todayTransactions: number;
        todayRevenue: number;
        totalProducts: number;
        availableProducts: number;
    };
}

export default function Dashboard() {
    const { stats } = usePage<PageProps & KasirDashboardProps>().props;

    const cards = [
        {
            label: "Today's Transactions",
            value: stats.todayTransactions.toString(),
            icon: ShoppingCart,
            gradient: 'from-orange-500 to-red-500',
        },
        {
            label: "Today's Revenue",
            value: formatCurrency(stats.todayRevenue),
            icon: Wallet,
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Total Products',
            value: stats.totalProducts.toString(),
            icon: Boxes,
            gradient: 'from-amber-500 to-orange-500',
        },
        {
            label: 'Available Products',
            value: stats.availableProducts.toString(),
            icon: TrendingUp,
            gradient: 'from-violet-500 to-purple-500',
        },
    ];

    return (
        <>
            <Head title="Kasir Dashboard" />
            <KasirLayout title="Dashboard" subtitle="Your cashier overview for today" activeRoute="/kasir/dashboard">
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
                                        <p className="text-2xl font-extrabold tracking-tight">
                                            {card.value}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Quick start card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Start</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Use the <span className="font-semibold text-foreground">Cashier</span> page to start processing transactions.
                                You can search products, add them to cart, and complete checkout in seconds.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </KasirLayout>
        </>
    );
}
