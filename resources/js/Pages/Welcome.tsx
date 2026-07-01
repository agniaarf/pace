import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { PageProps } from '@/types';

export default function Welcome() {
    const { app, auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Welcome" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Ambient gradient blobs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-warning/20 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-chart-5/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">
                    {/* Nav */}
                    <header className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img
                                src="/images/pace-logo.png"
                                alt="PACE"
                                className="h-9 w-9 rounded-xl object-cover shadow-card ring-1 ring-border sm:h-11 sm:w-11"
                            />
                            <span className="text-lg font-extrabold tracking-tight sm:text-xl">
                                {app.name}
                            </span>
                        </div>

                        {auth.user ? (
                            <Link
                                href={
                                    auth.user.role === 'admin'
                                        ? '/admin/dashboard'
                                        : '/kasir/dashboard'
                                }
                                className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
                            >
                                Ke Dasbor
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
                            >
                                Masuk
                            </Link>
                        )}
                    </header>

                    {/* Hero */}
                    <main className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Sistem Kasir & Manajemen Retail
                        </div>

                        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                            Own Your <span className="text-gradient-primary">Pace</span>,
                            <br />
                            Unleash Your{' '}
                            <span className="text-gradient-primary">Power</span>
                        </h1>

                        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                            Sebuah POS modern untuk retail olahraga — kelola produk,
                            stok, pelanggan, dan transaksi kilat, semua dalam satu
                            ruang kerja yang dirancang dengan indah.
                        </p>

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href={auth.user ? '#' : '/login'}
                                className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
                            >
                                Mulai Sekarang
                                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {/* Feature chips */}
                        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                            {['Transaksi Cepat', 'Stok Real-time', 'Diskon Pintar', 'Insight'].map(
                                (feature) => (
                                    <div
                                        key={feature}
                                        className="rounded-2xl border border-border bg-card/70 px-4 py-5 text-sm font-semibold shadow-card backdrop-blur transition hover:-translate-y-1 hover:shadow-elevated"
                                    >
                                        {feature}
                                    </div>
                                ),
                            )}
                        </div>
                    </main>

                    <footer className="py-8 text-center text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} {app.name}. {app.slogan}.
                    </footer>
                </div>
            </div>
        </>
    );
}
