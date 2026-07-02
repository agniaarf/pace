import AppLayout, { type NavItem } from '@/Components/Layout/AppLayout';
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Percent, TrendingDown, Users, Package } from 'lucide-react';

const adminNavItems: NavItem[] = [
    { label: 'Dasbor', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Produk', href: '/admin/products', icon: Boxes, permission: 'products.read' },
    { label: 'Kategori', href: '/admin/categories', icon: FolderTree, permission: 'categories.read' },
    { label: 'Stok', href: '/admin/stock', icon: Package, permission: 'stock.read' },
    { label: 'Peringatan Stok', href: '/admin/stock/alerts', icon: TrendingDown, permission: 'stock.read' },
    { label: 'Pelanggan', href: '/admin/customers', icon: Users, permission: 'customers.read' },
    { label: 'Diskon', href: '/admin/discounts', icon: Percent, permission: 'discounts.read' },
    { label: 'Laporan', href: '/admin/reports', icon: BarChart3, permission: 'reports.view' },
];

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    activeRoute: string;
}

export default function AdminLayout({ children, title, subtitle, activeRoute }: AdminLayoutProps) {
    return (
        <AppLayout navItems={adminNavItems} activeRoute={activeRoute} title={title} subtitle={subtitle}>
            {children}
        </AppLayout>
    );
}
