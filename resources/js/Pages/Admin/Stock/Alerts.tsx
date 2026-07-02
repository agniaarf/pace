import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, PackageX, TrendingDown } from 'lucide-react';
import type { PageProps } from '@/types';

interface StockAlertItem {
    id: number;
    product_name: string;
    sku: string | null;
    category: string | null;
    quantity: number;
    minimum_quantity: number;
    status: 'low' | 'out';
}

interface AlertsPageProps {
    lowStock: StockAlertItem[];
    outOfStock: StockAlertItem[];
}

export default function StockAlerts() {
    const { lowStock, outOfStock } = usePage<PageProps & AlertsPageProps>().props;
    const totalAlerts = lowStock.length + outOfStock.length;

    return (
        <>
            <Head title="Peringatan Stok" />
            <AdminLayout title="Peringatan Stok" subtitle={`${totalAlerts} produk perlu perhatian`} activeRoute="/admin/stock/alerts">
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-700">Stok Menipis</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                                    <TrendingDown className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-extrabold text-amber-700">{lowStock.length}</p>
                                <p className="mt-1 text-xs text-amber-600">Produk di bawah ambang batas minimum</p>
                            </CardContent>
                        </Card>

                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-red-700">Stok Habis</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                                    <PackageX className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-extrabold text-red-700">{outOfStock.length}</p>
                                <p className="mt-1 text-xs text-red-600">Produk dengan inventaris nol</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Out of stock table */}
                    {outOfStock.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PackageX className="h-5 w-5 text-red-500" />
                                    Stok Habis ({outOfStock.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead className="text-center">Jumlah</TableHead>
                                            <TableHead className="text-center">Batas Min.</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {outOfStock.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-semibold">{item.product_name}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{item.sku ?? '—'}</TableCell>
                                                <TableCell>{item.category ?? '—'}</TableCell>
                                                <TableCell className="text-center font-bold text-red-500">{item.quantity}</TableCell>
                                                <TableCell className="text-center">{item.minimum_quantity}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="destructive">Stok Habis</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Low stock table */}
                    {lowStock.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Stok Menipis ({lowStock.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead className="text-center">Jumlah</TableHead>
                                            <TableHead className="text-center">Batas Min.</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStock.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-semibold">{item.product_name}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{item.sku ?? '—'}</TableCell>
                                                <TableCell>{item.category ?? '—'}</TableCell>
                                                <TableCell className="text-center font-bold text-amber-600">{item.quantity}</TableCell>
                                                <TableCell className="text-center">{item.minimum_quantity}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="default">Stok Menipis</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty state */}
                    {totalAlerts === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <AlertTriangle className="mb-4 h-12 w-12 text-emerald-400" />
                                <p className="text-lg font-semibold text-foreground">Semua produk stoknya aman!</p>
                                <p className="mt-1 text-sm">Tidak ada peringatan stok saat ini.</p>
                            </CardContent>
                        </Card>
                    )}

                    <Link href="/admin/stock" className="block">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="h-4 w-4" />Kembali ke Manajemen Stok
                        </Button>
                    </Link>
                </div>
            </AdminLayout>
        </>
    );
}
