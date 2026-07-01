import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    className?: string;
    headerClassName?: string;
    render: (row: T) => ReactNode;
}

export interface FilterOption {
    label: string;
    value: string;
}

interface DataTableProps<T> {
    data: PaginatedResponse<T>;
    columns: Column<T>[];
    routeName: string;
    dataKey: string;
    filters?: Record<string, string | undefined>;
    searchPlaceholder?: string;
    searchFields?: string;
    emptyIcon?: React.ComponentType<{ className?: string }>;
    emptyMessage?: string;
    toolbarRight?: ReactNode;
    toolbarLeft?: ReactNode;
    rowKey?: (row: T) => string | number;
    perPageOptions?: number[];
}

export function DataTable<T>({
    data,
    columns,
    routeName,
    dataKey,
    filters = {},
    searchPlaceholder = 'Search...',
    searchFields = 'search',
    emptyIcon: EmptyIcon,
    emptyMessage = 'No data found.',
    toolbarRight,
    toolbarLeft,
    rowKey,
    perPageOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [perPage, setPerPage] = useState(data.per_page ?? 10);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadingRef = useRef(false);

    const reload = (params: Record<string, unknown>) => {
        const allParams: Record<string, unknown> = { ...filters, page: 1, ...params };

        Object.keys(allParams).forEach((k) => {
            if (allParams[k] === undefined || allParams[k] === '') delete allParams[k];
        });

        loadingRef.current = true;
        router.reload({
            only: [dataKey],
            data: allParams as Record<string, string>,
            onFinish: () => { loadingRef.current = false; },
        });
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                reload({ [searchFields]: search });
            }
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    const handlePageChange = (page: number) => {
        reload({ page });
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        reload({ page: 1, per_page: value });
    };

    const clearSearch = () => {
        setSearch('');
        reload({ [searchFields]: '', page: 1 });
    };

    const meta = data.meta ?? {
        current_page: data.current_page,
        from: data.from,
        last_page: data.last_page,
        links: data.links,
        path: data.path,
        per_page: data.per_page,
        to: data.to,
        total: data.total,
        next_page_url: data.next_page_url,
        prev_page_url: data.prev_page_url,
    };

    const currentPage = meta.current_page;
    const lastPage = meta.last_page;
    const total = meta.total;
    const from = meta.from;
    const to = meta.to;

    const pages: (number | string)[] = [];
    if (lastPage <= 7) {
        for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < lastPage - 2) pages.push('...');
        pages.push(lastPage);
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-8"
                        />
                        {search && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {/* Extra filter slot */}
                    {toolbarLeft}
                </div>
                {toolbarRight && <div className="flex items-center gap-2">{toolbarRight}</div>}
            </div>

            {/* Table */}
            <div className={cn('rounded-xl border border-border bg-card shadow-card transition-opacity', loadingRef.current && 'opacity-60')}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.headerClassName}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                                    {EmptyIcon && <EmptyIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />}
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.data.map((row, idx) => (
                                <TableRow key={rowKey ? rowKey(row) : idx} className="animate-fade-in">
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={col.className}>
                                            {col.render(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination footer */}
                {total > 0 && (
                    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold text-foreground">{from}</span>–
                                <span className="font-semibold text-foreground">{to}</span> of{' '}
                                <span className="font-semibold text-foreground">{total}</span>
                            </p>
                            {/* Per page selector */}
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            >
                                {perPageOptions.map((n) => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>
                        </div>

                        {/* Page buttons */}
                        {lastPage > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent disabled:opacity-40"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                {pages.map((page, i) =>
                                    typeof page === 'number' ? (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(page)}
                                            className={cn(
                                                'flex h-8 min-w-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition',
                                                page === currentPage
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'border border-border bg-card text-muted-foreground hover:bg-accent',
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ) : (
                                        <span key={i} className="px-1 text-muted-foreground">
                                            {page}
                                        </span>
                                    ),
                                )}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === lastPage}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent disabled:opacity-40"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(lastPage)}
                                    disabled={currentPage === lastPage}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent disabled:opacity-40"
                                >
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
