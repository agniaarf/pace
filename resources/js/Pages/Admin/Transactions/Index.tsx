import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { DataTable, type Column } from '@/Components/DataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Eye, Receipt } from 'lucide-react';
import type { PaginatedResponse, PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
    id: number;
    transaction_number: string;
    cashier_id: number;
    customer_id: number | null;
    transaction_date: string;
    status: 'draft' | 'pending' | 'completed' | 'cancelled';
    total_amount: string;
    subtotal: string;
    cashier: { id: number; username: string } | null;
    customer: { id: number; full_name: string } | null;
}

interface TransactionsPageProps {
    transactions: PaginatedResponse<Transaction>;
    filters: { search?: string; status?: string; per_page?: string };
}

export default function TransactionsIndex() {
    const { transactions, filters } = usePage<PageProps & TransactionsPageProps>().props;

    const statusVariant = (status: Transaction['status']) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    const columns: Column<Transaction>[] = [
        {
            key: 'transaction_number',
            header: 'Transaction #',
            render: (t) => <span className="font-mono text-xs font-semibold">{t.transaction_number}</span>,
        },
        {
            key: 'date',
            header: 'Date',
            render: (t) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(t.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
            ),
        },
        {
            key: 'cashier',
            header: 'Cashier',
            render: (t) => t.cashier?.username ?? '—',
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (t) => t.customer?.full_name ?? 'Walk-in',
        },
        {
            key: 'total',
            header: 'Total',
            render: (t) => <span className="font-semibold">{formatCurrency(Number(t.total_amount))}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (t) => <Badge variant={statusVariant(t.status)} className="capitalize">{t.status}</Badge>,
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (t) => (
                <Link href={`/admin/transactions/${t.id}`}>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                </Link>
            ),
        },
    ];

    return (
        <>
            <Head title="Transactions" />
            <AdminLayout title="Transactions" subtitle="View all transaction history" activeRoute="/admin/transactions">
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/transactions"><Button variant={filters.status ? 'outline' : 'default'} size="sm">All</Button></Link>
                        <Link href="/admin/transactions?status=completed"><Button variant={filters.status === 'completed' ? 'default' : 'outline'} size="sm">Completed</Button></Link>
                        <Link href="/admin/transactions?status=pending"><Button variant={filters.status === 'pending' ? 'default' : 'outline'} size="sm">Pending</Button></Link>
                        <Link href="/admin/transactions?status=cancelled"><Button variant={filters.status === 'cancelled' ? 'default' : 'outline'} size="sm">Cancelled</Button></Link>
                    </div>

                    <DataTable
                        data={transactions}
                        columns={columns}
                        routeName="admin.transactions.index"
                        dataKey="transactions"
                        filters={filters}
                        searchPlaceholder="Search transaction number..."
                        emptyIcon={Receipt}
                        emptyMessage="No transactions found."
                        rowKey={(t) => t.id}
                    />
                </div>
            </AdminLayout>
        </>
    );
}
