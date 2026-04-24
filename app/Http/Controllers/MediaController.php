<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\MediaFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Stream a progress-update photo — only accessible to the project's client, workers, or admin.
     */
    public function photo(MediaFile $mediaFile)
    {
        $user    = auth()->user();
        $project = $mediaFile->project;

        $allowed =
            $user->hasRole('admin') ||
            ($project && $project->client_id === $user->id) ||
            ($project && $project->workers()->where('users.id', $user->id)->exists());

        abort_unless($allowed, 403);

        return $this->streamFromStorage(
            $mediaFile->storage_path,
            $mediaFile->mime_type ?? 'image/jpeg',
            $mediaFile->original_filename ?? 'photo',
            false
        );
    }

    /**
     * Download a project document — only accessible to the project's client or admin.
     */
    public function document(Document $document)
    {
        $user    = auth()->user();
        $project = $document->project;

        $allowed =
            $user->hasRole('admin') ||
            ($project && $project->client_id === $user->id);

        abort_unless($allowed, 403);

        // New R2-stored documents
        if ($document->storage_path) {
            return $this->streamFromStorage(
                $document->storage_path,
                $document->mime_type ?? 'application/octet-stream',
                $document->filename  ?? 'document',
                true
            );
        }

        // No file available — neither R2 path nor legacy URL
        abort_if(empty($document->url), 404, 'File not available. Please ask an admin to re-upload this document.');

        // Legacy Cloudinary documents — proxy through HTTP
        $response = Http::timeout(30)->get($document->url);
        abort_unless($response->successful(), 502, 'Could not retrieve the file.');

        return response($response->body(), 200, [
            'Content-Type'        => $document->mime_type ?? $response->header('Content-Type') ?? 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', $document->filename ?? 'document') . '"',
            'Content-Length'      => strlen($response->body()),
            'Cache-Control'       => 'no-store',
        ]);
    }

    private function streamFromStorage(string $path, string $mime, string $filename, bool $download): \Symfony\Component\HttpFoundation\Response
    {
        $disposition = $download
            ? 'attachment; filename="' . str_replace('"', '', $filename) . '"'
            : 'inline';

        try {
            $stream = Storage::disk('r2')->readStream($path);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('R2 file stream failed', ['path' => $path, 'error' => $e->getMessage()]);
            abort(404, 'File not found in storage.');
        }

        if (! $stream) {
            abort(404, 'File not found in storage.');
        }

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) fclose($stream);
        }, 200, [
            'Content-Type'        => $mime,
            'Content-Disposition' => $disposition,
            'Cache-Control'       => 'private, max-age=3600',
            'X-Accel-Buffering'   => 'no',
        ]);
    }
}
