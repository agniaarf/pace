import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Award } from 'lucide-react';
import { FormEventHandler } from 'react';
import type { PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface LoyaltySettings {
    earn_rate: number;
    redeem_value: number;
    silver_threshold: number;
    gold_threshold: number;
}

interface LoyaltySettingsPageProps {
    settings: LoyaltySettings;
}

export default function LoyaltySettingsPage() {
    const { settings, flash } = usePage<PageProps & LoyaltySettingsPageProps>().props;

    const { data, setData, post, processing, errors } = useForm<LoyaltySettings>({
        earn_rate: settings.earn_rate,
        redeem_value: settings.redeem_value,
        silver_threshold: settings.silver_threshold,
        gold_threshold: settings.gold_threshold,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/loyalty/settings', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Program Loyalitas" />
            <AdminLayout title="Program Loyalitas" subtitle="Atur perolehan dan penukaran poin pelanggan" activeRoute="/admin/loyalty/settings">
                <div className="mx-auto max-w-xl space-y-6">
                    {flash.success && (
                        <div className="animate-fade-in rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6">
                        <div className="space-y-2">
                            <Label htmlFor="earn_rate">Perolehan Poin</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Setiap</span>
                                <Input id="earn_rate" type="number" min={1} value={data.earn_rate}
                                    onChange={(e) => setData('earn_rate', Number(e.target.value))} className="w-40" />
                                <span className="text-sm text-muted-foreground">belanja = 1 poin</span>
                            </div>
                            {errors.earn_rate && <p className="text-xs text-destructive">{errors.earn_rate}</p>}
                            <p className="text-xs text-muted-foreground">
                                Poin diberikan otomatis dari total belanja setiap transaksi selesai (pelanggan member).
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="redeem_value">Nilai Tukar Poin</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">1 poin =</span>
                                <Input id="redeem_value" type="number" min={1} value={data.redeem_value}
                                    onChange={(e) => setData('redeem_value', Number(e.target.value))} className="w-40" />
                                <span className="text-sm text-muted-foreground">rupiah potongan</span>
                            </div>
                            {errors.redeem_value && <p className="text-xs text-destructive">{errors.redeem_value}</p>}
                        </div>

                        <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Award className="h-3.5 w-3.5" />Ambang Batas Tier (berdasarkan total poin seumur hidup)
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="silver_threshold">Silver</Label>
                                    <Input id="silver_threshold" type="number" min={0} value={data.silver_threshold}
                                        onChange={(e) => setData('silver_threshold', Number(e.target.value))} />
                                    {errors.silver_threshold && <p className="text-xs text-destructive">{errors.silver_threshold}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gold_threshold">Gold</Label>
                                    <Input id="gold_threshold" type="number" min={0} value={data.gold_threshold}
                                        onChange={(e) => setData('gold_threshold', Number(e.target.value))} />
                                    {errors.gold_threshold && <p className="text-xs text-destructive">{errors.gold_threshold}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                            Contoh: belanja {formatCurrency(data.earn_rate * 10)} = 10 poin. Menukar 10 poin = potongan {formatCurrency(data.redeem_value * 10)}.
                        </div>

                        <Button type="submit" variant="gradient" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </form>
                </div>
            </AdminLayout>
        </>
    );
}
