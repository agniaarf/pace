<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\TransactionPayment;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function open(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'opening_balance' => ['required', 'numeric', 'min:0'],
        ]);

        $cashierId = $request->user()->id;

        if (Shift::where('cashier_id', $cashierId)->where('status', 'open')->exists()) {
            return back()->with('error', 'Anda sudah memiliki shift yang sedang berjalan.');
        }

        try {
            Shift::create([
                'cashier_id' => $cashierId,
                'opening_balance' => $validated['opening_balance'],
                'status' => 'open',
                'opened_at' => now(),
            ]);
        } catch (QueryException) {
            return back()->with('error', 'Anda sudah memiliki shift yang sedang berjalan.');
        }

        return back()->with('success', 'Shift berhasil dibuka.');
    }

    public function close(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'closing_balance_actual' => ['required', 'numeric', 'min:0'],
        ]);

        $shift = Shift::where('cashier_id', $request->user()->id)->where('status', 'open')->first();

        if (!$shift) {
            return back()->with('error', 'Tidak ada shift aktif untuk ditutup.');
        }

        $cashSales = TransactionPayment::whereHas('transaction', fn ($q) => $q->where('shift_id', $shift->id))
            ->whereHas('paymentMethod', fn ($q) => $q->where('code', 'cash'))
            ->sum('amount');

        $expected = (float) $shift->opening_balance + (float) $cashSales;
        $variance = $validated['closing_balance_actual'] - $expected;

        $shift->update([
            'closing_balance_expected' => $expected,
            'closing_balance_actual' => $validated['closing_balance_actual'],
            'variance' => $variance,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return back()->with('success', 'Shift berhasil ditutup.')->with('shiftSummary', [
            'opening_balance' => (float) $shift->opening_balance,
            'closing_balance_expected' => $expected,
            'closing_balance_actual' => (float) $shift->closing_balance_actual,
            'variance' => (float) $shift->variance,
        ]);
    }
}
