import type { PageProps as InertiaPageProps } from '@inertiajs/core';

export type Role = 'admin' | 'kasir';

export interface AuthUser {
    id: number;
    username: string;
    email: string | null;
    role: Role;
    name: string;
    permissions: string[];
}

export interface AppInfo {
    name: string;
    slogan: string;
}

export interface FlashMessages {
    success?: string | null;
    error?: string | null;
    message?: string | null;
}

export interface SharedProps {
    app: AppInfo;
    auth: {
        user: AuthUser | null;
    };
    flash: FlashMessages;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> =
    T & SharedProps & InertiaPageProps;

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
        path: string;
        per_page: number;
        to: number;
        total: number;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
}
