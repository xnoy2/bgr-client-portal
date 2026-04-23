<?php

namespace App\Console\Commands;

use App\Models\MediaFile;
use App\Models\ProgressUpdate;
use Illuminate\Console\Command;

class CleanCloudinaryMedia extends Command
{
    protected $signature   = 'media:clean-cloudinary';
    protected $description = 'Remove old Cloudinary photo references from progress updates and delete legacy MediaFile records';

    public function handle(): int
    {
        // 1. Clear Cloudinary photo URLs from progress updates — keep only R2 proxy URLs
        $updates       = ProgressUpdate::whereNotNull('photos')->get();
        $clearedCount  = 0;

        foreach ($updates as $update) {
            $photos = $update->photos ?? [];

            // R2 photos are served via /media/photo/{id} — Cloudinary URLs contain res.cloudinary.com
            $kept = array_values(array_filter($photos, fn ($url) =>
                str_contains($url, '/media/photo/')
            ));

            if (count($kept) !== count($photos)) {
                $update->update(['photos' => $kept ?: null]);
                $clearedCount++;
            }
        }

        $this->info("Cleared Cloudinary photos from {$clearedCount} progress update(s).");

        // 2. Delete legacy MediaFile records that have no R2 storage_path
        $deleted = MediaFile::whereNull('storage_path')->forceDelete();
        $this->info("Deleted {$deleted} legacy Cloudinary MediaFile record(s).");

        $this->info('Cleanup complete.');

        return self::SUCCESS;
    }
}
