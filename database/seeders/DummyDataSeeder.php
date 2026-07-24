<?php

namespace Database\Seeders;

use App\Models\AppMaster;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $categories = $this->seedCategories();
        $discounts = $this->seedDiscounts($categories);
        $products = $this->seedProducts($categories, $discounts);
        $this->seedStock($products);
        $this->seedCustomers();
        $this->seedTransactions($products);
    }

    private function seedCategories(): array
    {
        $categories = [
            ['code' => 'sepatu-lari', 'name' => 'Sepatu Lari', 'description' => 'Sepatu lari performa tinggi untuk segala medan', 'sort' => 1],
            ['code' => 'pakaian-olahraga', 'name' => 'Pakaian Olahraga', 'description' => 'Pakaian olahraga untuk pria dan wanita', 'sort' => 2],
            ['code' => 'aksesoris', 'name' => 'Aksesoris', 'description' => 'Aksesoris dan perlengkapan olahraga', 'sort' => 3],
            ['code' => 'perlengkapan', 'name' => 'Perlengkapan', 'description' => 'Perlengkapan latihan dan kompetisi', 'sort' => 4],
            ['code' => 'nutrisi', 'name' => 'Nutrisi & Suplemen', 'description' => 'Nutrisi dan suplemen olahraga', 'sort' => 5],
            ['code' => 'fitness', 'name' => 'Peralatan Fitness', 'description' => 'Peralatan gym dan fitness', 'sort' => 6],
        ];

        $result = [];
        foreach ($categories as $cat) {
            $result[$cat['code']] = Category::updateOrCreate(
                ['code' => $cat['code']],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'is_active' => true,
                    'sort_order' => $cat['sort'],
                ]
            );
        }

        return $result;
    }

    private function seedDiscounts(array $categories): array
    {
        $discounts = [
            [
                'name' => 'Grand Opening Diskon 20%',
                'rule_type' => 'percentage',
                'value' => 20,
                'target_type' => 'all',
                'target_ids' => null,
                'start_date' => now()->subDays(30),
                'end_date' => now()->addDays(60),
            ],
            [
                'name' => 'Promo Sepatu Lari 15%',
                'rule_type' => 'percentage',
                'value' => 15,
                'target_type' => 'category',
                'target_ids' => [$categories['sepatu-lari']->id],
                'start_date' => now()->subDays(14),
                'end_date' => now()->addDays(30),
            ],
            [
                'name' => 'Flash Sale Nutrisi',
                'rule_type' => 'fixed',
                'value' => 25000,
                'target_type' => 'category',
                'target_ids' => [$categories['nutrisi']->id],
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(7),
            ],
            [
                'name' => 'Beli 2 Gratis 1 Kaus Kaki',
                'rule_type' => 'buy_x_get_y',
                'value' => null,
                'target_type' => 'category',
                'target_ids' => [$categories['pakaian-olahraga']->id],
                'buy_quantity' => 2,
                'get_quantity' => 1,
                'get_discount_percent' => 100,
                'start_date' => now()->subDays(5),
                'end_date' => now()->addDays(25),
            ],
        ];

        $result = [];
        foreach ($discounts as $disc) {
            $d = Discount::updateOrCreate(
                ['name' => $disc['name']],
                array_merge($disc, ['status' => 'active'])
            );
            $result[] = $d;
        }

        return $result;
    }

    private function seedProducts(array $categories, array $discounts): array
    {
        $products = [
            // Sepatu Lari
            ['name' => 'Nike Air Zoom Pegasus 40', 'category' => 'sepatu-lari', 'sku' => 'NK-PG40-001', 'brand' => 'Nike', 'size' => '42', 'cost' => 850000, 'price' => 1499000, 'stock' => 24, 'min' => 5],
            ['name' => 'Adidas Adizero Adios Pro 3', 'category' => 'sepatu-lari', 'sku' => 'AD-AP3-002', 'brand' => 'Adidas', 'size' => '41', 'cost' => 1200000, 'price' => 2299000, 'stock' => 12, 'min' => 5],
            ['name' => 'Asics Gel-Kayano 30', 'category' => 'sepatu-lari', 'sku' => 'AS-GK30-003', 'brand' => 'ASICS', 'size' => '43', 'cost' => 950000, 'price' => 1799000, 'stock' => 3, 'min' => 5],
            ['name' => 'Hoka Clifton 9', 'category' => 'sepatu-lari', 'sku' => 'HK-CL9-004', 'brand' => 'Hoka', 'size' => '42', 'cost' => 900000, 'price' => 1699000, 'stock' => 8, 'min' => 5],
            ['name' => 'Brooks Ghost 16', 'category' => 'sepatu-lari', 'sku' => 'BR-G16-005', 'brand' => 'Brooks', 'size' => '40', 'cost' => 800000, 'price' => 1499000, 'stock' => 0, 'min' => 5],

            // Pakaian Olahraga
            ['name' => 'Nike Dri-FIT Running Shirt', 'category' => 'pakaian-olahraga', 'sku' => 'NK-DFR-010', 'brand' => 'Nike', 'size' => 'L', 'cost' => 150000, 'price' => 349000, 'stock' => 45, 'min' => 10],
            ['name' => 'Under Armour HeatGear Leggings', 'category' => 'pakaian-olahraga', 'sku' => 'UA-HGL-011', 'brand' => 'Under Armour', 'size' => 'M', 'cost' => 200000, 'price' => 499000, 'stock' => 30, 'min' => 10],
            ['name' => 'Adidas Tiro Track Jacket', 'category' => 'pakaian-olahraga', 'sku' => 'AD-TJ-012', 'brand' => 'Adidas', 'size' => 'XL', 'cost' => 350000, 'price' => 749000, 'stock' => 18, 'min' => 8],
            ['name' => 'Puma Running Shorts', 'category' => 'pakaian-olahraga', 'sku' => 'PU-RS-013', 'brand' => 'Puma', 'size' => 'M', 'cost' => 120000, 'price' => 299000, 'stock' => 4, 'min' => 10],
            ['name' => 'Lululemon Align Tank Top', 'category' => 'pakaian-olahraga', 'sku' => 'LL-AT-014', 'brand' => 'Lululemon', 'size' => 'S', 'cost' => 250000, 'price' => 599000, 'stock' => 22, 'min' => 8],

            // Aksesoris
            ['name' => 'Apple Watch Ultra 2', 'category' => 'aksesoris', 'sku' => 'AP-WU2-020', 'brand' => 'Apple', 'size' => '49mm', 'cost' => 7000000, 'price' => 10999000, 'stock' => 6, 'min' => 3],
            ['name' => 'Garmin Forerunner 965', 'category' => 'aksesoris', 'sku' => 'GR-FR965-021', 'brand' => 'Garmin', 'size' => '47mm', 'cost' => 5000000, 'price' => 8499000, 'stock' => 9, 'min' => 3],
            ['name' => 'Nike Running Cap', 'category' => 'aksesoris', 'sku' => 'NK-RC-022', 'brand' => 'Nike', 'size' => 'One Size', 'cost' => 80000, 'price' => 199000, 'stock' => 50, 'min' => 15],
            ['name' => 'Hydro Flask Water Bottle 32oz', 'category' => 'aksesoris', 'sku' => 'HF-WB32-023', 'brand' => 'Hydro Flask', 'size' => '32oz', 'cost' => 180000, 'price' => 449000, 'stock' => 35, 'min' => 10],
            ['name' => 'Buff Multifunctional Headwear', 'category' => 'aksesoris', 'sku' => 'BF-MH-024', 'brand' => 'Buff', 'size' => 'One Size', 'cost' => 90000, 'price' => 229000, 'stock' => 2, 'min' => 10],

            // Perlengkapan
            ['name' => 'Wilson Pro Staff Tennis Racket', 'category' => 'perlengkapan', 'sku' => 'WL-PS-030', 'brand' => 'Wilson', 'size' => '98 sq in', 'cost' => 1500000, 'price' => 2999000, 'stock' => 7, 'min' => 3],
            ['name' => 'Spalding NBA Official Basketball', 'category' => 'perlengkapan', 'sku' => 'SP-NBA-031', 'brand' => 'Spalding', 'size' => 'Size 7', 'cost' => 300000, 'price' => 699000, 'stock' => 20, 'min' => 5],
            ['name' => 'Yonex Astrox 88 Badminton Racket', 'category' => 'perlengkapan', 'sku' => 'YX-AX88-032', 'brand' => 'Yonex', 'size' => '4U G5', 'cost' => 900000, 'price' => 1899000, 'stock' => 11, 'min' => 5],
            ['name' => 'Mikasa Volleyball MVA200', 'category' => 'perlengkapan', 'sku' => 'MK-MVA200-033', 'brand' => 'Mikasa', 'size' => 'Size 5', 'cost' => 350000, 'price' => 799000, 'stock' => 14, 'min' => 5],

            // Nutrisi & Suplemen
            ['name' => 'Whey Protein Gold Standard 2lb', 'category' => 'nutrisi', 'sku' => 'ON-WP-040', 'brand' => 'Optimum Nutrition', 'size' => '2lb', 'cost' => 350000, 'price' => 699000, 'stock' => 28, 'min' => 10],
            ['name' => 'Gu Energy Gel Variety Pack', 'category' => 'nutrisi', 'sku' => 'GU-EG-041', 'brand' => 'Gu', 'size' => '24 pack', 'cost' => 180000, 'price' => 399000, 'stock' => 40, 'min' => 15],
            ['name' => 'Pocari Sweat 500ml (Carton)', 'category' => 'nutrisi', 'sku' => 'PC-500-042', 'brand' => 'Pocari Sweat', 'size' => '24x500ml', 'cost' => 120000, 'price' => 289000, 'stock' => 55, 'min' => 20],
            ['name' => 'L-Men Advance Whey 1kg', 'category' => 'nutrisi', 'sku' => 'LM-WP-043', 'brand' => 'L-Men', 'size' => '1kg', 'cost' => 280000, 'price' => 549000, 'stock' => 1, 'min' => 10],

            // Peralatan Fitness
            ['name' => 'Adjustable Dumbbell Set 20kg', 'category' => 'fitness', 'sku' => 'DB-20KG-050', 'brand' => 'Rogue', 'size' => '20kg', 'cost' => 800000, 'price' => 1599000, 'stock' => 10, 'min' => 3],
            ['name' => 'Yoga Mat Premium 6mm', 'category' => 'fitness', 'sku' => 'YM-6MM-051', 'brand' => 'Manduka', 'size' => '6mm', 'cost' => 200000, 'price' => 549000, 'stock' => 25, 'min' => 10],
            ['name' => 'Resistance Band Set Pro', 'category' => 'fitness', 'sku' => 'RB-PRO-052', 'brand' => 'TheraBand', 'size' => '5 pcs', 'cost' => 120000, 'price' => 349000, 'stock' => 38, 'min' => 15],
            ['name' => 'Kettlebell 16kg Cast Iron', 'category' => 'fitness', 'sku' => 'KB-16KG-053', 'brand' => 'Rogue', 'size' => '16kg', 'cost' => 350000, 'price' => 749000, 'stock' => 8, 'min' => 3],
            ['name' => 'Foam Roller Recovery Pro', 'category' => 'fitness', 'sku' => 'FR-PRO-054', 'brand' => 'TriggerPoint', 'size' => '33cm', 'cost' => 150000, 'price' => 399000, 'stock' => 0, 'min' => 10],
        ];

        $result = [];

        foreach ($products as $p) {
            $product = Product::updateOrCreate(
                ['sku' => $p['sku']],
                [
                    'category_id' => $categories[$p['category']]->id,
                    'name' => $p['name'],
                    'brand' => $p['brand'],
                    'size' => $p['size'],
                    'cost_price' => $p['cost'],
                    'selling_price' => $p['price'],
                    'description' => "Produk berkualitas premium {$p['name']} untuk atlet dan pecinta olahraga. Produk asli dengan garansi.",
                    'status' => 'active',
                ]
            );
            $result[] = ['product' => $product, 'stock' => $p['stock'], 'min' => $p['min']];
        }

        return $result;
    }

    private function seedStock(array $products): void
    {
        foreach ($products as $item) {
            Stock::updateOrCreate(
                ['product_id' => $item['product']->id],
                [
                    'quantity' => $item['stock'],
                    'minimum_quantity' => $item['min'],
                ]
            );
        }
    }

    private function seedCustomers(): void
    {
        $customers = [
            ['code' => 'PCM-001', 'name' => 'Andi Pratama', 'email' => 'andi.pratama@email.com', 'phone' => '081234567801', 'gender' => 'male', 'dob' => '1995-03-15', 'province' => 'DKI Jakarta', 'city' => 'Jakarta', 'address' => 'Jl. Sudirman No. 45, Jakarta Pusat'],
            ['code' => 'PCM-002', 'name' => 'Siti Rahma Wati', 'email' => 'siti.rahma@email.com', 'phone' => '081234567802', 'gender' => 'female', 'dob' => '1998-07-22', 'province' => 'Jawa Barat', 'city' => 'Bandung', 'address' => 'Jl. Dago No. 12, Bandung'],
            ['code' => 'PCM-003', 'name' => 'Budi Santoso', 'email' => 'budi.santoso@email.com', 'phone' => '081234567803', 'gender' => 'male', 'dob' => '1990-11-08', 'province' => 'Jawa Timur', 'city' => 'Surabaya', 'address' => 'Jl. Tunjungan No. 88, Surabaya'],
            ['code' => 'PCM-004', 'name' => 'Dewi Lestari', 'email' => 'dewi.lestari@email.com', 'phone' => '081234567804', 'gender' => 'female', 'dob' => '1993-09-30', 'province' => 'DKI Jakarta', 'city' => 'Jakarta', 'address' => 'Jl. Kemang Raya No. 7, Jakarta Selatan'],
            ['code' => 'PCM-005', 'name' => 'Rizki Hidayat', 'email' => 'rizki.hidayat@email.com', 'phone' => '081234567805', 'gender' => 'male', 'dob' => '1996-01-12', 'province' => 'Sumatera Utara', 'city' => 'Medan', 'address' => 'Jl. Gatot Subroto No. 23, Medan'],
            ['code' => 'PCM-006', 'name' => 'Putri Anggraini', 'email' => 'putri.anggraini@email.com', 'phone' => '081234567806', 'gender' => 'female', 'dob' => '1999-05-18', 'province' => 'Bali', 'city' => 'Denpasar', 'address' => 'Jl. Sunset Road No. 15, Denpasar'],
            ['code' => 'PCM-007', 'name' => 'Fajar Nugroho', 'email' => 'fajar.nugroho@email.com', 'phone' => '081234567807', 'gender' => 'male', 'dob' => '1992-12-03', 'province' => 'DI Yogyakarta', 'city' => 'Yogyakarta', 'address' => 'Jl. Malioboro No. 56, Yogyakarta'],
            ['code' => 'PCM-008', 'name' => 'Sarah Wijayanti', 'email' => 'sarah.wijayanti@email.com', 'phone' => '081234567808', 'gender' => 'female', 'dob' => '1997-08-25', 'province' => 'Jawa Barat', 'city' => 'Bekasi', 'address' => 'Jl. Ahmad Yani No. 34, Bekasi'],
            ['code' => 'PCM-009', 'name' => 'Dimas Prakoso', 'email' => 'dimas.prakoso@email.com', 'phone' => '081234567809', 'gender' => 'male', 'dob' => '1994-04-17', 'province' => 'Jawa Tengah', 'city' => 'Semarang', 'address' => 'Jl. Pemuda No. 67, Semarang'],
            ['code' => 'PCM-010', 'name' => 'Indira Permata', 'email' => 'indira.permata@email.com', 'phone' => '081234567810', 'gender' => 'female', 'dob' => '2000-02-14', 'province' => 'DKI Jakarta', 'city' => 'Jakarta', 'address' => 'Jl. Thamrin No. 11, Jakarta Pusat'],
        ];

        foreach ($customers as $c) {
            Customer::updateOrCreate(
                ['member_code' => $c['code']],
                [
                    'full_name' => $c['name'],
                    'email' => $c['email'],
                    'phone' => $c['phone'],
                    'gender' => $c['gender'],
                    'date_of_birth' => $c['dob'],
                    'province' => $c['province'],
                    'city' => $c['city'],
                    'address' => $c['address'],
                    'status' => 'active',
                    'total_purchases' => rand(3, 25),
                    'total_spent' => rand(500000, 15000000),
                    'join_date' => now()->subDays(rand(30, 365)),
                ]
            );
        }
    }

    private function seedTransactions(array $products): void
    {
        $cashier = User::where('username', 'kasir')->first();
        $paymentCash = AppMaster::where('type', 'payment_method')->where('code', 'cash')->first();
        $paymentQris = AppMaster::where('type', 'payment_method')->where('code', 'qris')->first();
        $customers = Customer::all();

        $transactions = [
            ['days_ago' => 6, 'items' => [0, 9], 'customer_idx' => 0, 'payment' => $paymentCash, 'paid' => 2000000],
            ['days_ago' => 5, 'items' => [2, 19], 'customer_idx' => 1, 'payment' => $paymentQris, 'paid' => 0],
            ['days_ago' => 5, 'items' => [5, 12], 'customer_idx' => null, 'payment' => $paymentCash, 'paid' => 1000000],
            ['days_ago' => 4, 'items' => [0, 18], 'customer_idx' => 2, 'payment' => $paymentCash, 'paid' => 5000000],
            ['days_ago' => 3, 'items' => [1, 20], 'customer_idx' => 3, 'payment' => $paymentQris, 'paid' => 0],
            ['days_ago' => 3, 'items' => [6, 13], 'customer_idx' => null, 'payment' => $paymentCash, 'paid' => 1000000],
            ['days_ago' => 2, 'items' => [3, 22], 'customer_idx' => 4, 'payment' => $paymentCash, 'paid' => 3000000],
            ['days_ago' => 2, 'items' => [10, 14], 'customer_idx' => 5, 'payment' => $paymentQris, 'paid' => 0],
            ['days_ago' => 1, 'items' => [0, 5, 12], 'customer_idx' => 6, 'payment' => $paymentCash, 'paid' => 3000000],
            ['days_ago' => 1, 'items' => [16, 19], 'customer_idx' => null, 'payment' => $paymentQris, 'paid' => 0],
            ['days_ago' => 0, 'items' => [4, 21], 'customer_idx' => 7, 'payment' => $paymentCash, 'paid' => 1500000],
            ['days_ago' => 0, 'items' => [1, 9, 23], 'customer_idx' => 8, 'payment' => $paymentCash, 'paid' => 4000000],
            ['days_ago' => 0, 'items' => [7, 14], 'customer_idx' => null, 'payment' => $paymentQris, 'paid' => 0],
        ];

        foreach ($transactions as $idx => $tx) {
            $date = now()->subDays($tx['days_ago'])->setTime(rand(9, 20), rand(0, 59));
            $txNumber = 'TRX-' . $date->format('ymd') . '-' . str_pad($idx + 1, 3, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $itemsData = [];

            foreach ($tx['items'] as $itemIdx) {
                $productData = $products[$itemIdx];
                $product = $productData['product'];
                $qty = rand(1, 3);
                $lineTotal = (float) $product->selling_price * $qty;
                $subtotal += $lineTotal;
                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_price' => (float) $product->selling_price,
                    'subtotal' => $lineTotal,
                ];
            }

            $discountAmount = 0;
            $grandOpeningDiscount = Discount::where('name', 'Grand Opening Diskon 20%')->first();
            if ($grandOpeningDiscount) {
                $discountAmount = round($subtotal * 0.2);
            }

            $afterDiscount = $subtotal - $discountAmount;
            $taxAmount = round($afterDiscount * 0.11);
            $totalAmount = $afterDiscount + $taxAmount;
            $amountPaid = $tx['paid'] > 0 ? $tx['paid'] : $totalAmount;
            $changeAmount = max(0, $amountPaid - $totalAmount);

            $transaction = Transaction::updateOrCreate(
                ['transaction_number' => $txNumber],
                [
                    'cashier_id' => $cashier->id,
                    'customer_id' => $tx['customer_idx'] !== null ? $customers[$tx['customer_idx']]->id : null,
                    'payment_method_id' => $tx['payment']?->id,
                    'transaction_date' => $date,
                    'status' => 'completed',
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'amount_paid' => $amountPaid,
                    'change_amount' => $changeAmount,
                ]
            );

            foreach ($itemsData as $item) {
                TransactionItem::updateOrCreate(
                    [
                        'transaction_id' => $transaction->id,
                        'product_id' => $item['product']->id,
                    ],
                    [
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'item_discount' => 0,
                        'subtotal' => $item['subtotal'],
                    ]
                );
            }
        }
    }
}
