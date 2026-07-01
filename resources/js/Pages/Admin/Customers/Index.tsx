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
import { Textarea } from '@/Components/ui/textarea';
import { Pagination } from '@/Components/Pagination';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PaginatedResponse, PageProps } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Customer {
    id: number;
    member_code: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: 'male' | 'female' | null;
    status: 'active' | 'inactive';
    total_purchases: number;
    total_spent: string;
    join_date: string | null;
}

interface CustomersPageProps {
    customers: PaginatedResponse<Customer>;
    filters: { search?: string; status?: string };
}

export default function CustomersIndex() {
    const { customers, filters, flash } = usePage<PageProps & CustomersPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        member_code: '',
        full_name: '',
        email: '',
        phone: '',
        gender: '',
        date_of_birth: '',
        province: '',
        city: '',
        address: '',
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => { setEditing(null); reset(); setDialogOpen(true); };

    const openEdit = (c: Customer) => {
        setEditing(c);
        setData({
            member_code: c.member_code ?? '',
            full_name: c.full_name,
            email: c.email ?? '',
            phone: c.phone ?? '',
            gender: c.gender ?? '',
            date_of_birth: '',
            province: '',
            city: '',
            address: '',
            status: c.status,
        });
        setDialogOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(`/admin/customers/${editing.id}`, { onSuccess: () => { setDialogOpen(false); reset(); } });
        } else {
            post('/admin/customers', { onSuccess: () => { setDialogOpen(false); reset(); } });
        }
    };

    const handleDelete = () => {
        if (deleteId) { useForm({}).delete(`/admin/customers/${deleteId}`, { onSuccess: () => setDeleteId(null) }); }
    };

    return (
        <>
            <Head title="Customers" />
            <AdminLayout title="Customers" subtitle="Manage customer relationships" activeRoute="/admin/customers">
                <div className="space-y-6">
                    {flash.success && <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>}
                    {flash.error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{flash.error}</div>}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
                                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/admin/customers?search=${encodeURIComponent(search)}`; }} />
                        </div>
                        <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" />Add Customer</Button>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Member Code</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Purchases</TableHead>
                                    <TableHead>Total Spent</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                            <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.data.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    {c.full_name}
                                                    {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{c.member_code ?? '—'}</TableCell>
                                            <TableCell>{c.phone ?? '—'}</TableCell>
                                            <TableCell>{c.total_purchases}</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(Number(c.total_spent))}</TableCell>
                                            <TableCell><Badge variant={c.status === 'active' ? 'success' : 'outline'}>{c.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination meta={customers.meta ?? {
                            current_page: customers.current_page, from: customers.from, last_page: customers.last_page,
                            links: customers.links, path: customers.path, per_page: customers.per_page,
                            to: customers.to, total: customers.total, next_page_url: customers.next_page_url, prev_page_url: customers.prev_page_url,
                        }} />
                    </div>
                </div>
            </AdminLayout>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                        <DialogDescription>{editing ? 'Update customer information.' : 'Register a new customer.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input id="full_name" value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} />
                                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member_code">Member Code</Label>
                                <Input id="member_code" value={data.member_code} onChange={(e) => setData('member_code', e.target.value)} placeholder="Auto-generated if empty" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={data.gender} onValueChange={(v) => setData('gender', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth">Date of Birth</Label>
                                <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">Province</Label>
                                <Input id="province" value={data.province} onChange={(e) => setData('province', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={2} />
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
                        <DialogTitle>Delete Customer?</DialogTitle>
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
