<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaStorageService
{
    private const DISK = 'r2';

    /**
     * Upload a file to Cloudflare R2 and return the object path.
     * Returns null if R2 is not configured (falls back gracefully in dev).
     */
    public function upload(UploadedFile $file, string $folder): ?string
    {
        if (! $this->configured()) {
            return null;
        }

        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        $path      = "{$folder}/" . Str::uuid() . ($extension ? ".{$extension}" : '');

        Storage::disk(self::DISK)->put($path, file_get_contents($file->getRealPath()));

        return $path;
    }

    /**
     * Delete a file from Cloudflare R2.
     */
    public function delete(string $path): void
    {
        if (! $this->configured()) return;

        try {
            Storage::disk(self::DISK)->delete($path);
        } catch (\Throwable) {
            // Non-fatal
        }
    }

    /**
     * Returns true when R2 credentials are present.
     */
    public function configured(): bool
    {
        return ! empty(config('filesystems.disks.r2.key'))
            && ! empty(config('filesystems.disks.r2.secret'))
            && ! empty(config('filesystems.disks.r2.endpoint'));
    }

    public static function disk(): string
    {
        return self::DISK;
    }
}
