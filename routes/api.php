<?php

use App\Http\Controllers\Api\GHLWebhookController;
use Illuminate\Support\Facades\Route;

// GHL Inbound Webhook — no CSRF, no auth
Route::post('/webhooks/ghl', [GHLWebhookController::class, 'handle'])
    ->middleware('throttle:60,1');