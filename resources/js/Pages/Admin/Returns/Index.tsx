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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Textarea } from '@/Components/ui/textarea';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, RotateCcw, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ReturnRow {
    id: number;
    transaction_number: string;
    customer_name: string;
    item_name: string;
    type: 'refund' | 'exchange' | 'store_credit';
    quantity: number;
    unit_price: number;
    restock: boolean;
    reason: string | null;
    new_item_name: string | null;
    new_quantity: number | null;
    status: 'pending' | 'approved' | 'rejected';
    refund_amount: number | null;
    requested_by: string | null;
    approved_by: string | null;
    admin_notes: string | null;
    created_at: string;
}

interface ReturnsPageProps {
    returns: ReturnRow[];
    status: string;
}

const TYPE_LABELS: Record<string, string> = {
    refund: 'Refund',
    exchange: 'Tukar Barang',
    store_credit: 'Kredit Toko',
};

export default function AdminReturnsIndex() {
    const { returns, status, flash } = usePage<PageProps & ReturnsPageProps>().props;
    const [rejectingId, setRejectingId] = useState<number | null>(null);

    const approveForm = useForm();
    const rejectForm = useForm({ admin_notes: '' });

    const changeStatus = (v: string) => {
        router.get('/admin/returns', { status: v }, { preserveState: true });
    };

    const approve = (id: number) => {
        approveForm.post(`/admin/returns/${id}/approve`, { preserveScroll: true });
    };

    const submitReject: FormEventHandler = (e) => {
        e.preventDefault();
        if (!rejectingId) return;
        rejectForm.post(`/admin/returns/${rejectingId}/reject`, {
            preserveScroll: true,
            onSuccess: () => { setRejectingId(null); rejectForm.reset(); },
        });
    };

    return (
        <>
            <Head title="Retur" />
            <AdminLayout title="Retur" subtitle="Tinjau dan setujui permintaan retur, tukar barang, dan kredit toko" activeRoute="/admin/returns">
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

                    <Select value={status} onValueChange={changeStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Menunggu Persetujuan</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                            <SelectItem value="all">Semua</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaksi</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Restock</TableHead>
                                    <TableHead>Diajukan Oleh</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                                            <RotateCcw className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            Tidak ada permintaan retur ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    returns.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-mono text-xs">{r.transaction_number}</TableCell>
                                            <TableCell>{r.customer_name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{r.item_name}</span>
                                                    {r.reason && <span className="text-xs text-muted-foreground">{r.reason}</span>}
                                                    {r.type === 'exchange' && r.new_item_name && (
                                                        <span className="text-xs text-primary">→ {r.new_item_name} ×{r.new_quantity}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{TYPE_LABELS[r.type]}</TableCell>
                                            <TableCell>{r.quantity} <span className="text-xs text-muted-foreground">({formatCurrency(r.unit_price * r.quantity)})</span></TableCell>
                                            <TableCell>
                                                <Badge variant={r.restock ? 'success' : 'outline'}>{r.restock ? 'Ya' : 'Tidak'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{r.requested_by ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'default'}>
                                                    {r.status === 'pending' ? 'Menunggu' : r.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                </Badge>
                                                {r.admin_notes && <p className="mt-1 text-xs text-muted-foreground">{r.admin_notes}</p>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {r.status === 'pending' && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="outline" size="sm" onClick={() => approve(r.id)} disabled={approveForm.processing}>
                                                            <Check className="h-3.5 w-3.5" />Setujui
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setRejectingId(r.id)}>
                                                            <X className="h-3.5 w-3.5 text-destructive" />Tolak
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </AdminLayout>

            <Dialog open={rejectingId !== null} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Tolak Permintaan Retur</DialogTitle>
                        <DialogDescription>Berikan alasan penolakan (opsional).</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitReject} className="space-y-4">
                        <Textarea
                            value={rejectForm.data.admin_notes}
                            onChange={(e) => rejectForm.setData('admin_notes', e.target.value)}
                            rows={3}
                            placeholder="e.g. Barang sudah melewati batas waktu retur..."
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRejectingId(null)}>Batal</Button>
                            <Button type="submit" variant="destructive" disabled={rejectForm.processing}>
                                {rejectForm.processing ? 'Menolak...' : 'Tolak Retur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
