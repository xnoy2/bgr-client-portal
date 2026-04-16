<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GHLWebhookController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes  —  prefix: /api
|--------------------------------------------------------------------------
*/

// ── GHL Inbound Webhook (unauthenticated) ─────────────────────────────────
Route::post('/webhooks/ghl', [GHLWebhookController::class, 'handle'])
    ->middleware('throttle:60,1');

// ── Auth ──────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',  [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me'])->name('api.me');
    });
});

// ── Protected routes (Sanctum token required) ─────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Users — admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/users',          [UserController::class, 'index']);
        Route::post('/users',         [UserController::class, 'store']);
        Route::put('/users/{user}',   [UserController::class, 'update']);
        Route::delete('/users/{user}',[UserController::class, 'destroy']);
    });

    // Single user — any authenticated user (can view own profile via /api/auth/me)
    Route::get('/users/{user}', [UserController::class, 'show']);

    // Projects — role-filtered inside controller
    Route::get('/projects',             [ProjectController::class, 'index']);
    Route::get('/projects/{project}',   [ProjectController::class, 'show']);

    // Projects — admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('/projects',            [ProjectController::class, 'store']);
        Route::put('/projects/{project}',   [ProjectController::class, 'update']);
        Route::delete('/projects/{project}',[ProjectController::class, 'destroy']);
    });
});
