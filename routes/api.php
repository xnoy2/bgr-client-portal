<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GHLWebhookController;
use App\Http\Controllers\Api\ProgressUpdateController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\StageController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes  —  prefix: /api
|--------------------------------------------------------------------------
|
| Authentication: Sanctum token via  Authorization: Bearer <token>
|
| Roles:
|   admin  — full access
|   worker — assigned projects; own updates only
|   client — own project; published updates only; read-only
|
*/

// ── GHL Inbound Webhooks (unauthenticated) ────────────────────────────────────
Route::post('/webhooks/ghl', [GHLWebhookController::class, 'handle'])
    ->middleware('throttle:60,1');

// Dedicated endpoint for GHL Workflow → Webhook action (variation form)
Route::post('/webhooks/ghl-variation', [GHLWebhookController::class, 'handleVariationForm'])
    ->middleware('throttle:60,1');

// Proposal status updates from GHL Workflow
Route::post('/webhooks/ghl-proposal', [GHLWebhookController::class, 'handleProposalStatus'])
    ->middleware('throttle:60,1');

// Variation agreement signing status from GHL Workflow
Route::post('/webhooks/ghl-agreement', [GHLWebhookController::class, 'handleAgreementStatus'])
    ->middleware('throttle:60,1');

// ── Auth ──────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me'])->name('api.me');
    });
});

// ── Protected routes (Sanctum token required) ─────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Users ─────────────────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::get('/users',           [UserController::class, 'index']);
        Route::post('/users',          [UserController::class, 'store']);
        Route::put('/users/{user}',    [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
    Route::get('/users/{user}', [UserController::class, 'show']);

    // ── Projects ──────────────────────────────────────────────────────────────
    Route::get('/projects',          [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/projects',             [ProjectController::class, 'store']);
        Route::put('/projects/{project}',    [ProjectController::class, 'update']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
    });

    // ── Stages (nested under project) ─────────────────────────────────────────
    Route::get('/projects/{project}/stages',          [StageController::class, 'index']);
    Route::put('/projects/{project}/stages/{stage}',  [StageController::class, 'update']);

    // ── Progress Updates (nested under project) ───────────────────────────────
    Route::get('/projects/{project}/updates',             [ProgressUpdateController::class, 'index']);
    Route::post('/projects/{project}/updates',            [ProgressUpdateController::class, 'store']);
    Route::get('/projects/{project}/updates/{update}',    [ProgressUpdateController::class, 'show']);
    Route::put('/projects/{project}/updates/{update}',    [ProgressUpdateController::class, 'update']);
    Route::delete('/projects/{project}/updates/{update}', [ProgressUpdateController::class, 'destroy']);
});
