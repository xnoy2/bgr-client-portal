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
    'api_key'        => env('pit-dc4576e0-1d8d-4645-ac9f-a188b4d73244'),
    'location_id'    => env('xUZ6e10rdKZbaHFi8Sr6'),
    'webhook_secret' => env('jSu(WitU#vhX{s:Rgxb@lPoKM1C|(3hB'),
    'pipeline_id'    => env('py2K3XQJdPu2ZUH3uHvy'),
    'base_url'       => 'https://services.leadconnectorhq.com',
    'stages' => [
        'design_approved' => env('68069241-332c-40c2-ac00-506056390255', ''),
        'groundworks'     => env('0ec0cb0e-3203-4a77-af34-4701b6a20593', ''),
        'structure_build' => env('cc806b0a-f9a2-41b0-88aa-8274a2e2b705', ''),
        'fit_out'         => env('43939eb4-90f7-416c-976a-637f67258da1', ''),
        'completed'       => env('d8fe19be-a045-484b-b86d-b7c7502f359d', ''),
    ],
],

];
