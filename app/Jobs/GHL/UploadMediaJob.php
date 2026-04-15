<?php

namespace App\Jobs\GHL;

use App\Models\MediaFile;
use App\Services\GHLService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UploadMediaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public MediaFile $mediaFile,
        // NOTE: UploadedFile cannot be serialized — store the tmp path instead
        public string $tmpPath,
        public string $originalName,
        public string $mimeType,
        public string $contactId
    ) {}

    public function handle(GHLService $ghl): void
    {
        // Re-create an UploadedFile from the temp path
        $file = new UploadedFile(
            $this->tmpPath,
            $this->originalName,
            $this->mimeType,
            null,
            true // test mode — skip is_uploaded_file check
        );

        $result = $ghl->uploadMedia($file, $this->contactId);

        if (! empty($result['fileId'])) {
            $this->mediaFile->update([
                'ghl_file_id' => $result['fileId'],
                'url'         => $result['url'],
            ]);
        }

        // Clean up the temp file
        if (file_exists($this->tmpPath)) {
            unlink($this->tmpPath);
        }
    }
}