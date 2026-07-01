import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32" />
        </div>
    );
}

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <SkeletonRow key={r} columns={columns} />
            ))}
        </div>
    );
}
