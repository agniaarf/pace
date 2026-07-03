import { TransactionList, type TransactionData } from '@/Components/TransactionList';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface TransactionsPageProps {
    transactions: TransactionData[];
}

export default function TransactionsIndex() {
    const { transactions } = usePage<PageProps & TransactionsPageProps>().props;

    return (
        <>
            <Head title="Transaksi" />
            <AdminLayout title="Transaksi" subtitle="Lihat semua riwayat transaksi" activeRoute="/admin/transactions">
                <TransactionList transactions={transactions} showCashier />
            </AdminLayout>
        </>
    );
}
