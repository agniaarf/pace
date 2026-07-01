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
import { Switch } from '@/Components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Textarea } from '@/Components/ui/textarea';
import { Pagination } from '@/Components/Pagination';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Edit, FolderTree, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PaginatedResponse, PageProps } from '@/types';

interface Category {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    products_count: number;
}

interface CategoriesPageProps {
    categories: PaginatedResponse<Category>;
    filters: { search?: string };
}

export default function CategoriesIndex() {
    const { categories, filters, flash } = usePage<PageProps & CategoriesPageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true,
        sort_order: '0',
    });

    const openCreate = () => {
        setEditing(null);
        reset();
        setDialogOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditing(cat);
        setData({
            code: cat.code,
            name: cat.name,
            description: cat.description ?? '',
            is_active: cat.is_active,
            sort_order: cat.sort_order.toString(),
        });
        setDialogOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(`/admin/categories/${editing.id}`, { onSuccess: () => { setDialogOpen(false); reset(); } });
        } else {
            post('/admin/categories', { onSuccess: () => { setDialogOpen(false); reset(); } });
        }
    };

    const handleDelete = () => {
        if (deleteId) {
            useForm({}).delete(`/admin/categories/${deleteId}`, { onSuccess: () => setDeleteId(null) });
        }
    };

    return (
        <>
            <Head title="Categories" />
            <AdminLayout title="Categories" subtitle="Organize products into categories" activeRoute="/admin/categories">
                <div className="space-y-6">
                    {flash.success && (
                        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>
                    )}
                    {flash.error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{flash.error}</div>
                    )}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
                                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/admin/categories?search=${encodeURIComponent(search)}`; }} />
                        </div>
                        <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" />Add Category</Button>
                    </div>

                    <div className="rounded-xl border border-border bg-card shadow-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                            <FolderTree className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                            No categories found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.data.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-mono text-xs">{cat.code}</TableCell>
                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{cat.description ?? '—'}</TableCell>
                                            <TableCell><Badge variant="secondary">{cat.products_count} products</Badge></TableCell>
                                            <TableCell><Badge variant={cat.is_active ? 'success' : 'outline'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination meta={categories.meta ?? {
                            current_page: categories.current_page, from: categories.from, last_page: categories.last_page,
                            links: categories.links, path: categories.path, per_page: categories.per_page,
                            to: categories.to, total: categories.total, next_page_url: categories.next_page_url, prev_page_url: categories.prev_page_url,
                        }} />
                    </div>
                </div>
            </AdminLayout>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        <DialogDescription>{editing ? 'Update category information.' : 'Create a new product category.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. running-shoes" />
                            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Running Shoes" />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} placeholder="Category description..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input id="sort_order" type="number" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label>Active</Label>
                            <Switch checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
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
                        <DialogTitle>Delete Category?</DialogTitle>
                        <DialogDescription>This action cannot be undone. Categories with existing products cannot be deleted.</DialogDescription>
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
