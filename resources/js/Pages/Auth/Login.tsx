import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import type { PageProps } from '@/types';

export default function Login() {
    const { app, flash } = usePage<PageProps>().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            onSuccess: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Sign In" />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
                {/* Ambient gradient blobs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-warning/15 blur-3xl" />
                    <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-chart-5/10 blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-md">
                    {/* Brand header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex items-center justify-center">
                            <img
                                src="/images/pace-logo.png"
                                alt="PACE"
                                className="h-16 w-16 rounded-2xl object-cover shadow-glow ring-2 ring-border animate-float"
                            />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {app.name}
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {app.slogan}
                        </p>
                    </div>

                    {/* Login card */}
                    <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-elevated backdrop-blur-xl">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">Welcome back</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {flash.error && (
                            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                                {flash.error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="pl-10"
                                        placeholder="Enter your username"
                                        autoFocus
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-xs font-medium text-destructive">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="pl-10 pr-10"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs font-medium text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                />
                                Remember me
                            </label>

                            <Button
                                type="submit"
                                variant="gradient"
                                size="lg"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                        {/* Demo credentials hint */}
                        <div className="mt-6 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Demo accounts:</p>
                            <p className="mt-1">Admin: <span className="font-mono">admin / password</span></p>
                            <p>Kasir: <span className="font-mono">kasir / password</span></p>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} {app.name}. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}
