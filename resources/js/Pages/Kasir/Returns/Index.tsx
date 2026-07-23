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
import { useToast } from '@/Components/ui/toast';
import KasirLayout from '@/Layouts/KasirLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TransactionItemRow {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    returned_quantity: number;
    remaining_quantity: number;
}

interface FoundTransaction {
    id: number;
    transaction_number: string;
    transaction_date: string;
    items: TransactionItemRow[];
}

interface VariantOption {
    id: number;
    name: string;
    variant_label: string;
    selling_price: number;
    stock: number;
}

interface MyReturn {
    id: number;
    transaction_number: string;
    item_name: string;
    type: 'refund' | 'exchange' | 'store_credit';
    quantity: number;
    status: 'pending' | 'approved' | 'rejected';
    refund_amount: number | null;
    created_at: string;
}

interface ReturnsPageProps {
    transaction: FoundTransaction | null;
    searchedNumber: string | null;
    variants: VariantOption[];
    myReturns: MyReturn[];
}

const TYPE_LABELS: Record<string, string> = {
    refund: 'Refund',
    exchange: 'Tukar Barang',
    store_credit: 'Kredit Toko',
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'default'> = {
    approved: 'success',
    rejected: 'destructive',
    pending: 'default',
};

export default function ReturnsIndex() {
    const { transaction, searchedNumber, variants, myReturns, flash } = usePage<PageProps & ReturnsPageProps>().props;
    const { toast } = useToast();
    const [search, setSearch] = useState(searchedNumber ?? '');
    const [activeItem, setActiveItem] = useState<TransactionItemRow | null>(null);
    const [variantSearch, setVariantSearch] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm<{
        transaction_item_id: number | null;
        type: 'refund' | 'exchange' | 'store_credit';
        quantity: string;
        restock: boolean;
        reason: string;
        new_variant_id: number | null;
        new_quantity: string;
    }>({
        transaction_item_id: null,
        type: 'refund',
        quantity: '1',
        restock: true,
        reason: '',
        new_variant_id: null,
        new_quantity: '1',
    });

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get('/kasir/returns', { transaction_number: search }, { preserveState: true });
    };

    const openReturnDialog = (item: TransactionItemRow) => {
        setActiveItem(item);
        reset();
        setData('transaction_item_id', item.id);
        setVariantSearch('');
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/kasir/returns', {
            preserveScroll: true,
            onSuccess: () => {
                setActiveItem(null);
                reset();
                toast('Permintaan retur berhasil diajukan.', 'success');
            },
        });
    };

    const filteredVariants = variants.filter(v =>
        v.name.toLowerCase().includes(variantSearch.toLowerCase()) ||
        v.variant_label.toLowerCase().includes(variantSearch.toLowerCase()));

    return (
        <>
            <Head title="Retur" />
            <KasirLayout title="Retur" subtitle="Ajukan retur, tukar barang, atau kredit toko" activeRoute="/kasir/returns">
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

                    <form onSubmit={submitSearch} className="flex gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Masukkan nomor transaksi (e.g. TRX-260723-001)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="gradient">Cari</Button>
                    </form>

                    {searchedNumber && !transaction && (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            Transaksi "{searchedNumber}" tidak ditemukan atau tidak valid untuk retur.
                        </div>
                    )}

                    {transaction && (
                        <div className="rounded-xl border border-border bg-card shadow-card">
                            <div className="border-b border-border px-5 py-3">
                                <h3 className="text-sm font-bold text-foreground">{transaction.transaction_number}</h3>
                                <p className="text-xs text-muted-foreground">{new Date(transaction.transaction_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Jumlah Beli</TableHead>
                                        <TableHead>Harga Satuan</TableHead>
                                        <TableHead>Sisa Bisa Diretur</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transaction.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.remaining_quantity > 0 ? 'outline' : 'destructive'}>
                                                    {item.remaining_quantity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={item.remaining_quantity <= 0}
                                                    onClick={() => openReturnDialog(item)}
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />Ajukan Retur
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <div className="border-b border-border px-5 py-3">
                            <h3 className="text-sm font-bold text-foreground">Retur Saya Terbaru</h3>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaksi</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myReturns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            Belum ada permintaan retur.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    myReturns.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-mono text-xs">{r.transaction_number}</TableCell>
                                            <TableCell>{r.item_name}</TableCell>
                                            <TableCell>{TYPE_LABELS[r.type]}</TableCell>
                                            <TableCell>{r.quantity}</TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_VARIANT[r.status]}>
                                                    {r.status === 'pending' ? 'Menunggu' : r.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </KasirLayout>

            {/* Return request dialog */}
            <Dialog open={activeItem !== null} onOpenChange={(open) => !open && setActiveItem(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajukan Retur</DialogTitle>
                        <DialogDescription>{activeItem?.name} · Sisa bisa diretur: {activeItem?.remaining_quantity}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipe Retur</Label>
                            <Select value={data.type} onValueChange={(v) => setData('type', v as typeof data.type)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="exchange">Tukar Barang</SelectItem>
                                    <SelectItem value="store_credit">Kredit Toko</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Jumlah *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min={1}
                                max={activeItem?.remaining_quantity}
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                            />
                            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                            <Label htmlFor="restock">Barang Dikembalikan ke Stok</Label>
                            <Switch checked={data.restock} onCheckedChange={(checked) => setData('restock', checked)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan Retur</Label>
                            <Textarea id="reason" value={data.reason} onChange={(e) => setData('reason', e.target.value)} rows={2} placeholder="e.g. Ukuran tidak pas, barang rusak..." />
                        </div>

                        {data.type === 'exchange' && (
                            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                                <p className="text-xs font-semibold text-muted-foreground">Barang Pengganti</p>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input placeholder="Cari produk pengganti..." value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)} className="pl-10" />
                                </div>
                                <div className="max-h-40 space-y-1 overflow-y-auto">
                                    {filteredVariants.map((v) => (
                                        <button
                                            type="button"
                                            key={v.id}
                                            onClick={() => setData('new_variant_id', v.id)}
                                            className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-sm transition-all ${
                                                data.new_variant_id === v.id ? 'border-primary bg-accent' : 'border-border hover:border-orange-300'
                                            }`}
                                        >
                                            <span>{v.name}{v.variant_label !== 'Default' ? ` (${v.variant_label})` : ''}</span>
                                            <span className="font-mono text-xs">{formatCurrency(v.selling_price)} · Stok {v.stock}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.new_variant_id && <p className="text-xs text-destructive">{errors.new_variant_id}</p>}
                                <div className="space-y-2">
                                    <Label htmlFor="new_quantity">Jumlah Pengganti *</Label>
                                    <Input id="new_quantity" type="number" min={1} value={data.new_quantity} onChange={(e) => setData('new_quantity', e.target.value)} />
                                    {errors.new_quantity && <p className="text-xs text-destructive">{errors.new_quantity}</p>}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setActiveItem(null)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>
                                {processing ? 'Mengajukan...' : 'Ajukan Retur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
