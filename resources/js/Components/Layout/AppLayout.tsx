import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronsLeft, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { AuthUser, PageProps } from '@/types';

export interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
}

interface AppLayoutProps {
    children: React.ReactNode;
    navItems: NavItem[];
    activeRoute: string;
    title: string;
    subtitle?: string;
}

export default function AppLayout({ children, navItems, activeRoute, title, subtitle }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
    const user = auth.user as AuthUser;

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar-collapsed', String(next));
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-sidebar transition-all duration-300 lg:translate-x-0 ${
                    collapsed ? 'w-16' : 'w-64'
                } ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo area */}
                <div className={`flex items-center px-3 py-4 ${collapsed ? 'flex-col gap-2' : 'justify-between px-5'}`}>
                    <img
                        src="/images/pace-logo.png"
                        alt="PACE"
                        className={`object-contain ${collapsed ? 'h-8 w-auto' : 'h-11 w-auto'}`}
                    />
                    {collapsed ? (
                        <button
                            onClick={toggleCollapse}
                            className="hidden items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/50 transition hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
                        >
                            <ChevronsLeft className="h-4 w-4 rotate-180 transition-transform duration-300" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleCollapse}
                                className="hidden items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/50 transition hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
                            >
                                <ChevronsLeft className="h-4 w-4 transition-transform duration-300" />
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-sidebar-foreground/60 lg:hidden"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navItems.map((item, idx) => {
                        const Icon = item.icon;
                        const isActive = activeRoute === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={`group flex animate-fade-in-up items-center rounded-xl text-sm font-medium transition-all ${
                                    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                                } ${
                                    isActive
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!collapsed && item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User card at bottom */}
                <div className="border-t border-sidebar-border px-3 py-4">
                    <div className={`flex items-center gap-3 rounded-xl bg-sidebar-accent/50 py-2.5 ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                                    {user.name}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur-xl lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-muted-foreground lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
                            {subtitle && (
                                <p className="text-xs text-muted-foreground">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent">
                                    <span className="hidden sm:inline">{user.name}</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/logout" method="post" as="button" className="w-full cursor-pointer text-destructive hover:text-destructive focus:text-destructive">
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 animate-fade-in p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
