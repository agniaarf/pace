import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';

interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = 'Pilih tanggal', disabled }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectedDate = value ? parseISO(value) : undefined;

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange?.(format(date, 'yyyy-MM-dd'));
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className={cn(
                    'w-full justify-start text-left font-normal',
                    !value && 'text-muted-foreground',
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {value ? format(parseISO(value), 'dd MMM yyyy', { locale: localeId }) : placeholder}
            </Button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-2 animate-scale-in rounded-xl border border-border bg-card p-3 shadow-elevated">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleSelect}
                        locale={localeId}
                        classNames={{
                            root: 'p-0',
                            months: 'flex flex-col sm:flex-row gap-2',
                            month: 'w-full',
                            month_caption: 'flex justify-center pt-1 relative items-center mb-3',
                            caption_label: 'text-sm font-semibold',
                            nav: 'flex items-center gap-1',
                            button_previous: 'absolute left-1 top-1 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition',
                            button_next: 'absolute right-1 top-1 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition',
                            month_grid: 'w-full border-collapse space-y-1',
                            weekdays: 'flex',
                            weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
                            week: 'flex w-full mt-2',
                            day: 'p-0 size-9 text-center text-sm tabular-nums focus:relative focus:z-20 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-ring',
                            day_button: 'inline-flex items-center justify-center size-9 rounded-md text-sm transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
                            selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary rounded-md',
                            today: 'bg-accent text-accent-foreground rounded-md font-semibold',
                            outside: 'text-muted-foreground/50',
                            disabled: 'text-muted-foreground/50',
                            range_start: 'bg-primary text-primary-foreground rounded-l-md',
                            range_end: 'bg-primary text-primary-foreground rounded-r-md',
                            range_middle: 'bg-primary/20 rounded-none',
                            hidden: 'invisible',
                        }}
                        components={{
                            Chevron: ({ orientation }) => {
                                if (orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
                                return <ChevronRight className="h-4 w-4" />;
                            },
                        }}
                    />
                </div>
            )}
        </div>
    );
}
