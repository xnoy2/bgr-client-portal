<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Add this inside the return [ ... ] array, after the existing 'ses' block:
'ghl' => [
    'enabled'        => env('GHL_ENABLED', false),
    'api_key'        => env('GHL_API_KEY'),
    'location_id'    => env('GHL_LOCATION_ID'),
    'webhook_secret' => env('GHL_WEBHOOK_SECRET'),
    'pipeline_id'    => env('GHL_PIPELINE_ID'),
    'base_url'       => 'https://services.leadconnectorhq.com',
    'stages' => [
        'design_approved' => env('GHL_STAGE_DESIGN', ''),
        'groundworks'     => env('GHL_STAGE_GROUNDWORKS', ''),
        'structure_build' => env('GHL_STAGE_STRUCTURE', ''),
        'fit_out'         => env('GHL_STAGE_FITOUT', ''),
        'completed'       => env('GHL_STAGE_COMPLETED', ''),
    ],
],

];
