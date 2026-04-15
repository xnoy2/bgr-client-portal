<?php

use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\ProfileController;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── First-login password change ─────────────────────────────────────────────
Route::middleware('auth')
    ->group(function () {
        Route::get('/change-password', [ChangePasswordController::class, 'show'])
            ->name('password.change');
        Route::post('/change-password', [ChangePasswordController::class, 'update'])
            ->name('password.change.update');
    });

// Landing + post-login redirect — both / and /dashboard route here
Route::middleware('auth')->get('/dashboard', function () {
    $user = auth()->user();
    if ($user->hasRole('admin'))  return redirect()->route('admin.dashboard');
    if ($user->hasRole('worker')) return redirect()->route('worker.dashboard');
    if ($user->hasRole('client')) return redirect()->route('client.dashboard');
    return redirect()->route('login');
})->name('dashboard');

Route::get('/', function () {
    if (auth()->check()) return redirect()->route('dashboard');
    return redirect()->route('login');
});

// ─── Profile routes ──────────────────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

// ─── Admin routes ────────────────────────────────────────────────────────────
Route::middleware(['auth', 'password.changed', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Admin/Dashboard', [
                'stats' => [
                    'total_users'    => \App\Models\User::count(),
                    'total_workers'  => \App\Models\User::role('worker')->count(),
                    'total_clients'  => \App\Models\User::role('client')->count(),
                    'total_projects' => \App\Models\Project::count(),
                ],
            ]);
        })->name('dashboard');

        // User management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->name('users.reset-password');

        // Project management
        Route::get('/projects',                            [ProjectController::class, 'index'])->name('projects.index');
        Route::post('/projects',                           [ProjectController::class, 'store'])->name('projects.store');
        Route::post('/projects/refresh-pipeline',          [ProjectController::class, 'refreshPipeline'])->name('projects.refresh-pipeline');
        Route::get('/projects/{project}',                  [ProjectController::class, 'show'])->name('projects.show');
        Route::put('/projects/{project}',                  [ProjectController::class, 'update'])->name('projects.update');
        Route::put('/projects/{project}/stage',            [ProjectController::class, 'updateStage'])->name('projects.stage.update');
        Route::post('/projects/{project}/refresh-ghl',     [ProjectController::class, 'refreshGHL'])->name('projects.refresh-ghl');
    });

// ─── Worker routes ───────────────────────────────────────────────────────────
Route::middleware(['auth', 'password.changed', 'role:worker|admin'])
    ->prefix('worker')
    ->name('worker.')
    ->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Worker/Dashboard'))
            ->name('dashboard');
        // More worker routes added in Phase 5+
    });

// ─── Client portal routes ────────────────────────────────────────────────────
Route::middleware(['auth', 'password.changed', 'role:client'])
    ->prefix('portal')
    ->name('client.')
    ->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Client/Dashboard'))
            ->name('dashboard');
        // More client routes added in Phase 11
    });