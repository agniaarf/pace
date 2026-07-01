import AppLayout, { type NavItem } from '@/Components/Layout/AppLayout';
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Percent, Tags, Users } from 'lucide-react';

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Boxes, permission: 'products.view' },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree, permission: 'categories.view' },
    { label: 'Customers', href: '/admin/customers', icon: Users, permission: 'customers.view' },
    { label: 'Discounts', href: '/admin/discounts', icon: Percent, permission: 'discounts.view' },
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
