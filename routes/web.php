<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing — redirect based on role after login
Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        if ($user->hasRole('admin'))  return redirect()->route('admin.dashboard');
        if ($user->hasRole('worker')) return redirect()->route('worker.dashboard');
        if ($user->hasRole('client')) return redirect()->route('client.dashboard');
    }
    return redirect()->route('login');
});

// Breeze auth routes (login, logout, register) are loaded by Breeze automatically.
// Run: php artisan breeze:install react

// ─── Admin routes ────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Admin/Dashboard'))
            ->name('dashboard');
        // More admin routes added in Phase 3+
    });

// ─── Worker routes ───────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:worker|admin'])
    ->prefix('worker')
    ->name('worker.')
    ->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Worker/Dashboard'))
            ->name('dashboard');
        // More worker routes added in Phase 5+
    });

// ─── Client portal routes ────────────────────────────────────────────────────
Route::middleware(['auth', 'role:client'])
    ->prefix('portal')
    ->name('client.')
    ->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Client/Dashboard'))
            ->name('dashboard');
        // More client routes added in Phase 11
    });