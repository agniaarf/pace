import { TransactionList, type TransactionData } from '@/Components/TransactionList';
import KasirLayout from '@/Layouts/KasirLayout';
import { Head, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface TransactionsPageProps {
    transactions: TransactionData[];
}

export default function Transactions() {
    const { transactions } = usePage<PageProps & TransactionsPageProps>().props;

    return (
        <>
            <Head title="Riwayat Transaksi" />
            <KasirLayout title="Riwayat Transaksi" subtitle="Daftar transaksi Anda" activeRoute="/kasir/transactions">
                <TransactionList transactions={transactions} />
            </KasirLayout>
        </>
    );
}
