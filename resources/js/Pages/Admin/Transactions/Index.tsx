import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Pagination } from '@/Components/Pagination';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Eye, Receipt, Search } from 'lucide-react';
import { useState } from 'react';
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
    filters: { search?: string; status?: string };
}

export default function TransactionsIndex() {
    const { transactions, filters } = usePage<PageProps & TransactionsPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const statusVariant = (status: Transaction['status']) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

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

                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search transaction number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
                            onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/admin/transactions?search=${encodeURIComponent(search)}`; }} />
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                            <Receipt className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.data.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-mono text-xs font-semibold">{t.transaction_number}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(t.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </TableCell>
                                            <TableCell>{t.cashier?.username ?? '—'}</TableCell>
                                            <TableCell>{t.customer?.full_name ?? 'Walk-in'}</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(Number(t.total_amount))}</TableCell>
                                            <TableCell><Badge variant={statusVariant(t.status)} className="capitalize">{t.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/transactions/${t.id}`}>
                                                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination meta={transactions.meta ?? {
                            current_page: transactions.current_page, from: transactions.from, last_page: transactions.last_page,
                            links: transactions.links, path: transactions.path, per_page: transactions.per_page,
                            to: transactions.to, total: transactions.total, next_page_url: transactions.next_page_url, prev_page_url: transactions.prev_page_url,
                        }} />
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
