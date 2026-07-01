import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    className?: string;
    headerClassName?: string;
    render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchKeys?: (keyof T)[];
    searchFn?: (row: T, query: string) => boolean;
    searchPlaceholder?: string;
    emptyIcon?: React.ComponentType<{ className?: string }>;
    emptyMessage?: string;
    toolbarRight?: ReactNode;
    toolbarLeft?: ReactNode;
    rowKey?: (row: T) => string | number;
    perPageOptions?: number[];
    initialPerPage?: number;
}

export function DataTable<T>({
    data,
    columns,
    searchKeys,
    searchFn,
    searchPlaceholder = 'Search...',
    emptyIcon: EmptyIcon,
    emptyMessage = 'No data found.',
    toolbarRight,
    toolbarLeft,
    rowKey,
    perPageOptions = [10, 25, 50, 100],
    initialPerPage = 10,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(initialPerPage);

    const defaultSearchFn = (row: T, query: string): boolean => {
        if (!searchKeys) return true;
        const q = query.toLowerCase();
        return searchKeys.some((key) => {
            const val = row[key];
            return val != null && String(val).toLowerCase().includes(q);
        });
    };

    const filterFn = searchFn ?? defaultSearchFn;

    const filteredData = useMemo(() => {
        if (!search) return data;
        return data.filter((row) => filterFn(row, search));
    }, [data, search, filterFn]);

    const total = filteredData.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(currentPage, lastPage);
    const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
    const to = Math.min(safePage * perPage, total);
    const pageData = filteredData.slice((safePage - 1) * perPage, safePage * perPage);

    const pages: (number | string)[] = [];
    if (lastPage <= 7) {
        for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
        pages.push(1);
        if (safePage > 3) pages.push('...');
        for (let i = Math.max(2, safePage - 1); i <= Math.min(lastPage - 1, safePage + 1); i++) {
            pages.push(i);
        }
        if (safePage < lastPage - 2) pages.push('...');
        pages.push(lastPage);
    }

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const clearSearch = () => {
        setSearch('');
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, lastPage)));
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
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
                    {toolbarLeft}
                </div>
                {toolbarRight && <div className="flex items-center gap-2">{toolbarRight}</div>}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-card">
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
                        {pageData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                                    {EmptyIcon && <EmptyIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />}
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageData.map((row, idx) => (
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

                        {lastPage > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={safePage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent disabled:opacity-40"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(safePage - 1)}
                                    disabled={safePage === 1}
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
                                                page === safePage
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
                                    onClick={() => handlePageChange(safePage + 1)}
                                    disabled={safePage === lastPage}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent disabled:opacity-40"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(lastPage)}
                                    disabled={safePage === lastPage}
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
