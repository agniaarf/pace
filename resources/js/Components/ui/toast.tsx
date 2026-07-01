import { CheckCircle, AlertCircle, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; text: string }> = {
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    warning: { icon: AlertCircle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(t => {
                    const config = TOAST_CONFIG[t.type];
                    const Icon = config.icon;
                    return (
                        <div
                            key={t.id}
                            className={`animate-slide-in-right flex items-center gap-3 rounded-xl border ${config.border} ${config.bg} px-4 py-3 shadow-elevated`}
                        >
                            <Icon className={`h-5 w-5 flex-shrink-0 ${config.text}`} />
                            <p className={`text-sm font-medium ${config.text}`}>{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
