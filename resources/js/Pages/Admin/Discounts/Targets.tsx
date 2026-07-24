import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Info, Package, Search } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TargetOption {
    id: number;
    label: string;
    sub?: string;
}

interface DiscountInfo {
    id: number;
    name: string;
    rule_type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';
    value: string | null;
    target_type: 'all' | 'category' | 'product' | 'variant';
    target_ids: number[] | null;
}

interface DiscountTargetsPageProps {
    discount: DiscountInfo;
    options: TargetOption[];
}

const TARGET_TYPE_LABELS: Record<string, string> = {
    all: 'Semua Produk',
    category: 'Kategori Tertentu',
    product: 'Produk Tertentu',
    variant: 'Varian Tertentu',
};

export default function DiscountTargets() {
    const { discount, options, flash } = usePage<PageProps & DiscountTargetsPageProps>().props;
    const [search, setSearch] = useState('');

    const { data, setData, post, processing, reset } = useForm<{
        target_ids: number[];
    }>({
        target_ids: discount.target_ids ?? [],
    });

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const q = search.toLowerCase();
        return options.filter((o) => o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q));
    }, [options, search]);

    const toggleOption = (id: number) => {
        setData('target_ids',
            data.target_ids.includes(id)
                ? data.target_ids.filter((tid) => tid !== id)
                : [...data.target_ids, id]
        );
    };

    const selectAll = () => setData('target_ids', options.map((o) => o.id));
    const deselectAll = () => setData('target_ids', []);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/admin/discounts/${discount.id}/targets`, {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const formatDiscountValue = () => {
        if (discount.rule_type === 'percentage') return `${discount.value}%`;
        if (discount.rule_type === 'fixed') return formatCurrency(Number(discount.value));
        if (discount.rule_type === 'buy_x_get_y') return 'Beli X Gratis/Diskon Y';
        return `Bundle @ ${formatCurrency(Number(discount.value))}`;
    };

    return (
        <>
            <Head title={`Target Diskon — ${discount.name}`} />
            <AdminLayout title="Target Diskon" subtitle={discount.name} activeRoute="/admin/discounts">
                <div className="space-y-6">
                    {flash.success && (
                        <div className="animate-fade-in rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                            {flash.success}
                        </div>
                    )}

                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-foreground">{discount.name}</h2>
                                    <Badge variant={discount.target_type === 'all' ? 'success' : 'secondary'}>
                                        {TARGET_TYPE_LABELS[discount.target_type]}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Nilai: <span className="font-semibold text-primary">{formatDiscountValue()}</span>
                                </p>
                            </div>
                            <Link href="/admin/discounts" className="block">
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <ArrowLeft className="h-4 w-4" />
                                    Kembali ke Diskon
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {discount.target_type === 'all' ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Info className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Diskon ini berlaku untuk semua produk</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Ubah "Berlaku Untuk" di form edit jika ingin memilih target spesifik.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                                <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={selectAll}>Pilih Semua</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={deselectAll}>Kosongkan</Button>
                                    <Badge variant="secondary">{data.target_ids.length} terpilih</Badge>
                                </div>
                            </div>

                            <div className="max-h-[55vh] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
                                {filteredOptions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <Package className="mb-3 h-8 w-8 opacity-40" />
                                        <p className="text-sm">Tidak ditemukan.</p>
                                    </div>
                                ) : (
                                    filteredOptions.map((o) => {
                                        const selected = data.target_ids.includes(o.id);
                                        return (
                                            <button
                                                key={o.id}
                                                type="button"
                                                onClick={() => toggleOption(o.id)}
                                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                                                    selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                                                }`}
                                            >
                                                <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                                                    selected ? 'border-primary bg-primary text-white' : 'border-border'
                                                }`}>
                                                    {selected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-foreground">{o.label}</div>
                                                    {o.sub && <div className="text-xs text-muted-foreground">{o.sub}</div>}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Link href="/admin/discounts" className="block">
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">Batal</Button>
                                </Link>
                                <Button type="submit" variant="gradient" disabled={processing} className="w-full sm:w-auto">
                                    {processing ? 'Menyimpan...' : 'Simpan Target Terpilih'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </AdminLayout>
        </>
    );
}
