<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppMaster;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltySettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Loyalty/Settings', [
            'settings' => $this->setting()->value,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'earn_rate' => ['required', 'integer', 'min:1'],
            'redeem_value' => ['required', 'integer', 'min:1'],
            'silver_threshold' => ['required', 'integer', 'min:0'],
            'gold_threshold' => ['required', 'integer', 'gt:silver_threshold'],
        ]);

        $this->setting()->update(['value' => $validated]);

        return back()->with('success', 'Pengaturan loyalitas berhasil disimpan.');
    }

    private function setting(): AppMaster
    {
        return AppMaster::firstOrCreate(
            ['type' => 'loyalty_setting', 'code' => 'default'],
            ['label' => 'Pengaturan Loyalitas', 'value' => [
                'earn_rate' => 10000,
                'redeem_value' => 100,
                'silver_threshold' => 500,
                'gold_threshold' => 2000,
            ], 'is_active' => true]
        );
    }
}
