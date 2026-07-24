<?php

namespace Database\Seeders;

use App\Models\AppMaster;
use App\Models\Category;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // Payment methods
        $paymentMethods = [
            ['code' => 'cash', 'label' => 'Cash', 'value' => ['icon' => 'banknote']],
            ['code' => 'qris', 'label' => 'QRIS', 'value' => ['icon' => 'qr-code']],
            ['code' => 'transfer', 'label' => 'Bank Transfer', 'value' => ['icon' => 'building-2']],
            ['code' => 'debit', 'label' => 'Debit Card', 'value' => ['icon' => 'credit-card']],
            ['code' => 'ewallet', 'label' => 'E-Wallet', 'value' => ['icon' => 'wallet']],
        ];

        foreach ($paymentMethods as $i => $pm) {
            AppMaster::updateOrCreate(
                ['type' => 'payment_method', 'code' => $pm['code']],
                [
                    'label' => $pm['label'],
                    'value' => $pm['value'],
                    'is_active' => true,
                    'sort_order' => $i,
                ]
            );
        }

        // Transaction statuses
        $transactionStatuses = [
            ['code' => 'draft', 'label' => 'Draft'],
            ['code' => 'pending', 'label' => 'Pending'],
            ['code' => 'completed', 'label' => 'Completed'],
            ['code' => 'cancelled', 'label' => 'Cancelled'],
        ];

        foreach ($transactionStatuses as $i => $status) {
            AppMaster::updateOrCreate(
                ['type' => 'transaction_status', 'code' => $status['code']],
                ['label' => $status['label'], 'is_active' => true, 'sort_order' => $i]
            );
        }

        // Loyalty program settings (points earn rate, redemption value, tier thresholds)
        AppMaster::updateOrCreate(
            ['type' => 'loyalty_setting', 'code' => 'default'],
            [
                'label' => 'Pengaturan Loyalitas',
                'value' => [
                    'earn_rate' => 10000,       // Rp spent per 1 point earned
                    'redeem_value' => 100,      // Rp value of 1 point when redeemed
                    'silver_threshold' => 500,  // lifetime points to reach Silver
                    'gold_threshold' => 2000,   // lifetime points to reach Gold
                ],
                'is_active' => true,
            ]
        );

        // Generic active/inactive statuses (reusable for product/user)
        foreach (['active' => 'Active', 'inactive' => 'Inactive'] as $i => $label) {
            AppMaster::updateOrCreate(
                ['type' => 'record_status', 'code' => $i],
                ['label' => $label, 'is_active' => true]
            );
        }

        // Product categories
        $categories = [
            ['code' => 'running-shoes', 'name' => 'Running Shoes'],
            ['code' => 'apparel', 'name' => 'Apparel'],
            ['code' => 'accessories', 'name' => 'Accessories'],
            ['code' => 'equipment', 'name' => 'Equipment'],
            ['code' => 'nutrition', 'name' => 'Nutrition'],
        ];

        foreach ($categories as $i => $cat) {
            Category::updateOrCreate(
                ['code' => $cat['code']],
                ['name' => $cat['name'], 'is_active' => true, 'sort_order' => $i]
            );
        }
    }
}
