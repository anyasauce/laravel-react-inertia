<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Auth\{
    AuthController,
    ForgotPasswordController,
};

use App\Http\Controllers\Global\{
    ProfileController,
    PosController,
    CalendarController,
};

use App\Http\Controllers\Admin\{
    AdminDashboardController,
    InventoryController,
    ProductsController,
    EmployeeController,
    ReportController,
    SettingController,
    CategoryController
};

use App\Http\Controllers\User\{
    UserDashboardController,
    StockerController
};


// Auth Routes (Login and Logout)
Route::middleware('guest')->group(function () {
    // Login
    Route::get('/', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    // Google Login 
    Route::get('/login/google', [AuthController::class, 'redirectToGoogle'])->name('login.google');
    Route::get('/auth/login/google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendOtp'])->name('password.email');

    Route::get('/verify-otp', [ForgotPasswordController::class, 'showVerifyForm'])->name('verify.page');
    Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp'])->name('password.verify');

    Route::get('/reset-password', [ForgotPasswordController::class, 'showResetForm'])->name('reset.page');
    Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword'])->name('password.update');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('/pos',[PosController::class,'index'])->name('admin.pos');
    Route::post('/pos/checkout',[PosController::class,'checkout']);
});

Route::prefix('admin')->middleware(['admin'])->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dashboard/metrics', [AdminDashboardController::class, 'jsonMetrics'])->name('admin.dashboard.metrics');
    Route::get('/analytics', [AdminDashboardController::class, 'graphsIndex'])->name('admin.graphs');
    Route::get('/analytics/data', [AdminDashboardController::class, 'jsonGraphMetrics']);

    Route::get('/inventory', [InventoryController::class, 'index'])->name('admin.inventory');
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::put('/inventory/{id}', [InventoryController::class, 'update']);
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);
    Route::get('/inventory-data', [InventoryController::class, 'json']);

    Route::get('/products', [ProductsController::class, 'index'])->name('admin.products');
    Route::post('/products', [ProductsController::class, 'store']);
    Route::put('/products/{id}', [ProductsController::class, 'update']);
    Route::delete('/products/{id}', [ProductsController::class, 'destroy']);
    Route::post('/products/find', [ProductsController::class, 'findByBarcode']);

    Route::get('/category', [CategoryController::class, 'index'])->name('admin.category');
    Route::post('/category', [CategoryController::class, 'store']);
    Route::put('/category/{id}', [CategoryController::class, 'update']);
    Route::delete('/category/{id}', [CategoryController::class, 'destroy']);

    Route::get('/employee', [EmployeeController::class, 'index'])->name('admin.employee');
    Route::post('/employee', [EmployeeController::class, 'store']);
    Route::put('/employee/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employee/{id}', [EmployeeController::class, 'destroy']);

    Route::get('/reports', [ReportController::class, 'index'])->name('admin.reports.index');
    Route::get('/reports/metrics', [ReportController::class, 'jsonReports'])->name('admin.reports.json');
    Route::get('/reports/export/{reportType}', [ReportController::class, 'exportReport'])->name('admin.reports.export');

    Route::get('/settings', [SettingController::class, 'index'])->name('admin.settings.index');
    Route::post('/settings', [SettingController::class, 'store'])->name('admin.settings.store');
});

Route::prefix('user')->middleware(['user'])->group(function () {
    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('user.dashboard');
    Route::get('/dashboard/metrics', [UserDashboardController::class, 'jsonMetrics'])->name('user.dashboard.metrics');
    Route::get('/daily-report', [UserDashboardController::class, 'dailyReport'])->name('user.daily.report');

    Route::get('/stocker', [StockerController::class, 'index'])->name('user.stocker.index');
    Route::get('/stocker/data', [StockerController::class, 'json'])->name('user.stocker.json');
    Route::post('/stocker/{id}/stock-in', [StockerController::class, 'stockIn'])->name('user.stocker.stockIn');
});