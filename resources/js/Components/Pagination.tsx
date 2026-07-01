import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedResponse } from '@/types';

interface PaginationProps {
    meta: PaginatedResponse<unknown>['meta'];
}

export function Pagination({ meta }: PaginationProps) {
    if (meta.last_page <= 1) return null;

    const pages: (number | string)[] = [];
    const current = meta.current_page;
    const last = meta.last_page;

    if (last <= 7) {
        for (let i = 1; i <= last; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
            pages.push(i);
        }
        if (current < last - 2) pages.push('...');
        pages.push(last);
    }

    return (
        <div className="flex items-center justify-between gap-2 px-2 py-4">
            <p className="text-sm text-muted-foreground">
                Showing {meta.from}–{meta.to} of {meta.total} results
            </p>
            <div className="flex items-center gap-1">
                {meta.prev_page_url && (
                    <Link
                        href={meta.prev_page_url}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                        preserveScroll
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                )}
                {pages.map((page, i) =>
                    typeof page === 'number' ? (
                        <Link
                            key={i}
                            href={`${meta.path}?page=${page}`}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
                                page === current
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'border border-border bg-card text-muted-foreground hover:bg-accent'
                            }`}
                            preserveScroll
                        >
                            {page}
                        </Link>
                    ) : (
                        <span key={i} className="px-2 text-muted-foreground">
                            {page}
                        </span>
                    ),
                )}
                {meta.next_page_url && (
                    <Link
                        href={meta.next_page_url}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                        preserveScroll
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}
