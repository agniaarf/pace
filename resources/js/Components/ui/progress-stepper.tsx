import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface ProgressStepperProps {
    steps: Step[];
    currentStep: number;
    className?: string;
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
    return (
        <div className={cn('flex items-center gap-1', className)}>
            {steps.map((step, idx) => {
                const isComplete = idx < currentStep;
                const isActive = idx === currentStep;
                const isLast = idx === steps.length - 1;

                return (
                    <div key={idx} className="flex flex-1 items-center gap-1">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                                    isComplete && 'bg-primary text-primary-foreground',
                                    isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse-ring',
                                    !isComplete && !isActive && 'bg-muted text-muted-foreground',
                                )}
                            >
                                {isComplete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                            </div>
                            <span
                                className={cn(
                                    'hidden text-xs font-semibold transition-colors sm:inline',
                                    isActive ? 'text-foreground' : 'text-muted-foreground',
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div className="relative mx-1 h-1 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn(
                                        'absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500',
                                        isComplete ? 'w-full' : 'w-0',
                                    )}
                                />
                                {isActive && (
                                    <div className="track-progress absolute inset-0" />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
