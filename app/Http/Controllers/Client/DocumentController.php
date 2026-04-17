<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Project;
use App\Services\PdfSigningService;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DocumentController extends Controller
{
    /**
     * GET /portal/documents
     */
    public function index()
    {
        $projectIds = Project::where('client_id', auth()->id())->pluck('id');

        $documents = Document::whereIn('project_id', $projectIds)
            ->where('visibility', 'client')
            ->with('project')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($doc) => [
                'id'           => $doc->id,
                'title'        => $doc->title,
                'filename'     => $doc->filename,
                'url'          => $doc->url,
                'mime_type'    => $doc->mime_type,
                'file_size'    => $doc->file_size,
                'category'     => $doc->category,
                'sign_status'  => $doc->sign_status,
                'sent_at'      => $doc->sent_at?->toDateString(),
                'signed_at'    => $doc->signed_at?->toDateString(),
                'signer_name'  => $doc->signer_name,
                'project_name' => $doc->project?->name,
            ]);

        return Inertia::render('Client/Documents/Index', [
            'documents' => $documents,
        ]);
    }

    /**
     * POST /portal/documents/{document}/sign
     * Stamps the signer's name + date onto the PDF, re-uploads to Cloudinary,
     * and marks the document as signed.
     */
    public function sign(Request $request, Document $document, PdfSigningService $signer)
    {
        $belongs = Project::where('client_id', auth()->id())
            ->where('id', $document->project_id)
            ->exists();

        abort_unless($belongs, 403);
        abort_unless($document->sign_status === 'pending', 422, 'This document cannot be signed.');

        $request->validate([
            'signer_name' => 'required|string|max:255',
        ]);

        try {
            $signedAt = now();

            // 1. Stamp the PDF via FPDI
            $signedPdf = $signer->stamp($document->url, $request->signer_name, $signedAt);

            // 2. Write to temp file for upload.
            //    Use .tmp — Cloudinary allows this extension and serves it
            //    without CDN restrictions (unlike .pdf which triggers a 401).
            $tmpFile = tempnam(sys_get_temp_dir(), 'bgr_signed_') . '.tmp';
            file_put_contents($tmpFile, $signedPdf);

            // 3. Upload to Cloudinary as a raw resource.
            //    We deliberately omit the .pdf extension from the public_id:
            //    Cloudinary blocks CDN access to .pdf files by default (security
            //    setting). Using no extension bypasses that restriction while the
            //    download proxy still serves the file as application/pdf.
            $project      = $document->project;
            $baseName     = pathinfo($document->filename ?? 'document', PATHINFO_FILENAME);
            $publicId     = $baseName . '_signed_' . time();
            $downloadName = $publicId . '.pdf';   // friendly name for Content-Disposition

            $result = Cloudinary::uploadApi()->upload($tmpFile, [
                'folder'        => "bgr/documents/{$project->id}",
                'resource_type' => 'raw',
                'public_id'     => $publicId,
            ]);

            @unlink($tmpFile);

            // 4. Mark as signed and update the stored URL / filename
            $document->update([
                'url'         => $result['secure_url'],
                'filename'    => $downloadName,   // .pdf shown to user on download
                'mime_type'   => 'application/pdf',
                'sign_status' => 'signed',
                'signed_at'   => $signedAt,
                'signer_name' => $request->signer_name,
            ]);

        } catch (\Throwable $e) {
            Log::error('PDF signing failed', [
                'document_id' => $document->id,
                'error'       => $e->getMessage(),
            ]);

            return back()->withErrors(['signer_name' => 'Signing failed: ' . $e->getMessage()]);
        }

        return redirect()->route('client.documents.index')
            ->with('success', 'Document signed successfully.');
    }

    /**
     * GET /portal/documents/{document}/download
     * Proxies the file through Laravel so the client gets a clean download
     * with the correct filename — Cloudinary URL is never exposed to the browser.
     */
    public function download(Document $document)
    {
        $belongs = Project::where('client_id', auth()->id())
            ->where('id', $document->project_id)
            ->exists();

        abort_unless($belongs, 403);

        $response = Http::timeout(30)->get($document->url);
        abort_unless($response->successful(), 502, 'Could not retrieve the file.');

        $mime     = $document->mime_type ?? $response->header('Content-Type') ?? 'application/octet-stream';
        $filename = $document->filename  ?? 'document';

        return response($response->body(), 200, [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', $filename) . '"',
            'Content-Length'      => strlen($response->body()),
            'Cache-Control'       => 'no-store',
        ]);
    }
}
