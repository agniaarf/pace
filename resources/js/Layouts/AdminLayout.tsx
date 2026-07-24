import AppLayout, { type NavItem } from '@/Components/Layout/AppLayout';
import { usePage } from '@inertiajs/react';
import { Award, BarChart3, Boxes, Clock, FolderTree, LayoutDashboard, Percent, Receipt, RotateCcw, TrendingDown, Users, Package, History } from 'lucide-react';
import type { PageProps } from '@/types';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    activeRoute: string;
}

export default function AdminLayout({ children, title, subtitle, activeRoute }: AdminLayoutProps) {
    const { lowStockAlertCount } = usePage<PageProps>().props;

    const adminNavItems: NavItem[] = [
        { label: 'Dasbor', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Produk', href: '/admin/products', icon: Boxes, permission: 'products.read' },
        { label: 'Kategori', href: '/admin/categories', icon: FolderTree, permission: 'categories.read' },
        { label: 'Stok', href: '/admin/stock', icon: Package, permission: 'stock.read' },
        { label: 'Peringatan Stok', href: '/admin/stock/alerts', icon: TrendingDown, permission: 'stock.read', badge: lowStockAlertCount },
        { label: 'Riwayat Stok', href: '/admin/stock-movements', icon: History },
        { label: 'Pelanggan', href: '/admin/customers', icon: Users, permission: 'customers.read' },
        { label: 'Transaksi', href: '/admin/transactions', icon: Receipt },
        { label: 'Shift Kasir', href: '/admin/shifts', icon: Clock, permission: 'shifts.view' },
        { label: 'Retur', href: '/admin/returns', icon: RotateCcw, permission: 'returns.approve' },
        { label: 'Diskon', href: '/admin/discounts', icon: Percent, permission: 'discounts.read' },
        { label: 'Program Loyalitas', href: '/admin/loyalty/settings', icon: Award, permission: 'settings.view' },
        { label: 'Laporan', href: '/admin/reports', icon: BarChart3, permission: 'reports.view' },
    ];

    return (
        <AppLayout navItems={adminNavItems} activeRoute={activeRoute} title={title} subtitle={subtitle}>
            {children}
        </AppLayout>
    );
}
