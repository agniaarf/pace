import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import KasirLayout from '@/Layouts/KasirLayout';
import { Head, usePage } from '@inertiajs/react';
import { Mail, Search, ShoppingBag, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface KasirCustomer {
    id: number;
    member_code: string | null;
    full_name: string;
    phone: string | null;
    email: string | null;
    total_purchases: number;
    total_spent: number;
    created_at: string;
}

interface CustomersPageProps {
    customers: KasirCustomer[];
}

export default function Customers() {
    const { customers } = usePage<PageProps & CustomersPageProps>().props;
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<KasirCustomer | null>(null);

    const filtered = useMemo(() =>
        customers.filter(c =>
            c.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (c.phone ?? '').includes(search) ||
            (c.member_code ?? '').toLowerCase().includes(search.toLowerCase())),
        [customers, search]);

    return (
        <>
            <Head title="Pelanggan" />
            <KasirLayout title="Pelanggan" subtitle="Daftar member terdaftar" activeRoute="/kasir/customers">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Pelanggan ({filtered.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, telepon, atau kode member..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    {search ? 'Pelanggan tidak ditemukan.' : 'Belum ada pelanggan terdaftar.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filtered.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelected(c)}
                                        className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-all hover:border-primary hover:bg-accent"
                                    >
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                                            {c.full_name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold text-foreground">{c.full_name}</div>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {c.member_code ?? '—'} · {c.phone ?? '—'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">{c.total_purchases} transaksi</div>
                                            <div className="font-mono text-sm font-bold text-foreground">{formatCurrency(c.total_spent)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </KasirLayout>

            {/* Customer detail modal */}
            <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Pelanggan</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700">
                                    {selected.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">{selected.full_name}</h3>
                                    {selected.member_code && (
                                        <Badge variant="secondary" className="mt-1">{selected.member_code}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                                {selected.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">HP</span>
                                        <span className="font-medium text-foreground">{selected.phone}</span>
                                    </div>
                                )}
                                {selected.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="font-medium text-foreground">{selected.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">Member sejak</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(selected.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Total Transaksi</p>
                                    <p className="text-xl font-bold text-foreground">{selected.total_purchases}</p>
                                </div>
                                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Total Belanja</p>
                                    <p className="font-mono text-xl font-bold text-primary">{formatCurrency(selected.total_spent)}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full justify-center" onClick={() => setSelected(null)}>
                                Tutup
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
