<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return inertia('Home');
});
Route::get('/about', function () {
    return inertia('About');
});
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::name('auth.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});


Route::middleware('auth')->prefix('user')->name('user.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/update', [DashboardController::class, 'update'])->name('update');
    Route::post('/delete', [DashboardController::class, 'delete'])->name('delete');
});

