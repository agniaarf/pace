import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Receipt } from 'lucide-react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TransactionItem {
    id: number;
    quantity: number;
    unit_price: string;
    item_discount: string;
    subtotal: string;
    product: { id: number; name: string; sku: string | null };
}

interface TransactionDetail {
    id: number;
    transaction_number: string;
    transaction_date: string;
    status: string;
    notes: string | null;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total_amount: string;
    amount_paid: string;
    change_amount: string;
    cashier: { id: number; username: string } | null;
    customer: { id: number; full_name: string } | null;
    paymentMethod: { id: number; label: string } | null;
    items: TransactionItem[];
}

interface TransactionShowProps {
    transaction: TransactionDetail;
}

export default function TransactionShow() {
    const { transaction } = usePage<PageProps & TransactionShowProps>().props;

    return (
        <>
            <Head title={`Transaksi ${transaction.transaction_number}`} />
            <AdminLayout title="Detail Transaksi" subtitle={transaction.transaction_number} activeRoute="/admin/transactions">
                <div className="space-y-6">
                    <Link href="/admin/transactions">
                        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" />Kembali ke Transaksi</Button>
                    </Link>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Items */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        Item Dibeli
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">No.</TableHead>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Jumlah</TableHead>
                                                <TableHead>Harga Satuan</TableHead>
                                                <TableHead>Diskon</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transaction.items.map((item, idx) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.product.name}
                                                        {item.product.sku && (
                                                            <span className="ml-2 font-mono text-xs text-muted-foreground">{item.product.sku}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>{formatCurrency(Number(item.unit_price))}</TableCell>
                                                    <TableCell>{Number(item.item_discount) > 0 ? formatCurrency(Number(item.item_discount)) : '—'}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(Number(item.subtotal))}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle>Ringkasan Pembayaran</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(Number(transaction.subtotal))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Diskon</span>
                                        <span className="font-medium">{formatCurrency(Number(transaction.discount_amount))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Pajak</span>
                                        <span className="font-medium">{formatCurrency(Number(transaction.tax_amount))}</span>
                                    </div>
                                    <div className="border-t border-border pt-3 flex justify-between">
                                        <span className="font-bold">Total</span>
                                        <span className="font-bold text-primary text-lg">{formatCurrency(Number(transaction.total_amount))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Jumlah Dibayar</span>
                                        <span className="font-medium">{formatCurrency(Number(transaction.amount_paid))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Kembalian</span>
                                        <span className="font-medium">{formatCurrency(Number(transaction.change_amount))}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Info Transaksi</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'} className="capitalize">{transaction.status}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tanggal</span>
                                        <span>{new Date(transaction.transaction_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Kasir</span>
                                        <span>{transaction.cashier?.username ?? '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pelanggan</span>
                                        <span>{transaction.customer?.full_name ?? 'Umum'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pembayaran</span>
                                        <span>{transaction.paymentMethod?.label ?? '—'}</span>
                                    </div>
                                    {transaction.notes && (
                                        <div className="pt-2 border-t border-border">
                                            <span className="text-muted-foreground">Catatan: </span>
                                            <span>{transaction.notes}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
