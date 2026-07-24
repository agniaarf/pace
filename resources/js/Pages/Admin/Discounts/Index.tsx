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
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Edit, ListChecks, Percent, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/lib/utils';

type RuleType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';
type TargetType = 'all' | 'category' | 'product' | 'variant';

interface Discount {
    id: number;
    name: string;
    rule_type: RuleType;
    value: string | null;
    target_type: TargetType;
    target_ids: number[] | null;
    min_qty: number;
    buy_quantity: number | null;
    get_quantity: number | null;
    get_discount_percent: string;
    start_date: string | null;
    end_date: string | null;
    status: 'active' | 'inactive';
}

interface DiscountsPageProps {
    discounts: Discount[];
}

const RULE_TYPE_LABELS: Record<RuleType, string> = {
    percentage: 'Persentase (%)',
    fixed: 'Nominal Tetap (Rp)',
    buy_x_get_y: 'Beli X Gratis/Diskon Y',
    bundle: 'Paket Bundling',
};

const TARGET_TYPE_LABELS: Record<TargetType, string> = {
    all: 'Semua Produk',
    category: 'Kategori Tertentu',
    product: 'Produk Tertentu',
    variant: 'Varian Tertentu',
};

export default function DiscountsIndex() {
    const { discounts, flash } = usePage<PageProps & DiscountsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Discount | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [valueDisplay, setValueDisplay] = useState('');

    const deleteForm = useForm();
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        rule_type: 'percentage' as RuleType,
        value: '',
        target_type: 'all' as TargetType,
        min_qty: '1',
        buy_quantity: '',
        get_quantity: '',
        get_discount_percent: '100',
        start_date: '',
        end_date: '',
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => { setEditing(null); reset(); setValueDisplay(''); setDialogOpen(true); };

    const openEdit = (d: Discount) => {
        setEditing(d);
        setData({
            name: d.name,
            rule_type: d.rule_type,
            value: d.value ?? '',
            target_type: d.target_type,
            min_qty: String(d.min_qty ?? 1),
            buy_quantity: d.buy_quantity ? String(d.buy_quantity) : '',
            get_quantity: d.get_quantity ? String(d.get_quantity) : '',
            get_discount_percent: d.get_discount_percent ?? '100',
            start_date: d.start_date ?? '',
            end_date: d.end_date ?? '',
            status: d.status,
        });
        setValueDisplay(d.rule_type === 'fixed' || d.rule_type === 'bundle' ? formatNumberInput(d.value ?? '0') : (d.value ?? ''));
        setDialogOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(`/admin/discounts/${editing.id}`, {
                onSuccess: () => { setDialogOpen(false); reset(); },
            });
        } else {
            post('/admin/discounts', {
                onSuccess: () => { setDialogOpen(false); reset(); },
            });
        }
    };

    const handleDelete = () => {
        if (deleteId) { deleteForm.delete(`/admin/discounts/${deleteId}`, { preserveScroll: true, onSuccess: () => setDeleteId(null) }); }
    };

    const formatDiscountValue = (d: Discount) => {
        if (d.rule_type === 'percentage') return `${d.value}%`;
        if (d.rule_type === 'fixed') return formatCurrency(Number(d.value));
        if (d.rule_type === 'buy_x_get_y') return `Beli ${d.buy_quantity}, dapat ${d.get_quantity} diskon ${d.get_discount_percent}%`;
        return `Paket @ ${formatCurrency(Number(d.value))}`;
    };

    const isMoneyValue = data.rule_type === 'fixed' || data.rule_type === 'bundle';

    const columns: Column<Discount>[] = [
        {
            key: 'name',
            header: 'Nama',
            render: (d) => <span className="font-medium">{d.name}</span>,
        },
        {
            key: 'rule_type',
            header: 'Tipe Aturan',
            render: (d) => <span className="text-xs">{RULE_TYPE_LABELS[d.rule_type]}</span>,
        },
        {
            key: 'value',
            header: 'Nilai',
            render: (d) => <span className="font-semibold text-primary">{formatDiscountValue(d)}</span>,
        },
        {
            key: 'target_type',
            header: 'Berlaku Untuk',
            render: (d) => <span className="text-xs">{TARGET_TYPE_LABELS[d.target_type]}</span>,
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
            key: 'target_ids',
            header: 'Target',
            render: (d) => d.target_type === 'all' ? (
                <Badge variant="success">Semua</Badge>
            ) : (
                <Link href={`/admin/discounts/${d.id}/targets`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">{d.target_ids?.length ?? 0}</Badge>
                </Link>
            ),
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
                    {d.target_type !== 'all' && (
                        <Link href={`/admin/discounts/${d.id}/targets`}>
                            <Button variant="ghost" size="icon" title="Kelola Target"><ListChecks className="h-4 w-4" /></Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Diskon" />
            <AdminLayout title="Diskon" subtitle="Kelola diskon, promosi, dan paket bundling" activeRoute="/admin/discounts">
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
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Diskon' : 'Tambah Diskon'}</DialogTitle>
                        <DialogDescription>{editing ? 'Perbarui informasi diskon.' : 'Buat diskon, promosi beli-dapat, atau paket bundling baru.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Diskon *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Summer Sale 20%" />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Tipe Aturan</Label>
                            <Select value={data.rule_type} onValueChange={(v) => {
                                setData('rule_type', v as RuleType);
                                setValueDisplay('');
                                setData('value', '');
                            }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                                    <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                                    <SelectItem value="buy_x_get_y">Beli X Gratis/Diskon Y</SelectItem>
                                    <SelectItem value="bundle">Paket Bundling (Harga Spesial)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {data.rule_type !== 'buy_x_get_y' && (
                            <div className="space-y-2">
                                <Label htmlFor="value">
                                    {data.rule_type === 'bundle' ? 'Harga Paket Spesial (Rp) *' : 'Nilai *'}
                                </Label>
                                <Input id="value" type="text" inputMode="numeric" value={valueDisplay} onChange={(e) => {
                                    if (isMoneyValue) {
                                        const formatted = formatNumberInput(e.target.value);
                                        setValueDisplay(formatted);
                                        setData('value', String(parseNumberInput(formatted)));
                                    } else {
                                        setValueDisplay(e.target.value);
                                        setData('value', e.target.value);
                                    }
                                }} placeholder="0" />
                                {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                            </div>
                        )}

                        {data.rule_type === 'buy_x_get_y' && (
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="buy_quantity">Beli (X) *</Label>
                                    <Input id="buy_quantity" type="number" min={1} value={data.buy_quantity} onChange={(e) => setData('buy_quantity', e.target.value)} placeholder="e.g. 2" />
                                    {errors.buy_quantity && <p className="text-xs text-destructive">{errors.buy_quantity}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="get_quantity">Dapat (Y) *</Label>
                                    <Input id="get_quantity" type="number" min={1} value={data.get_quantity} onChange={(e) => setData('get_quantity', e.target.value)} placeholder="e.g. 1" />
                                    {errors.get_quantity && <p className="text-xs text-destructive">{errors.get_quantity}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="get_discount_percent">Diskon Y (%)</Label>
                                    <Input id="get_discount_percent" type="number" min={0} max={100} value={data.get_discount_percent} onChange={(e) => setData('get_discount_percent', e.target.value)} placeholder="100 = gratis" />
                                </div>
                            </div>
                        )}

                        {(data.rule_type === 'percentage' || data.rule_type === 'fixed' || data.rule_type === 'bundle') && (
                            <div className="space-y-2">
                                <Label htmlFor="min_qty">Jumlah Minimum Item</Label>
                                <Input id="min_qty" type="number" min={1} value={data.min_qty} onChange={(e) => setData('min_qty', e.target.value)} placeholder="1" />
                                <p className="text-xs text-muted-foreground">
                                    {data.rule_type === 'bundle'
                                        ? 'Jumlah target berbeda yang harus dibeli bersamaan agar harga paket berlaku.'
                                        : 'Jumlah unit target minimum dalam keranjang agar diskon berlaku.'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Berlaku Untuk</Label>
                            <Select value={data.target_type} onValueChange={(v) => setData('target_type', v as TargetType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Produk</SelectItem>
                                    <SelectItem value="category">Kategori Tertentu</SelectItem>
                                    <SelectItem value="product">Produk Tertentu</SelectItem>
                                    <SelectItem value="variant">Varian Tertentu</SelectItem>
                                </SelectContent>
                            </Select>
                            {data.target_type !== 'all' && (
                                <p className="text-xs text-muted-foreground">
                                    Pilih target di halaman terpisah setelah diskon dibuat/simpan.
                                </p>
                            )}
                        </div>

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
