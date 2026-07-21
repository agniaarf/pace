import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Textarea } from '@/Components/ui/textarea';
import { Pagination } from '@/Components/Pagination';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Boxes, Search, Settings } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PaginatedResponse, PageProps } from '@/types';

interface StockItem {
    id: number;
    variant_id: number;
    quantity: number;
    minimum_quantity: number;
    variant: {
        id: number;
        sku: string;
        size: string | null;
        color: string | null;
        product: {
            id: number;
            name: string;
            category: { name: string } | null;
        };
    };
}

interface StockPageProps {
    stocks: PaginatedResponse<StockItem>;
    filters: { search?: string; filter?: string };
}

export default function StockIndex() {
    const { stocks, filters, flash } = usePage<PageProps & StockPageProps>().props;
    const [adjustStock, setAdjustStock] = useState<StockItem | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, processing, errors, reset } = useForm({
        adjustment_type: 'add',
        quantity: '',
        notes: '',
    });

    const openAdjust = (stock: StockItem) => {
        setAdjustStock(stock);
        reset();
    };

    const variantLabel = (stock: StockItem) => {
        const parts = [stock.variant.size, stock.variant.color].filter(Boolean);
        return parts.length ? `${stock.variant.product.name} (${parts.join(' / ')})` : stock.variant.product.name;
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (adjustStock) {
            post(`/admin/stock/${adjustStock.id}/adjust`, {
                onSuccess: () => { setAdjustStock(null); reset(); },
            });
        }
    };

    const getStockBadge = (stock: StockItem) => {
        if (stock.quantity <= 0) return <Badge variant="destructive">Stok habis</Badge>;
        if (stock.quantity <= stock.minimum_quantity) return <Badge variant="warning">Stok menipis</Badge>;
        return <Badge variant="success">Tersedia</Badge>;
    };

    return (
        <>
            <Head title="Manajemen Stok" />
            <AdminLayout title="Manajemen Stok" subtitle="Pantau dan atur level inventaris" activeRoute="/admin/stock">
                <div className="space-y-6">
                    {flash.success && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>}

                    {/* Filter chips */}
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/stock">
                            <Button variant={filters.filter ? 'outline' : 'default'} size="sm">Semua</Button>
                        </Link>
                        <Link href="/admin/stock?filter=low">
                            <Button variant={filters.filter === 'low' ? 'default' : 'outline'} size="sm">
                                <AlertTriangle className="h-3.5 w-3.5" />Stok Menipis
                            </Button>
                        </Link>
                        <Link href="/admin/stock?filter=out">
                            <Button variant={filters.filter === 'out' ? 'default' : 'outline'} size="sm">Stok Habis</Button>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Cari berdasarkan nama produk atau SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
                                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/admin/stock?search=${encodeURIComponent(search)}`; }} />
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No.</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Minimum</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                            <Boxes className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            Tidak ada data stok ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stocks.data.map((stock, idx) => (
                                        <TableRow key={stock.id}>
                                            <TableCell className="text-muted-foreground">{(stocks.current_page - 1) * stocks.per_page + idx + 1}</TableCell>
                                            <TableCell className="font-medium">{variantLabel(stock)}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{stock.variant.sku}</TableCell>
                                            <TableCell>{stock.variant.product.category?.name ?? '—'}</TableCell>
                                            <TableCell className="font-bold text-lg">{stock.quantity}</TableCell>
                                            <TableCell className="text-muted-foreground">{stock.minimum_quantity}</TableCell>
                                            <TableCell>{getStockBadge(stock)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => openAdjust(stock)}>
                                                    <Settings className="h-3.5 w-3.5" />Sesuaikan
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination meta={stocks.meta ?? {
                            current_page: stocks.current_page, from: stocks.from, last_page: stocks.last_page,
                            links: stocks.links, path: stocks.path, per_page: stocks.per_page,
                            to: stocks.to, total: stocks.total, next_page_url: stocks.next_page_url, prev_page_url: stocks.prev_page_url,
                        }} />
                    </div>
                </div>
            </AdminLayout>

            <Dialog open={adjustStock !== null} onOpenChange={(open) => !open && setAdjustStock(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Sesuaikan Stok</DialogTitle>
                        <DialogDescription>
                            {adjustStock && `Stok saat ini untuk "${variantLabel(adjustStock)}": ${adjustStock.quantity} unit`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipe Penyesuaian</Label>
                            <Select value={data.adjustment_type} onValueChange={(v) => setData('adjustment_type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">Tambah Stok (+)</SelectItem>
                                    <SelectItem value="subtract">Kurangi Stok (−)</SelectItem>
                                    <SelectItem value="set">Atur Jumlah Pasti (=)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Jumlah *</Label>
                            <Input id="quantity" type="number" min="0" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} placeholder="0" />
                            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} placeholder="Alasan penyesuaian..." />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAdjustStock(null)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>{processing ? 'Menyesuaikan...' : 'Sesuaikan Stok'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
