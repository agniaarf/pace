<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DiscountController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductVariantController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\StockMovementController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Kasir\CashierController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

Route::post('/logout', [LoginController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// Admin routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'adminDashboard'])->name('admin.dashboard');

    // Products
    Route::get('/products', [ProductController::class, 'index'])->name('admin.products.index');
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    // Product Variants
    Route::post('/products/{product}/variants', [ProductVariantController::class, 'store']);
    Route::put('/variants/{variant}', [ProductVariantController::class, 'update']);
    Route::delete('/variants/{variant}', [ProductVariantController::class, 'destroy']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index'])->name('admin.categories.index');
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index'])->name('admin.customers.index');
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

    // Discounts
    Route::get('/discounts', [DiscountController::class, 'index'])->name('admin.discounts.index');
    Route::post('/discounts', [DiscountController::class, 'store']);
    Route::get('/discounts/{discount}/products', [DiscountController::class, 'products'])->name('admin.discounts.products');
    Route::post('/discounts/{discount}/products', [DiscountController::class, 'syncProducts']);
    Route::put('/discounts/{discount}', [DiscountController::class, 'update']);
    Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy']);

    // Stock
    Route::get('/stock', [StockController::class, 'index'])->name('admin.stock.index');
    Route::get('/stock/alerts', [StockController::class, 'alerts'])->name('admin.stock.alerts');
    Route::post('/stock/{stock}/adjust', [StockController::class, 'adjust']);

    // Stock Movements
    Route::get('/stock-movements', [StockMovementController::class, 'index'])->name('admin.stock-movements.index');

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index'])->name('admin.transactions.index');
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('admin.transactions.show');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('admin.reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('admin.reports.export');
});

// Kasir routes
Route::middleware(['auth', 'role:kasir'])->prefix('kasir')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'kasirDashboard'])->name('kasir.dashboard');
    Route::get('/cashier', [CashierController::class, 'index'])->name('kasir.cashier');
    Route::get('/transactions', [CashierController::class, 'history'])->name('kasir.transactions');
    Route::get('/customers', [CashierController::class, 'customers'])->name('kasir.customers');
    Route::post('/cashier', [CashierController::class, 'store'])->name('kasir.cashier.store');
});
