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
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Edit, Percent, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Discount {
    id: number;
    name: string;
    type: 'percentage' | 'nominal';
    value: string;
    applies_to: 'all' | 'category' | 'product';
    start_date: string | null;
    end_date: string | null;
    status: 'active' | 'inactive';
    products_count: number;
}

interface DiscountsPageProps {
    discounts: Discount[];
}

export default function DiscountsIndex() {
    const { discounts, flash } = usePage<PageProps & DiscountsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Discount | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        type: 'percentage' as 'percentage' | 'nominal',
        value: '',
        applies_to: 'all' as 'all' | 'category' | 'product',
        start_date: '',
        end_date: '',
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => { setEditing(null); reset(); setDialogOpen(true); };

    const openEdit = (d: Discount) => {
        setEditing(d);
        setData({
            name: d.name,
            type: d.type,
            value: d.value,
            applies_to: d.applies_to,
            start_date: d.start_date ?? '',
            end_date: d.end_date ?? '',
            status: d.status,
        });
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
        if (deleteId) { useForm({}).delete(`/admin/discounts/${deleteId}`, { onSuccess: () => setDeleteId(null) }); }
    };

    const formatDiscountValue = (d: Discount) => {
        if (d.type === 'percentage') return `${d.value}%`;
        return formatCurrency(Number(d.value));
    };

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
            render: (d) => <Badge variant={d.status === 'active' ? 'success' : 'outline'}>{d.status}</Badge>,
        },
        {
            key: 'actions',
            header: 'Aksi',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (d) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                            <Select value={data.applies_to} onValueChange={(v) => setData('applies_to', v as 'all' | 'category' | 'product')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Produk</SelectItem>
                                    <SelectItem value="category">Kategori Tertentu</SelectItem>
                                    <SelectItem value="product">Produk Tertentu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Tanggal Mulai</Label>
                                <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Tanggal Berakhir</Label>
                                <Input id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
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

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Diskon?</DialogTitle>
                        <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
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
