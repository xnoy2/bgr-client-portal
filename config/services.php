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

    'ghl' => [
        'enabled'        => env('GHL_ENABLED', true),
        'api_key'        => env('GHL_API_KEY',        'pit-dc4576e0-1d8d-4645-ac9f-a188b4d73244'),
        'location_id'    => env('GHL_LOCATION_ID',    'xUZ6e10rdKZbaHFi8Sr6'),
        'webhook_secret' => env('GHL_WEBHOOK_SECRET', 'jSu(WitU#vhX{s:Rgxb@lPoKM1C|(3hB'),
        'pipeline_id'           => env('GHL_PIPELINE_ID',            'py2K3XQJdPu2ZUH3uHvy'),
        'proposal_template_id'  => env('GHL_PROPOSAL_TEMPLATE_ID',  '6985b3ee69026a438f3efa83'),
        'base_url'              => 'https://services.leadconnectorhq.com',
        'ssl_verify'     => env('GHL_SSL_VERIFY', true),
        'stages' => [
            'design_approved' => '68069241-332c-40c2-ac00-506056390255',
            'groundworks'     => '0ec0cb0e-3203-4a77-af34-4701b6a20593',
            'structure_build' => 'cc806b0a-f9a2-41b0-88aa-8274a2e2b705',
            'fit_out'         => '43939eb4-90f7-416c-976a-637f67258da1',
            'completed'       => 'd8fe19be-a045-484b-b86d-b7c7502f359d',
        ],
        'stage_names' => [
            '68069241-332c-40c2-ac00-506056390255' => 'Design Approved',
            '0ec0cb0e-3203-4a77-af34-4701b6a20593' => 'Groundworks',
            'cc806b0a-f9a2-41b0-88aa-8274a2e2b705' => 'Structure Build',
            '43939eb4-90f7-416c-976a-637f67258da1' => 'Interior & Fit-Out',
            'd8fe19be-a045-484b-b86d-b7c7502f359d' => 'Completed',
        ],
        // Maps each GHL stage ID to its position (1-5) in the pipeline
        'stage_order' => [
            '68069241-332c-40c2-ac00-506056390255' => 1, // Design Approved
            '0ec0cb0e-3203-4a77-af34-4701b6a20593' => 2, // Groundworks
            'cc806b0a-f9a2-41b0-88aa-8274a2e2b705' => 3, // Structure Build
            '43939eb4-90f7-416c-976a-637f67258da1' => 4, // Interior & Fit-Out
            'd8fe19be-a045-484b-b86d-b7c7502f359d' => 5, // Completed
        ],
        // Custom field key used to store photo URLs on an opportunity
        'photos_field_key'  => env('GHL_PHOTOS_FIELD_KEY', 'photos'),

        // Reverse map: position (1-5) → GHL stage ID
        'stage_id_by_order' => [
            1 => '68069241-332c-40c2-ac00-506056390255',
            2 => '0ec0cb0e-3203-4a77-af34-4701b6a20593',
            3 => 'cc806b0a-f9a2-41b0-88aa-8274a2e2b705',
            4 => '43939eb4-90f7-416c-976a-637f67258da1',
            5 => 'd8fe19be-a045-484b-b86d-b7c7502f359d',
        ],
    ],

];
    