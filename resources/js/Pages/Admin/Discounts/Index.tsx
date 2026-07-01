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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Pagination } from '@/Components/Pagination';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Edit, Percent, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PaginatedResponse, PageProps } from '@/types';
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
    discounts: PaginatedResponse<Discount>;
    filters: { search?: string; status?: string };
}

export default function DiscountsIndex() {
    const { discounts, filters, flash } = usePage<PageProps & DiscountsPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Discount | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

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

    return (
        <>
            <Head title="Discounts" />
            <AdminLayout title="Discounts" subtitle="Manage promotional discounts" activeRoute="/admin/discounts">
                <div className="space-y-6">
                    {flash.success && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>}
                    {flash.error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{flash.error}</div>}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search discounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
                                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/admin/discounts?search=${encodeURIComponent(search)}`; }} />
                        </div>
                        <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" />Add Discount</Button>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Applies To</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discounts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                            <Percent className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            No discounts found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    discounts.data.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell className="font-medium">{d.name}</TableCell>
                                            <TableCell className="capitalize">{d.type}</TableCell>
                                            <TableCell className="font-semibold text-primary">{formatDiscountValue(d)}</TableCell>
                                            <TableCell className="capitalize">{d.applies_to}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {d.start_date ? `${d.start_date} → ${d.end_date ?? '—'}` : 'No limit'}
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{d.products_count}</Badge></TableCell>
                                            <TableCell><Badge variant={d.status === 'active' ? 'success' : 'outline'}>{d.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination meta={discounts.meta ?? {
                            current_page: discounts.current_page, from: discounts.from, last_page: discounts.last_page,
                            links: discounts.links, path: discounts.path, per_page: discounts.per_page,
                            to: discounts.to, total: discounts.total, next_page_url: discounts.next_page_url, prev_page_url: discounts.prev_page_url,
                        }} />
                    </div>
                </div>
            </AdminLayout>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Discount' : 'Add Discount'}</DialogTitle>
                        <DialogDescription>{editing ? 'Update discount information.' : 'Create a new promotional discount.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Discount Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Summer Sale 20%" />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v as 'percentage' | 'nominal')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Value *</Label>
                                <Input id="value" type="number" step="0.01" value={data.value} onChange={(e) => setData('value', e.target.value)} placeholder="0" />
                                {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Applies To</Label>
                            <Select value={data.applies_to} onValueChange={(v) => setData('applies_to', v as 'all' | 'category' | 'product')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Products</SelectItem>
                                    <SelectItem value="category">Specific Category</SelectItem>
                                    <SelectItem value="product">Specific Product</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v as 'active' | 'inactive')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>{processing ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Discount?</DialogTitle>
                        <DialogDescription>This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
