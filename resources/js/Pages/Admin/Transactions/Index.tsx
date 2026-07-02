import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { DataTable, type Column } from '@/Components/DataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Eye, Receipt } from 'lucide-react';
import type { PageProps } from '@/types';
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
    transactions: Transaction[];
}

export default function TransactionsIndex() {
    const { transactions } = usePage<PageProps & TransactionsPageProps>().props;

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
            header: 'No. Transaksi',
            render: (t) => <span className="font-mono text-xs font-semibold">{t.transaction_number}</span>,
        },
        {
            key: 'date',
            header: 'Tanggal',
            render: (t) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(t.transaction_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
            ),
        },
        {
            key: 'cashier',
            header: 'Kasir',
            render: (t) => t.cashier?.username ?? '—',
        },
        {
            key: 'customer',
            header: 'Pelanggan',
            render: (t) => t.customer?.full_name ?? 'Umum',
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
            header: 'Aksi',
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
            <Head title="Transaksi" />
            <AdminLayout title="Transaksi" subtitle="Lihat semua riwayat transaksi" activeRoute="/admin/transactions">
                <div className="space-y-6">
                    <DataTable
                        data={transactions}
                        columns={columns}
                        searchKeys={['transaction_number']}
                        searchPlaceholder="Cari nomor transaksi..."
                        emptyIcon={Receipt}
                        emptyMessage="Tidak ada transaksi ditemukan."
                        rowKey={(t) => t.id}
                        showRowNumber
                    />
                </div>
            </AdminLayout>
        </>
    );
}
