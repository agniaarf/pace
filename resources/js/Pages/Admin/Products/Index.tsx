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
import { Switch } from '@/Components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Textarea } from '@/Components/ui/textarea';
import { Pagination } from '@/Components/Pagination';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Edit, Package, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PaginatedResponse, PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Category { id: number; name: string }
interface Discount { id: number; name: string }
interface Stock { id: number; quantity: number; minimum_quantity: number }
interface Product {
    id: number;
    category_id: number | null;
    discount_id: number | null;
    name: string;
    sku: string | null;
    brand: string | null;
    size: string | null;
    cost_price: string;
    selling_price: string;
    description: string | null;
    status: 'active' | 'inactive';
    category?: Category | null;
    discount?: Discount | null;
    stock?: Stock | null;
}

interface ProductsPageProps {
    products: PaginatedResponse<Product>;
    categories: Category[];
    discounts: Discount[];
    filters: { search?: string; category_id?: string; status?: string };
}

export default function ProductsIndex() {
    const { products, categories, discounts, filters, flash } = usePage<PageProps & ProductsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        category_id: '',
        discount_id: '',
        name: '',
        sku: '',
        brand: '',
        size: '',
        cost_price: '',
        selling_price: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
        stock_quantity: '',
        minimum_quantity: '',
    });

    const openCreate = () => {
        setEditingProduct(null);
        reset();
        setDialogOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setData({
            category_id: product.category_id?.toString() ?? '',
            discount_id: product.discount_id?.toString() ?? '',
            name: product.name,
            sku: product.sku ?? '',
            brand: product.brand ?? '',
            size: product.size ?? '',
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            description: product.description ?? '',
            status: product.status,
            stock_quantity: '',
            minimum_quantity: '',
        });
        setDialogOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingProduct) {
            put(`/admin/products/${editingProduct.id}`, {
                onSuccess: () => { setDialogOpen(false); reset(); },
            });
        } else {
            post('/admin/products', {
                onSuccess: () => { setDialogOpen(false); reset(); },
            });
        }
    };

    const handleDelete = () => {
        if (deleteId) {
            useForm({}).delete(`/admin/products/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    return (
        <>
            <Head title="Products" />
            <AdminLayout title="Products" subtitle="Manage your product catalog" activeRoute="/admin/products">
                <div className="space-y-6">
                    {flash.success && (
                        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                            {flash.error}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            window.location.href = `/admin/products?search=${encodeURIComponent(search)}`;
                                        }
                                    }}
                                />
                            </div>
                            <Link href={`/admin/products?search=${encodeURIComponent(search)}`} preserveScroll>
                                <Button variant="outline" size="sm">Filter</Button>
                            </Link>
                        </div>
                        <Button variant="gradient" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Add Product
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                            <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            No products found. Click "Add Product" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.data.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    {product.name}
                                                    {product.brand && (
                                                        <span className="text-xs text-muted-foreground">{product.brand}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {product.sku ?? '—'}
                                            </TableCell>
                                            <TableCell>{product.category?.name ?? '—'}</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(Number(product.selling_price))}</TableCell>
                                            <TableCell>
                                                {product.stock ? (
                                                    <Badge variant={product.stock.quantity <= 0 ? 'destructive' : product.stock.quantity <= (product.stock.minimum_quantity || 5) ? 'warning' : 'success'}>
                                                        {product.stock.quantity} units
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">No stock</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                                    {product.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination meta={products.meta ?? {
                            current_page: products.current_page,
                            from: products.from,
                            last_page: products.last_page,
                            links: products.links,
                            path: products.path,
                            per_page: products.per_page,
                            to: products.to,
                            total: products.total,
                            next_page_url: products.next_page_url,
                            prev_page_url: products.prev_page_url,
                        }} />
                    </div>
                </div>
            </AdminLayout>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Update product information.' : 'Create a new product in your catalog.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Nike Air Zoom" />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="e.g. NZ-001" />
                                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" value={data.brand} onChange={(e) => setData('brand', e.target.value)} placeholder="e.g. Nike" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="size">Size</Label>
                                <Input id="size" value={data.size} onChange={(e) => setData('size', e.target.value)} placeholder="e.g. 42" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Discount</Label>
                                <Select value={data.discount_id} onValueChange={(v) => setData('discount_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="No discount" /></SelectTrigger>
                                    <SelectContent>
                                        {discounts.map((disc) => (
                                            <SelectItem key={disc.id} value={disc.id.toString()}>{disc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost_price">Cost Price *</Label>
                                <Input id="cost_price" type="number" step="0.01" value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} placeholder="0" />
                                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling_price">Selling Price *</Label>
                                <Input id="selling_price" type="number" step="0.01" value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} placeholder="0" />
                                {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
                            </div>
                            {!editingProduct && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="stock_quantity">Initial Stock</Label>
                                        <Input id="stock_quantity" type="number" value={data.stock_quantity} onChange={(e) => setData('stock_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minimum_quantity">Minimum Stock</Label>
                                        <Input id="minimum_quantity" type="number" value={data.minimum_quantity} onChange={(e) => setData('minimum_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Product description..." rows={3} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Label htmlFor="status">Active</Label>
                            <Switch checked={data.status === 'active'} onCheckedChange={(checked) => setData('status', checked ? 'active' : 'inactive')} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>
                                {processing ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Product?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The product and its stock data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
