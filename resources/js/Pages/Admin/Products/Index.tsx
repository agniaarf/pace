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
import { DataTable, type Column } from '@/Components/DataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Edit, Layers, Package, Plus, Printer, Trash2 } from 'lucide-react';
import BarcodeLabel from '@/Components/BarcodeLabel';
import { FormEventHandler, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/lib/utils';

interface Category { id: number; name: string }
interface VariantStock { id: number; quantity: number; minimum_quantity: number }
interface Variant {
    id: number;
    product_id: number;
    size: string | null;
    color: string | null;
    sku: string;
    barcode: string | null;
    price_adjustment: string;
    status: 'active' | 'inactive';
    stock?: VariantStock | null;
}
interface Product {
    id: number;
    category_id: number | null;
    name: string;
    brand: string | null;
    cost_price: string;
    selling_price: string;
    description: string | null;
    status: 'active' | 'inactive';
    category?: Category | null;
    variants: Variant[];
}

interface ProductsPageProps {
    products: Product[];
    categories: Category[];
}

const variantLabel = (v: { size: string | null; color: string | null }) => {
    const parts = [v.size, v.color].filter(Boolean);
    return parts.length ? parts.join(' / ') : 'Default';
};

const variantPrice = (product: Product, variant: Variant) => Number(product.selling_price) + Number(variant.price_adjustment);

const totalStock = (p: Product) => p.variants.reduce((sum, v) => sum + (v.stock?.quantity ?? 0), 0);
const minStock = (p: Product) => Math.min(...p.variants.map((v) => v.stock?.minimum_quantity ?? 0));

export default function ProductsIndex() {
    const { products, categories, flash } = usePage<PageProps & ProductsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [costPriceDisplay, setCostPriceDisplay] = useState('');
    const [sellingPriceDisplay, setSellingPriceDisplay] = useState('');

    const [variantsProductId, setVariantsProductId] = useState<number | null>(null);
    const variantsProduct = useMemo(
        () => products.find((p) => p.id === variantsProductId) ?? null,
        [products, variantsProductId],
    );
    const [variantDialogOpen, setVariantDialogOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
    const [deleteVariantId, setDeleteVariantId] = useState<number | null>(null);
    const [printVariants, setPrintVariants] = useState<Variant[] | null>(null);

    const deleteForm = useForm();
    const deleteVariantForm = useForm();
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        category_id: string;
        name: string;
        brand: string;
        cost_price: string;
        selling_price: string;
        description: string;
        status: 'active' | 'inactive';
        size: string;
        color: string;
        sku: string;
        barcode: string;
        stock_quantity: string;
        minimum_quantity: string;
    }>({
        category_id: '',
        name: '',
        brand: '',
        cost_price: '',
        selling_price: '',
        description: '',
        status: 'active',
        size: '',
        color: '',
        sku: '',
        barcode: '',
        stock_quantity: '',
        minimum_quantity: '',
    });

    const variantForm = useForm<{
        size: string;
        color: string;
        sku: string;
        barcode: string;
        price_adjustment: string;
        status: 'active' | 'inactive';
        stock_quantity: string;
        minimum_quantity: string;
    }>({
        size: '',
        color: '',
        sku: '',
        barcode: '',
        price_adjustment: '0',
        status: 'active',
        stock_quantity: '',
        minimum_quantity: '',
    });

    const openCreate = () => {
        setEditingProduct(null);
        reset();
        setCostPriceDisplay('');
        setSellingPriceDisplay('');
        setDialogOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setData({
            category_id: product.category_id?.toString() ?? '',
            name: product.name,
            brand: product.brand ?? '',
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            description: product.description ?? '',
            status: product.status,
            size: '',
            color: '',
            sku: '',
            barcode: '',
            stock_quantity: '',
            minimum_quantity: '',
        });
        setCostPriceDisplay(formatNumberInput(product.cost_price));
        setSellingPriceDisplay(formatNumberInput(product.selling_price));
        setDialogOpen(true);
    };

    const [priceError, setPriceError] = useState('');

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (Number(data.selling_price) <= Number(data.cost_price)) {
            setPriceError('Harga jual harus lebih besar dari harga modal.');
            return;
        }
        setPriceError('');
        if (editingProduct) {
            put(`/admin/products/${editingProduct.id}`, {
                preserveScroll: true,
                onSuccess: () => { setDialogOpen(false); reset(); },
            });
        } else {
            post('/admin/products', {
                preserveScroll: true,
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
            deleteForm.delete(`/admin/products/${deleteId}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const openVariants = (product: Product) => {
        setVariantsProductId(product.id);
    };

    const openCreateVariant = () => {
        setEditingVariant(null);
        variantForm.reset();
        variantForm.setData('status', 'active');
        setVariantDialogOpen(true);
    };

    const openEditVariant = (variant: Variant) => {
        setEditingVariant(variant);
        variantForm.setData({
            size: variant.size ?? '',
            color: variant.color ?? '',
            sku: variant.sku,
            barcode: variant.barcode ?? '',
            price_adjustment: variant.price_adjustment,
            status: variant.status,
            stock_quantity: '',
            minimum_quantity: '',
        });
        setVariantDialogOpen(true);
    };

    const handleVariantSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!variantsProduct) return;
        if (editingVariant) {
            variantForm.put(`/admin/variants/${editingVariant.id}`, {
                preserveScroll: true,
                onSuccess: () => setVariantDialogOpen(false),
            });
        } else {
            variantForm.post(`/admin/products/${variantsProduct.id}/variants`, {
                preserveScroll: true,
                onSuccess: () => setVariantDialogOpen(false),
            });
        }
    };

    const openPrintVariant = (variant: Variant) => setPrintVariants([variant]);
    const openPrintAllVariants = () => {
        if (!variantsProduct) return;
        const withBarcode = variantsProduct.variants.filter((v) => v.barcode);
        if (withBarcode.length === 0) return;
        setPrintVariants(withBarcode);
    };

    const handleDeleteVariant = () => {
        if (deleteVariantId) {
            deleteVariantForm.delete(`/admin/variants/${deleteVariantId}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteVariantId(null),
            });
        }
    };

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: 'Nama',
            render: (p) => (
                <div className="flex flex-col">
                    <span className="font-medium">{p.name}</span>
                    {p.brand && <span className="text-xs text-muted-foreground">{p.brand}</span>}
                </div>
            ),
        },
        {
            key: 'variants',
            header: 'Varian',
            render: (p) => <Badge variant="outline">{p.variants.length} varian</Badge>,
        },
        {
            key: 'category',
            header: 'Kategori',
            render: (p) => p.category?.name ?? '—',
        },
        {
            key: 'price',
            header: 'Harga Dasar',
            render: (p) => <span className="font-semibold">{formatCurrency(Number(p.selling_price))}</span>,
        },
        {
            key: 'stock',
            header: 'Total Stok',
            render: (p) => {
                const stock = totalStock(p);
                const min = minStock(p);
                return (
                    <Badge variant={stock <= 0 ? 'destructive' : stock <= min ? 'warning' : 'success'}>
                        {stock} unit
                    </Badge>
                );
            },
        },
        {
            key: 'status',
            header: 'Status',
            render: (p) => <Badge variant={p.status === 'active' ? 'success' : 'destructive'}>{p.status === 'active' ? 'Aktif' : 'Tidak'}</Badge>,
        },
        {
            key: 'actions',
            header: 'Aksi',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (p) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openVariants(p)} title="Kelola Varian">
                        <Layers className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit Produk">
                        <Edit className="h-4 w-4" />
                    </Button>
                    {p.status !== 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
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
                        searchKeys={['name', 'brand']}
                        searchPlaceholder="Cari produk..."
                        emptyIcon={Package}
                        emptyMessage="Produk tidak ditemukan. Klik 'Tambah Produk' untuk membuat baru."
                        rowKey={(p) => p.id}
                        showRowNumber
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
                            {editingProduct ? 'Perbarui informasi dasar produk.' : 'Buat produk baru beserta varian pertamanya.'}
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
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" value={data.brand} onChange={(e) => setData('brand', e.target.value)} placeholder="e.g. Nike" />
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
                                <Input id="cost_price" type="text" inputMode="numeric" value={costPriceDisplay} onChange={(e) => {
                                    const formatted = formatNumberInput(e.target.value);
                                    setCostPriceDisplay(formatted);
                                    setData('cost_price', String(parseNumberInput(formatted)));
                                }} placeholder="0" />
                                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling_price">Harga Jual Dasar *</Label>
                                <Input id="selling_price" type="text" inputMode="numeric" value={sellingPriceDisplay} onChange={(e) => {
                                    const formatted = formatNumberInput(e.target.value);
                                    setSellingPriceDisplay(formatted);
                                    setData('selling_price', String(parseNumberInput(formatted)));
                                }} placeholder="0" />
                                {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
                                {priceError && <p className="text-xs text-destructive">{priceError}</p>}
                            </div>
                        </div>

                        {!editingProduct && (
                            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                                <p className="text-xs font-semibold text-muted-foreground">Varian Pertama</p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="size">Size</Label>
                                        <Input id="size" value={data.size} onChange={(e) => setData('size', e.target.value)} placeholder="e.g. 42" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Warna</Label>
                                        <Input id="color" value={data.color} onChange={(e) => setData('color', e.target.value)} placeholder="e.g. Hitam" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sku">SKU (Opsional)</Label>
                                        <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Auto-generate jika dikosongkan" />
                                        {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="barcode">Barcode (Opsional)</Label>
                                        <Input id="barcode" value={data.barcode} onChange={(e) => setData('barcode', e.target.value)} placeholder="Kode barcode" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="stock_quantity">Stok Awal</Label>
                                        <Input id="stock_quantity" type="number" value={data.stock_quantity} onChange={(e) => setData('stock_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minimum_quantity">Stok Minimum</Label>
                                        <Input id="minimum_quantity" type="number" value={data.minimum_quantity} onChange={(e) => setData('minimum_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Deskripsi produk..." rows={3} />
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
                            Tindakan ini tidak dapat dibatalkan. Produk dan seluruh variannya akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Variants Dialog */}
            <Dialog open={variantsProduct !== null} onOpenChange={(open) => !open && setVariantsProductId(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Varian — {variantsProduct?.name}</DialogTitle>
                        <DialogDescription>Kelola size, warna, SKU, barcode, dan stok per varian.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="flex justify-end">
                            <Button variant="gradient" size="sm" onClick={openCreateVariant}>
                                <Plus className="h-4 w-4" />Tambah Varian
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Varian</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Penyesuaian Harga</TableHead>
                                    <TableHead>Stok</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variantsProduct?.variants.map((v) => (
                                    <TableRow key={v.id}>
                                        <TableCell className="font-medium">{variantLabel(v)}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{v.sku}</TableCell>
                                        <TableCell>{formatCurrency(Number(v.price_adjustment))}</TableCell>
                                        <TableCell>
                                            {v.stock ? (
                                                <Badge variant={v.stock.quantity <= 0 ? 'destructive' : v.stock.quantity <= v.stock.minimum_quantity ? 'warning' : 'success'}>
                                                    {v.stock.quantity} unit
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">—</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={v.status === 'active' ? 'success' : 'destructive'}>{v.status === 'active' ? 'Aktif' : 'Nonaktif'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openPrintVariant(v)} disabled={!v.barcode} title={v.barcode ? 'Cetak Barcode' : 'Isi barcode dahulu'}>
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditVariant(v)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteVariantId(v.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {variantsProduct?.variants.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Belum ada varian.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={openPrintAllVariants}
                            disabled={!variantsProduct?.variants.some((v) => v.barcode)}
                        >
                            <Printer className="h-4 w-4" />Cetak Semua Barcode
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setVariantsProductId(null)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Variant Dialog */}
            <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingVariant ? 'Edit Varian' : 'Tambah Varian'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleVariantSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="v_size">Size</Label>
                                <Input id="v_size" value={variantForm.data.size} onChange={(e) => variantForm.setData('size', e.target.value)} placeholder="e.g. 42" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="v_color">Warna</Label>
                                <Input id="v_color" value={variantForm.data.color} onChange={(e) => variantForm.setData('color', e.target.value)} placeholder="e.g. Hitam" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="v_sku">SKU {editingVariant ? '*' : '(Opsional)'}</Label>
                                <Input id="v_sku" value={variantForm.data.sku} onChange={(e) => variantForm.setData('sku', e.target.value)} placeholder="Auto-generate jika dikosongkan" />
                                {variantForm.errors.sku && <p className="text-xs text-destructive">{variantForm.errors.sku}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="v_barcode">Barcode (Opsional)</Label>
                                <Input id="v_barcode" value={variantForm.data.barcode} onChange={(e) => variantForm.setData('barcode', e.target.value)} placeholder="Kode barcode" />
                                {variantForm.errors.barcode && <p className="text-xs text-destructive">{variantForm.errors.barcode}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="v_price_adjustment">Penyesuaian Harga</Label>
                                <Input id="v_price_adjustment" type="number" value={variantForm.data.price_adjustment} onChange={(e) => variantForm.setData('price_adjustment', e.target.value)} placeholder="0" />
                            </div>
                            {!editingVariant && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="v_stock_quantity">Stok Awal</Label>
                                        <Input id="v_stock_quantity" type="number" value={variantForm.data.stock_quantity} onChange={(e) => variantForm.setData('stock_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="v_minimum_quantity">Stok Minimum</Label>
                                        <Input id="v_minimum_quantity" type="number" value={variantForm.data.minimum_quantity} onChange={(e) => variantForm.setData('minimum_quantity', e.target.value)} placeholder="0" />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Label htmlFor="v_status">Aktif</Label>
                            <Switch checked={variantForm.data.status === 'active'} onCheckedChange={(checked) => variantForm.setData('status', checked ? 'active' : 'inactive')} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setVariantDialogOpen(false)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={variantForm.processing}>
                                {variantForm.processing ? 'Menyimpan...' : editingVariant ? 'Perbarui' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Variant Confirmation */}
            <Dialog open={deleteVariantId !== null} onOpenChange={(open) => !open && setDeleteVariantId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Varian?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Jika varian pernah terjual, nonaktifkan saja alih-alih menghapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteVariantId(null)}>Batal</Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteVariant}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Barcode Labels Dialog */}
            <Dialog open={printVariants !== null} onOpenChange={(open) => !open && setPrintVariants(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Cetak Label Barcode</DialogTitle>
                        <DialogDescription>Label akan dicetak menggunakan dialog cetak browser Anda.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-wrap justify-center gap-3 p-2" data-barcode-print>
                        {printVariants?.map((v) => (
                            <BarcodeLabel
                                key={v.id}
                                barcode={v.barcode as string}
                                productName={variantsProduct?.name ?? ''}
                                variantLabel={variantLabel(v)}
                                price={variantsProduct ? variantPrice(variantsProduct, v) : undefined}
                            />
                        ))}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPrintVariants(null)}>Tutup</Button>
                        <Button type="button" variant="gradient" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />Cetak
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
