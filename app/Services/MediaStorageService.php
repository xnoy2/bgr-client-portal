<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaStorageService
{
    private const R2_DISK    = 'r2';
    private const LOCAL_DISK = 'local';

    /**
     * Upload a file. Uses R2 in production, local disk in dev when R2 is not configured.
     */
    public function upload(UploadedFile $file, string $folder): ?string
    {
        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        $path      = "{$folder}/" . Str::uuid() . ($extension ? ".{$extension}" : '');

        Storage::disk($this->activeDisk())->put($path, file_get_contents($file->getRealPath()));

        return $path;
    }

    /**
     * Delete a file from whichever disk stored it.
     */
    public function delete(string $path, string $disk = self::R2_DISK): void
    {
        try {
            Storage::disk($disk)->delete($path);
        } catch (\Throwable) {
            // Non-fatal
        }
    }

    /**
     * Returns the disk name that will be used for the next upload.
     * 'r2' in production, 'local' in dev when R2 credentials are absent.
     */
    public function activeDisk(): string
    {
        return $this->configured() ? self::R2_DISK : self::LOCAL_DISK;
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
}
