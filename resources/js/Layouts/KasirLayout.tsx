import AppLayout, { type NavItem } from '@/Components/Layout/AppLayout';
import { LayoutDashboard, ShoppingCart, Users } from 'lucide-react';

const kasirNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/kasir/dashboard', icon: LayoutDashboard },
    { label: 'Cashier', href: '/kasir/cashier', icon: ShoppingCart, permission: 'transactions.create' },
    { label: 'Customers', href: '/kasir/customers', icon: Users, permission: 'customers.read' },
];

interface KasirLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    activeRoute: string;
}

export default function KasirLayout({ children, title, subtitle, activeRoute }: KasirLayoutProps) {
    return (
        <AppLayout navItems={kasirNavItems} activeRoute={activeRoute} title={title} subtitle={subtitle}>
            {children}
        </AppLayout>
    );
}
