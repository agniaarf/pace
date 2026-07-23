<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $shifts = Shift::with('cashier')
            ->when($request->cashier_id, fn ($q, $id) => $q->where('cashier_id', $id))
            ->when($request->date, fn ($q, $date) => $q->whereDate('opened_at', $date))
            ->latest('opened_at')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'cashier_name' => $s->cashier?->username ?? '—',
                'opening_balance' => (float) $s->opening_balance,
                'closing_balance_expected' => $s->closing_balance_expected !== null ? (float) $s->closing_balance_expected : null,
                'closing_balance_actual' => $s->closing_balance_actual !== null ? (float) $s->closing_balance_actual : null,
                'variance' => $s->variance !== null ? (float) $s->variance : null,
                'status' => $s->status,
                'opened_at' => $s->opened_at,
                'closed_at' => $s->closed_at,
            ]);

        $cashiers = User::where('role', 'kasir')->orderBy('username')->get(['id', 'username']);

        return Inertia::render('Admin/Shifts/Index', [
            'shifts' => $shifts,
            'cashiers' => $cashiers,
            'filters' => $request->only(['cashier_id', 'date']),
        ]);
    }
}
