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
import { Textarea } from '@/Components/ui/textarea';
import { DataTable, type Column } from '@/Components/DataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Edit, Package, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
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
    products: Product[];
    categories: Category[];
    discounts: Discount[];
}

export default function ProductsIndex() {
    const { products, categories, discounts, flash } = usePage<PageProps & ProductsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

    const filteredProducts = useMemo(() => {
        if (categoryFilter === 'all') return products;
        return products.filter((p) => p.category_id === Number(categoryFilter));
    }, [products, categoryFilter]);

    const handleDelete = () => {
        if (deleteId) {
            useForm({}).delete(`/admin/products/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (p) => (
                <div className="flex flex-col">
                    <span className="font-medium">{p.name}</span>
                    {p.brand && <span className="text-xs text-muted-foreground">{p.brand}</span>}
                </div>
            ),
        },
        {
            key: 'sku',
            header: 'SKU',
            render: (p) => <span className="font-mono text-xs text-muted-foreground">{p.sku ?? '—'}</span>,
        },
        {
            key: 'category',
            header: 'Category',
            render: (p) => p.category?.name ?? '—',
        },
        {
            key: 'price',
            header: 'Price',
            render: (p) => <span className="font-semibold">{formatCurrency(Number(p.selling_price))}</span>,
        },
        {
            key: 'stock',
            header: 'Stock',
            render: (p) =>
                p.stock ? (
                    <Badge variant={p.stock.quantity <= 0 ? 'destructive' : p.stock.quantity <= (p.stock.minimum_quantity || 5) ? 'warning' : 'success'}>
                        {p.stock.quantity} units
                    </Badge>
                ) : (
                    <Badge variant="outline">No stock</Badge>
                ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (p) => <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>,
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (p) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Products" />
            <AdminLayout title="Products" subtitle="Manage your product catalog" activeRoute="/admin/products">
                <div className="space-y-6">
                    {flash.success && (
                        <div className="animate-fade-in rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                            {flash.error}
                        </div>
                    )}

                    <DataTable
                        data={filteredProducts}
                        columns={columns}
                        searchKeys={['name', 'sku', 'brand']}
                        searchPlaceholder="Search products..."
                        emptyIcon={Package}
                        emptyMessage="No products found. Click 'Add Product' to create one."
                        rowKey={(p) => p.id}
                        toolbarRight={
                            <Button variant="gradient" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Add Product
                            </Button>
                        }
                        toolbarLeft={
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        }
                    />
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
