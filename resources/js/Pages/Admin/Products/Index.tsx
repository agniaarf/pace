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
import { Edit, Package, Plus, Trash2, X } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Category { id: number; name: string }
interface Stock { id: number; quantity: number; minimum_quantity: number }
interface Product {
    id: number;
    category_id: number | null;
    name: string;
    sku: string | null;
    brand: string | null;
    size: string | null;
    cost_price: string;
    selling_price: string;
    description: string | null;
    photo: string | null;
    photo_url: string | null;
    status: 'active' | 'inactive';
    category?: Category | null;
    stock?: Stock | null;
}

interface ProductsPageProps {
    products: Product[];
    categories: Category[];
}

export default function ProductsIndex() {
    const { products, categories, flash } = usePage<PageProps & ProductsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const { data, setData, post, put, processing, errors, reset } = useForm<{
        category_id: string;
        name: string;
        sku: string;
        brand: string;
        size: string;
        cost_price: string;
        selling_price: string;
        description: string;
        photo: File | null;
        status: 'active' | 'inactive';
        stock_quantity: string;
        minimum_quantity: string;
    }>({
        category_id: '',
        name: '',
        sku: '',
        brand: '',
        size: '',
        cost_price: '',
        selling_price: '',
        description: '',
        photo: null,
        status: 'active',
        stock_quantity: '',
        minimum_quantity: '',
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const openCreate = () => {
        setEditingProduct(null);
        reset();
        setPhotoPreview(null);
        setDialogOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setData({
            category_id: product.category_id?.toString() ?? '',
            name: product.name,
            sku: product.sku ?? '',
            brand: product.brand ?? '',
            size: product.size ?? '',
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            description: product.description ?? '',
            photo: null,
            status: product.status,
            stock_quantity: '',
            minimum_quantity: '',
        });
        setPhotoPreview(product.photo_url ?? null);
        setDialogOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingProduct) {
            put(`/admin/products/${editingProduct.id}`, {
                forceFormData: true,
                onSuccess: () => { setDialogOpen(false); reset(); setPhotoPreview(null); },
            });
        } else {
            post('/admin/products', {
                forceFormData: true,
                onSuccess: () => { setDialogOpen(false); reset(); setPhotoPreview(null); },
            });
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB');
            e.target.value = '';
            return;
        }
        setData('photo', file);
        setPhotoPreview(URL.createObjectURL(file));
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
            header: 'Nama',
            render: (p) => (
                <div className="flex items-center gap-3">
                    {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-medium">{p.name}</span>
                        {p.brand && <span className="text-xs text-muted-foreground">{p.brand}</span>}
                    </div>
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
            header: 'Kategori',
            render: (p) => p.category?.name ?? '—',
        },
        {
            key: 'price',
            header: 'Harga',
            render: (p) => <span className="font-semibold">{formatCurrency(Number(p.selling_price))}</span>,
        },
        {
            key: 'stock',
            header: 'Stok',
            render: (p) =>
                p.stock ? (
                    <Badge variant={p.stock.quantity <= 0 ? 'destructive' : p.stock.quantity <= (p.stock.minimum_quantity || 5) ? 'warning' : 'success'}>
                        {p.stock.quantity} unit
                    </Badge>
                ) : (
                    <Badge variant="outline">Tidak ada stok</Badge>
                ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (p) => <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>,
        },
        {
            key: 'actions',
            header: 'Aksi',
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
            <Head title="Produk" />
            <AdminLayout title="Produk" subtitle="Kelola katalog produk Anda" activeRoute="/admin/products">
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
                        searchPlaceholder="Cari produk..."
                        emptyIcon={Package}
                        emptyMessage="Produk tidak ditemukan. Klik 'Tambah Produk' untuk membuat baru."
                        rowKey={(p) => p.id}
                        toolbarRight={
                            <Button variant="gradient" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Tambah Produk
                            </Button>
                        }
                        toolbarLeft={
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
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
                        <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Perbarui informasi produk.' : 'Buat produk baru di katalog Anda.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Produk *</Label>
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
                                <Label>Kategori</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost_price">Harga Modal *</Label>
                                <Input id="cost_price" type="number" step="0.01" value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} placeholder="0" />
                                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling_price">Harga Jual *</Label>
                                <Input id="selling_price" type="number" step="0.01" value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} placeholder="0" />
                                {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
                            </div>
                            {!editingProduct && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="stock_quantity">Stok Awal</Label>
                                        <Input id="stock_quantity" type="number" value={data.stock_quantity} onChange={(e) => setData('stock_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minimum_quantity">Stok Minimum</Label>
                                        <Input id="minimum_quantity" type="number" value={data.minimum_quantity} onChange={(e) => setData('minimum_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Deskripsi produk..." rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label>Foto Produk</Label>
                            <div className="flex items-center gap-4">
                                {photoPreview ? (
                                    <div className="relative">
                                        <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-border" />
                                        <button
                                            type="button"
                                            onClick={() => { setPhotoPreview(null); setData('photo', null); }}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition hover:scale-110"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="photo"
                                        className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 transition hover:border-primary hover:bg-accent"
                                    >
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                        <span className="mt-1 text-[10px] text-muted-foreground">Upload</span>
                                    </label>
                                )}
                                <div className="flex-1">
                                    <input
                                        id="photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Format: JPG, PNG, WebP. Maksimal 2MB.
                                        {editingProduct?.photo && !data.photo && ' Kosongkan jika tidak ingin mengubah foto.'}
                                    </p>
                                    {errors.photo && <p className="text-xs text-destructive">{errors.photo}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Label htmlFor="status">Aktif</Label>
                            <Switch checked={data.status === 'active'} onCheckedChange={(checked) => setData('status', checked ? 'active' : 'inactive')} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>
                                {processing ? 'Menyimpan...' : editingProduct ? 'Perbarui' : 'Buat'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Produk?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Produk dan data stoknya akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
