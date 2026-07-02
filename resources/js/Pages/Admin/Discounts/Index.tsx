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
import { DataTable, type Column } from '@/Components/DataTable';
import { DatePicker } from '@/Components/ui/calendar';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Check, Edit, Percent, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Discount {
    id: number;
    name: string;
    type: 'percentage' | 'nominal';
    value: string;
    applies_to: 'all' | 'category' | 'product';
    target_ids: number[] | null;
    start_date: string | null;
    end_date: string | null;
    status: 'active' | 'inactive';
    products_count: number;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    brand: string | null;
}

interface DiscountsPageProps {
    discounts: Discount[];
    products: Product[];
}

export default function DiscountsIndex() {
    const { discounts, products, flash } = usePage<PageProps & DiscountsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Discount | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const deleteForm = useForm();
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        type: 'percentage' as 'percentage' | 'nominal',
        value: '',
        applies_to: 'all' as 'all' | 'category' | 'product',
        target_ids: [] as number[],
        start_date: '',
        end_date: '',
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => { setEditing(null); reset(); setProductPickerOpen(false); setDialogOpen(true); };

    const openEdit = (d: Discount) => {
        setEditing(d);
        setData({
            name: d.name,
            type: d.type,
            value: d.value,
            applies_to: d.applies_to,
            target_ids: d.target_ids ?? [],
            start_date: d.start_date ?? '',
            end_date: d.end_date ?? '',
            status: d.status,
        });
        setProductPickerOpen(false);
        setDialogOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(`/admin/discounts/${editing.id}`, { onSuccess: () => { setDialogOpen(false); reset(); } });
        } else {
            post('/admin/discounts', { onSuccess: () => { setDialogOpen(false); reset(); } });
        }
    };

    const handleDelete = () => {
        if (deleteId) { deleteForm.delete(`/admin/discounts/${deleteId}`, { preserveScroll: true, onSuccess: () => setDeleteId(null) }); }
    };

    const formatDiscountValue = (d: Discount) => {
        if (d.type === 'percentage') return `${d.value}%`;
        return formatCurrency(Number(d.value));
    };

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const q = productSearch.toLowerCase();
        return products.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q)
        );
    }, [products, productSearch]);

    const toggleProduct = (id: number) => {
        setData('target_ids',
            data.target_ids.includes(id)
                ? data.target_ids.filter((tid) => tid !== id)
                : [...data.target_ids, id]
        );
    };

    const selectedProductNames = useMemo(() => {
        return data.target_ids
            .map((id) => products.find((p) => p.id === id))
            .filter(Boolean)
            .map((p) => p!.name);
    }, [data.target_ids, products]);

    const columns: Column<Discount>[] = [
        {
            key: 'name',
            header: 'Nama',
            render: (d) => <span className="font-medium">{d.name}</span>,
        },
        {
            key: 'type',
            header: 'Tipe',
            render: (d) => <span className="capitalize">{d.type}</span>,
        },
        {
            key: 'value',
            header: 'Nilai',
            render: (d) => <span className="font-semibold text-primary">{formatDiscountValue(d)}</span>,
        },
        {
            key: 'applies_to',
            header: 'Berlaku Untuk',
            render: (d) => <span className="capitalize">{d.applies_to}</span>,
        },
        {
            key: 'period',
            header: 'Periode',
            render: (d) => (
                <span className="text-xs text-muted-foreground">
                    {d.start_date ? `${d.start_date} → ${d.end_date ?? '—'}` : 'Tanpa batas'}
                </span>
            ),
        },
        {
            key: 'products_count',
            header: 'Produk',
            render: (d) => <Badge variant="secondary">{d.products_count}</Badge>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (d) => <Badge variant={d.status === 'active' ? 'success' : 'destructive'}>{d.status === 'active' ? 'Aktif' : 'Tidak'}</Badge>,
        },
        {
            key: 'actions',
            header: 'Aksi',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (d) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                    {d.status !== 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Diskon" />
            <AdminLayout title="Diskon" subtitle="Kelola diskon promosi" activeRoute="/admin/discounts">
                <div className="space-y-6">
                    {flash.success && <div className="animate-fade-in rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>}
                    {flash.error && <div className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{flash.error}</div>}

                    <DataTable
                        data={discounts}
                        columns={columns}
                        searchKeys={['name']}
                        searchPlaceholder="Cari diskon..."
                        emptyIcon={Percent}
                        emptyMessage="Tidak ada diskon ditemukan."
                        rowKey={(d) => d.id}
                        showRowNumber
                        toolbarRight={
                            <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" />Tambah Diskon</Button>
                        }
                    />
                </div>
            </AdminLayout>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Diskon' : 'Tambah Diskon'}</DialogTitle>
                        <DialogDescription>{editing ? 'Perbarui informasi diskon.' : 'Buat diskon promosi baru.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Diskon *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Summer Sale 20%" />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tipe</Label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v as 'percentage' | 'nominal')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Nilai *</Label>
                                <Input id="value" type="number" step="0.01" value={data.value} onChange={(e) => setData('value', e.target.value)} placeholder="0" />
                                {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Berlaku Untuk</Label>
                            <Select value={data.applies_to} onValueChange={(v) => { setData('applies_to', v as 'all' | 'category' | 'product'); if (v !== 'product') setData('target_ids', []); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Produk</SelectItem>
                                    <SelectItem value="product">Produk Tertentu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {data.applies_to === 'product' && (
                            <div className="space-y-2">
                                <Label>Produk Terpilih ({data.target_ids.length})</Label>
                                {selectedProductNames.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProductNames.map((name) => (
                                            <Badge key={name} variant="secondary" className="gap-1">
                                                {name}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const prod = products.find((p) => p.name === name);
                                                        if (prod) toggleProduct(prod.id);
                                                    }}
                                                    className="ml-0.5 rounded-full hover:bg-destructive/20"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <Button type="button" variant="outline" size="sm" onClick={() => setProductPickerOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                    Pilih Produk
                                </Button>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tanggal Mulai</Label>
                                <DatePicker
                                    value={data.start_date}
                                    onChange={(v) => setData('start_date', v)}
                                    placeholder="Pilih tanggal mulai"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Berakhir</Label>
                                <DatePicker
                                    value={data.end_date}
                                    onChange={(v) => setData('end_date', v)}
                                    placeholder="Pilih tanggal berakhir"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v as 'active' | 'inactive')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Nonaktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>{processing ? 'Menyimpan...' : editing ? 'Perbarui' : 'Buat'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Product Picker Dialog */}
            <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Pilih Produk</DialogTitle>
                        <DialogDescription>Cari dan pilih produk yang akan mendapatkan diskon ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari produk..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-[40vh] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                            {filteredProducts.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">Produk tidak ditemukan.</p>
                            ) : (
                                filteredProducts.map((p) => {
                                    const selected = data.target_ids.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => toggleProduct(p.id)}
                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                                                selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                                            }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{p.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.sku ?? '—'} {p.brand ? `· ${p.brand}` : ''}
                                                </span>
                                            </div>
                                            {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        {data.target_ids.length > 0 && (
                            <p className="text-xs text-muted-foreground">{data.target_ids.length} produk terpilih</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="gradient" onClick={() => setProductPickerOpen(false)}>
                            Selesai ({data.target_ids.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Diskon?</DialogTitle>
                        <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
