<?php

namespace App\Providers;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\AzureBlobStorage\AzureBlobStorageAdapter;
use League\Flysystem\Filesystem;
use MicrosoftAzure\Storage\Blob\BlobRestProxy;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Force HTTPS behind Railway's reverse proxy
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Register Azure Blob Storage driver
        Storage::extend('azure', function ($app, $config) {
            $connectionString = sprintf(
                'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net',
                $config['account'],
                $config['key']
            );

            $client  = BlobRestProxy::createBlobService($connectionString);
            $adapter = new AzureBlobStorageAdapter($client, $config['container'], $config['prefix'] ?? '');

            return new FilesystemAdapter(
                new Filesystem($adapter),
                $adapter,
                $config
            );
        });
    }
}
