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
import { Textarea } from '@/Components/ui/textarea';
import { DataTable, type Column } from '@/Components/DataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Edit, Plus, Trash2, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PageProps } from '@/types';
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
    customers: Customer[];
}

export default function CustomersIndex() {
    const { customers, flash } = usePage<PageProps & CustomersPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const deleteForm = useForm();
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
        if (deleteId) { deleteForm.delete(`/admin/customers/${deleteId}`, { preserveScroll: true, onSuccess: () => setDeleteId(null) }); }
    };

    const columns: Column<Customer>[] = [
        {
            key: 'name',
            header: 'Nama',
            render: (c) => (
                <div className="flex flex-col">
                    <span className="font-medium">{c.full_name}</span>
                    {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                </div>
            ),
        },
        {
            key: 'member_code',
            header: 'Kode Member',
            render: (c) => <span className="font-mono text-xs text-muted-foreground">{c.member_code ?? '—'}</span>,
        },
        {
            key: 'phone',
            header: 'Telepon',
            render: (c) => c.phone ?? '—',
        },
        {
            key: 'total_purchases',
            header: 'Pembelian',
            render: (c) => c.total_purchases,
        },
        {
            key: 'total_spent',
            header: 'Total Belanja',
            render: (c) => <span className="font-semibold">{formatCurrency(Number(c.total_spent))}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (c) => <Badge variant={c.status === 'active' ? 'success' : 'destructive'}>{c.status === 'active' ? 'Aktif' : 'Tidak'}</Badge>,
        },
        {
            key: 'actions',
            header: 'Aksi',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (c) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    {c.status !== 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Pelanggan" />
            <AdminLayout title="Pelanggan" subtitle="Kelola hubungan pelanggan" activeRoute="/admin/customers">
                <div className="space-y-6">
                    {flash.success && <div className="animate-fade-in rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>}
                    {flash.error && <div className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{flash.error}</div>}

                    <DataTable
                        data={customers}
                        columns={columns}
                        searchKeys={['full_name', 'phone', 'member_code', 'email']}
                        searchPlaceholder="Cari pelanggan..."
                        emptyIcon={Users}
                        emptyMessage="Tidak ada pelanggan ditemukan."
                        rowKey={(c) => c.id}
                        showRowNumber
                        toolbarRight={
                            <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" />Tambah Pelanggan</Button>
                        }
                    />
                </div>
            </AdminLayout>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</DialogTitle>
                        <DialogDescription>{editing ? 'Perbarui informasi pelanggan.' : 'Daftarkan pelanggan baru.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nama Lengkap *</Label>
                                <Input id="full_name" value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} />
                                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member_code">Kode Member</Label>
                                <Input id="member_code" value={data.member_code} onChange={(e) => setData('member_code', e.target.value)} placeholder="Otomatis dibuat jika kosong" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telepon</Label>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis Kelamin</Label>
                                <Select value={data.gender} onValueChange={(v) => setData('gender', v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Laki-laki</SelectItem>
                                        <SelectItem value="female">Perempuan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                                <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">Provinsi</Label>
                                <Input id="province" value={data.province} onChange={(e) => setData('province', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Kota</Label>
                                <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v as 'active' | 'inactive')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Nonaktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button type="submit" variant="gradient" disabled={processing}>{processing ? 'Menyimpan...' : editing ? 'Perbarui' : 'Buat'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Pelanggan?</DialogTitle>
                        <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
