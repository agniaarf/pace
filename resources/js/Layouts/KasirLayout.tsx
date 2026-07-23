import AppLayout, { type NavItem } from '@/Components/Layout/AppLayout';
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
import { useToast } from '@/Components/ui/toast';
import { useForm, usePage } from '@inertiajs/react';
import { History, LayoutDashboard, Lock, RotateCcw, ShoppingCart, Unlock, Users } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

const kasirNavItems: NavItem[] = [
    { label: 'Dasbor', href: '/kasir/dashboard', icon: LayoutDashboard },
    { label: 'Kasir', href: '/kasir/cashier', icon: ShoppingCart, permission: 'transactions.create' },
    { label: 'Riwayat Transaksi', href: '/kasir/transactions', icon: History },
    { label: 'Retur', href: '/kasir/returns', icon: RotateCcw, permission: 'returns.create' },
    { label: 'Pelanggan', href: '/kasir/customers', icon: Users, permission: 'customers.read' },
];

interface KasirLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    activeRoute: string;
}

function ShiftWidget() {
    const { activeShift, requireShift, flash } = usePage<PageProps>().props;
    const { toast } = useToast();
    const [openDialogOpen, setOpenDialogOpen] = useState(false);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [openingDisplay, setOpeningDisplay] = useState('');
    const [closingDisplay, setClosingDisplay] = useState('');

    const openForm = useForm({ opening_balance: '' });
    const closeForm = useForm({ closing_balance_actual: '' });

    useEffect(() => {
        if (flash.shiftSummary) {
            setSummaryOpen(true);
        }
    }, [flash.shiftSummary]);

    const submitOpen: FormEventHandler = (e) => {
        e.preventDefault();
        openForm.post('/kasir/shift/open', {
            preserveScroll: true,
            onSuccess: () => {
                setOpenDialogOpen(false);
                setOpeningDisplay('');
                openForm.reset();
                toast('Shift berhasil dibuka.', 'success');
            },
        });
    };

    const submitClose: FormEventHandler = (e) => {
        e.preventDefault();
        closeForm.post('/kasir/shift/close', {
            preserveScroll: true,
            onSuccess: () => {
                setCloseDialogOpen(false);
                setClosingDisplay('');
                closeForm.reset();
            },
        });
    };

    if (!requireShift) {
        return null;
    }

    return (
        <>
            {activeShift ? (
                <div className="flex items-center gap-2">
                    <Badge variant="success" className="hidden sm:inline-flex">
                        Shift Aktif · {formatCurrency(activeShift.opening_balance)}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setCloseDialogOpen(true)}>
                        <Lock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Tutup Shift</span>
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="hidden sm:inline-flex">Shift Belum Dibuka</Badge>
                    <Button variant="gradient" size="sm" onClick={() => setOpenDialogOpen(true)}>
                        <Unlock className="h-3.5 w-3.5" />
                        Buka Shift
                    </Button>
                </div>
            )}

            {/* Open shift dialog */}
            <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Buka Shift</DialogTitle>
                        <DialogDescription>Masukkan modal kas awal untuk memulai shift Anda.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitOpen} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="opening_balance">Modal Kas Awal *</Label>
                            <Input
                                id="opening_balance"
                                type="text"
                                inputMode="numeric"
                                placeholder="Rp 0"
                                value={openingDisplay}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '');
                                    setOpeningDisplay(digits ? `Rp ${Number(digits).toLocaleString('id-ID')}` : '');
                                    openForm.setData('opening_balance', digits);
                                }}
                                className="font-mono text-lg font-bold h-12"
                            />
                            {openForm.errors.opening_balance && <p className="text-xs text-destructive">{openForm.errors.opening_balance}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpenDialogOpen(false)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={openForm.processing}>
                                {openForm.processing ? 'Membuka...' : 'Buka Shift'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Close shift dialog */}
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Tutup Shift</DialogTitle>
                        <DialogDescription>Masukkan hasil hitung fisik kas Anda saat ini.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitClose} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="closing_balance_actual">Jumlah Kas Fisik *</Label>
                            <Input
                                id="closing_balance_actual"
                                type="text"
                                inputMode="numeric"
                                placeholder="Rp 0"
                                value={closingDisplay}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '');
                                    setClosingDisplay(digits ? `Rp ${Number(digits).toLocaleString('id-ID')}` : '');
                                    closeForm.setData('closing_balance_actual', digits);
                                }}
                                className="font-mono text-lg font-bold h-12"
                            />
                            {closeForm.errors.closing_balance_actual && <p className="text-xs text-destructive">{closeForm.errors.closing_balance_actual}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCloseDialogOpen(false)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={closeForm.processing}>
                                {closeForm.processing ? 'Menutup...' : 'Tutup Shift'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Shift close summary */}
            <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Ringkasan Penutupan Shift</DialogTitle>
                    </DialogHeader>
                    {flash.shiftSummary && (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Modal Awal</span><span className="font-mono font-medium">{formatCurrency(flash.shiftSummary.opening_balance)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Kas Seharusnya</span><span className="font-mono font-medium">{formatCurrency(flash.shiftSummary.closing_balance_expected)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Kas Fisik</span><span className="font-mono font-medium">{formatCurrency(flash.shiftSummary.closing_balance_actual)}</span></div>
                            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                                <span>Selisih</span>
                                <span className={`font-mono ${flash.shiftSummary.variance === 0 ? 'text-emerald-600' : flash.shiftSummary.variance > 0 ? 'text-blue-600' : 'text-destructive'}`}>
                                    {flash.shiftSummary.variance > 0 ? '+' : ''}{formatCurrency(flash.shiftSummary.variance)}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="gradient" onClick={() => setSummaryOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function KasirLayout({ children, title, subtitle, activeRoute }: KasirLayoutProps) {
    return (
        <AppLayout navItems={kasirNavItems} activeRoute={activeRoute} title={title} subtitle={subtitle} headerExtra={<ShiftWidget />}>
            {children}
        </AppLayout>
    );
}
