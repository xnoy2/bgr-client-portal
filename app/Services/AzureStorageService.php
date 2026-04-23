<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AzureStorageService
{
    /**
     * Upload a file to Azure Blob Storage and return the blob path.
     * Returns null if Azure is not configured (falls back gracefully in dev).
     */
    public function upload(UploadedFile $file, string $folder): ?string
    {
        if (! $this->configured()) {
            return null;
        }

        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        $path      = "{$folder}/" . Str::uuid() . ($extension ? ".{$extension}" : '');

        Storage::disk('azure')->put($path, file_get_contents($file->getRealPath()));

        return $path;
    }

    /**
     * Delete a file from Azure Blob Storage.
     */
    public function delete(string $path): void
    {
        if (! $this->configured()) return;

        try {
            Storage::disk('azure')->delete($path);
        } catch (\Throwable) {
            // Non-fatal — log but don't crash
        }
    }

    /**
     * Returns true when Azure credentials are present.
     */
    public function configured(): bool
    {
        return ! empty(config('filesystems.disks.azure.account'))
            && ! empty(config('filesystems.disks.azure.key'));
    }
}
