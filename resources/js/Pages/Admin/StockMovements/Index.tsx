import { Head, Link } from '@inertiajs/react';
import { DataTable, type Column } from '@/Components/DataTable';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AdminLayout from '@/Layouts/AdminLayout';
import { History } from 'lucide-react';
import { useState } from 'react';

interface StockMovement {
    id: number;
    product_id: number;
    stock_id: number;
    transaction_id: number | null;
    movement_type: 'in' | 'out';
    quantity_before: number;
    quantity_after: number;
    notes: string | null;
    transaction_date: string;
    created_at: string;
    product: {
        id: number;
        name: string;
    };
    transaction: {
        id: number;
        transaction_number: string;
    } | null;
}

interface PageProps {
    movements: StockMovement[];
    products: Array<{ id: number; name: string }>;
}

export default function Index({ movements, products }: PageProps) {
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');

    const filteredMovements = movements.filter((movement) => {
        if (selectedProduct && movement.product_id !== parseInt(selectedProduct)) return false;
        if (selectedType && movement.movement_type !== selectedType) return false;
        return true;
    });

    const columns: Column<StockMovement>[] = [
        {
            key: 'transaction_date',
            header: 'Tanggal',
            render: (movement) => (
                <span className="text-sm">
                    {new Date(movement.transaction_date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            key: 'product',
            header: 'Produk',
            render: (movement) => <span className="font-medium">{movement.product.name}</span>,
        },
        {
            key: 'movement_type',
            header: 'Tipe',
            render: (movement) => (
                <Badge variant={movement.movement_type === 'in' ? 'success' : 'destructive'}>
                    {movement.movement_type === 'in' ? 'Masuk' : 'Keluar'}
                </Badge>
            ),
        },
        {
            key: 'quantity_before',
            header: 'Sebelum',
            render: (movement) => <span>{movement.quantity_before}</span>,
        },
        {
            key: 'quantity_after',
            header: 'Sesudah',
            render: (movement) => <span>{movement.quantity_after}</span>,
        },
        {
            key: 'change',
            header: 'Perubahan',
            render: (movement) => (
                <span className="font-semibold">
                    {movement.movement_type === 'in' ? '+' : '-'}
                    {Math.abs(movement.quantity_after - movement.quantity_before)}
                </span>
            ),
        },
        {
            key: 'transaction',
            header: 'Transaksi',
            render: (movement) =>
                movement.transaction ? (
                    <Link
                        href={`/admin/transactions/${movement.transaction.id}`}
                        className="text-primary hover:underline"
                    >
                        {movement.transaction.transaction_number}
                    </Link>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            key: 'notes',
            header: 'Catatan',
            render: (movement) => (
                <span className="max-w-xs truncate text-sm text-muted-foreground">
                    {movement.notes || '-'}
                </span>
            ),
        },
    ];

    return (
        <AdminLayout title="Riwayat Stok" subtitle="Audit pergerakan stok masuk dan keluar" activeRoute="/admin/stock-movements">
            <Head title="Riwayat Stok" />

            <div className="space-y-6">
                <DataTable
                    data={filteredMovements}
                    columns={columns}
                    searchPlaceholder="Cari riwayat stok..."
                    searchFn={(row, query) => {
                        const q = query.toLowerCase();
                        const nameMatch = row.product.name.toLowerCase().includes(q);
                        const notesMatch = row.notes ? row.notes.toLowerCase().includes(q) : false;
                        return nameMatch || notesMatch;
                    }}
                    toolbarLeft={
                        <div className="flex gap-2">
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Semua Produk" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Produk</SelectItem>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Tipe</SelectItem>
                                    <SelectItem value="in">Masuk</SelectItem>
                                    <SelectItem value="out">Keluar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                    emptyIcon={History}
                    emptyMessage="Tidak ada riwayat stok ditemukan"
                    showRowNumber
                />
            </div>
        </AdminLayout>
    );
}
