import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ShiftRow {
    id: number;
    cashier_name: string;
    opening_balance: number;
    closing_balance_expected: number | null;
    closing_balance_actual: number | null;
    variance: number | null;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at: string | null;
}

interface Cashier {
    id: number;
    username: string;
}

interface ShiftsPageProps {
    shifts: ShiftRow[];
    cashiers: Cashier[];
    filters: { cashier_id?: string; date?: string };
}

export default function ShiftsIndex() {
    const { shifts, cashiers, filters } = usePage<PageProps & ShiftsPageProps>().props;

    const applyFilters = (next: Partial<{ cashier_id: string; date: string }>) => {
        router.get('/admin/shifts', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    };

    const varianceBadge = (variance: number | null) => {
        if (variance === null) return <Badge variant="outline">—</Badge>;
        if (variance === 0) return <Badge variant="success">Sesuai</Badge>;
        if (variance > 0) return <Badge variant="default">+{formatCurrency(variance)}</Badge>;
        return <Badge variant="destructive">{formatCurrency(variance)}</Badge>;
    };

    return (
        <>
            <Head title="Shift Kasir" />
            <AdminLayout title="Shift Kasir" subtitle="Pantau riwayat buka/tutup shift dan selisih kas" activeRoute="/admin/shifts">
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Select
                            value={filters.cashier_id ?? 'all'}
                            onValueChange={(v) => applyFilters({ cashier_id: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Semua Kasir" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kasir</SelectItem>
                                {cashiers.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={filters.date ?? ''}
                            onChange={(e) => applyFilters({ date: e.target.value })}
                            className="w-48"
                        />
                        {(filters.cashier_id || filters.date) && (
                            <Button variant="outline" size="sm" onClick={() => router.get('/admin/shifts')}>
                                Reset Filter
                            </Button>
                        )}
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Dibuka</TableHead>
                                    <TableHead>Ditutup</TableHead>
                                    <TableHead>Modal Awal</TableHead>
                                    <TableHead>Kas Seharusnya</TableHead>
                                    <TableHead>Kas Fisik</TableHead>
                                    <TableHead>Selisih</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                            <Clock className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            Tidak ada data shift ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shifts.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.cashier_name}</TableCell>
                                            <TableCell className="text-sm">{new Date(s.opened_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                            <TableCell className="text-sm">{s.closed_at ? new Date(s.closed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(s.opening_balance)}</TableCell>
                                            <TableCell className="font-mono">{s.closing_balance_expected !== null ? formatCurrency(s.closing_balance_expected) : '—'}</TableCell>
                                            <TableCell className="font-mono">{s.closing_balance_actual !== null ? formatCurrency(s.closing_balance_actual) : '—'}</TableCell>
                                            <TableCell>{varianceBadge(s.variance)}</TableCell>
                                            <TableCell>
                                                <Badge variant={s.status === 'open' ? 'success' : 'outline'}>
                                                    {s.status === 'open' ? 'Aktif' : 'Selesai'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
