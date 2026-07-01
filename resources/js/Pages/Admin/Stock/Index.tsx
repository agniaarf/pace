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
    product_id: number;
    quantity: number;
    minimum_quantity: number;
    product: {
        id: number;
        name: string;
        sku: string | null;
        category: { name: string } | null;
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

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (adjustStock) {
            post(`/admin/stock/${adjustStock.id}/adjust`, {
                onSuccess: () => { setAdjustStock(null); reset(); },
            });
        }
    };

    const getStockBadge = (stock: StockItem) => {
        if (stock.quantity <= 0) return <Badge variant="destructive">Out of stock</Badge>;
        if (stock.quantity <= stock.minimum_quantity) return <Badge variant="warning">Low stock</Badge>;
        return <Badge variant="success">In stock</Badge>;
    };

    return (
        <>
            <Head title="Stock Management" />
            <AdminLayout title="Stock Management" subtitle="Monitor and adjust inventory levels" activeRoute="/admin/stock">
                <div className="space-y-6">
                    {flash.success && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>}

                    {/* Filter chips */}
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/stock">
                            <Button variant={filters.filter ? 'outline' : 'default'} size="sm">All</Button>
                        </Link>
                        <Link href="/admin/stock?filter=low">
                            <Button variant={filters.filter === 'low' ? 'default' : 'outline'} size="sm">
                                <AlertTriangle className="h-3.5 w-3.5" />Low Stock
                            </Button>
                        </Link>
                        <Link href="/admin/stock?filter=out">
                            <Button variant={filters.filter === 'out' ? 'default' : 'outline'} size="sm">Out of Stock</Button>
                        </Link>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search by product name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
                                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/admin/stock?search=${encodeURIComponent(search)}`; }} />
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Minimum</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                            <Boxes className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            No stock records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stocks.data.map((stock) => (
                                        <TableRow key={stock.id}>
                                            <TableCell className="font-medium">{stock.product.name}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{stock.product.sku ?? '—'}</TableCell>
                                            <TableCell>{stock.product.category?.name ?? '—'}</TableCell>
                                            <TableCell className="font-bold text-lg">{stock.quantity}</TableCell>
                                            <TableCell className="text-muted-foreground">{stock.minimum_quantity}</TableCell>
                                            <TableCell>{getStockBadge(stock)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => openAdjust(stock)}>
                                                    <Settings className="h-3.5 w-3.5" />Adjust
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                        <DialogDescription>
                            {adjustStock && `Current stock for "${adjustStock.product.name}": ${adjustStock.quantity} units`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <Select value={data.adjustment_type} onValueChange={(v) => setData('adjustment_type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">Add Stock (+)</SelectItem>
                                    <SelectItem value="subtract">Subtract Stock (−)</SelectItem>
                                    <SelectItem value="set">Set Exact Amount (=)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input id="quantity" type="number" min="0" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} placeholder="0" />
                            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} placeholder="Reason for adjustment..." />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAdjustStock(null)}>Cancel</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>{processing ? 'Adjusting...' : 'Adjust Stock'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
