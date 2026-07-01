import AppLayout, { type NavItem } from '@/Components/Layout/AppLayout';
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Percent, Tags, TrendingDown, Users, Package } from 'lucide-react';

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Boxes, permission: 'products.read' },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree, permission: 'categories.read' },
    { label: 'Stock', href: '/admin/stock', icon: Package, permission: 'stock.read' },
    { label: 'Stock Alerts', href: '/admin/stock/alerts', icon: TrendingDown, permission: 'stock.read' },
    { label: 'Customers', href: '/admin/customers', icon: Users, permission: 'customers.read' },
    { label: 'Discounts', href: '/admin/discounts', icon: Percent, permission: 'discounts.read' },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'reports.view' },
    { label: 'Tags', href: '/admin/tags', icon: Tags },
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
