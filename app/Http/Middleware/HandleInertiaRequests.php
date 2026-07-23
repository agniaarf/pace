<?php

namespace App\Http\Middleware;

use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'slogan' => 'Own Your Pace, Unleash Your Power',
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'name' => $user->profile?->full_name ?? $user->username,
                    'permissions' => $user->permissionSlugs(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'message' => fn () => $request->session()->get('message'),
                'transaction' => fn () => $request->session()->get('transaction'),
                'shiftSummary' => fn () => $request->session()->get('shiftSummary'),
            ],
            'requireShift' => (bool) config('pace.require_shift'),
            'activeShift' => function () use ($user) {
                if (!$user || !$user->isKasir()) {
                    return null;
                }

                $shift = Shift::where('cashier_id', $user->id)->where('status', 'open')->first();

                return $shift ? [
                    'id' => $shift->id,
                    'opening_balance' => (float) $shift->opening_balance,
                    'opened_at' => $shift->opened_at->toDateTimeString(),
                ] : null;
            },
        ];
    }
}
