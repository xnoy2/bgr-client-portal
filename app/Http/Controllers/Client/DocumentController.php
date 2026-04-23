<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Project;
use App\Services\MediaStorageService;
use App\Services\PdfSigningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function __construct(private MediaStorageService $azure) {}

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
                'download_url' => route('media.document', $doc->id),
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
     * Stamps the PDF and re-uploads to Azure Blob Storage.
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

            // 1. Get the source PDF bytes
            $sourcePdf = $document->storage_path
                ? Storage::disk('r2')->get($document->storage_path)
                : \Illuminate\Support\Facades\Http::timeout(30)->get($document->url)->body();

            // 2. Stamp the PDF
            $signedPdf = $signer->stampFromContent($sourcePdf, $request->signer_name, $signedAt);

            // 3. Upload signed PDF to Azure
            $project  = $document->project;
            $baseName = pathinfo($document->filename ?? 'document', PATHINFO_FILENAME);
            $path     = "documents/{$project->id}/{$baseName}_signed_{$signedAt->timestamp}.pdf";

            Storage::disk('r2')->put($path, $signedPdf);

            // 4. Mark as signed
            $document->update([
                'storage_path' => $path,
                'storage_disk' => 'r2',
                'filename'     => $baseName . '_signed.pdf',
                'mime_type'    => 'application/pdf',
                'sign_status'  => 'signed',
                'signed_at'    => $signedAt,
                'signer_name'  => $request->signer_name,
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
     * Delegates to the authenticated media proxy.
     */
    public function download(Document $document)
    {
        $belongs = Project::where('client_id', auth()->id())
            ->where('id', $document->project_id)
            ->exists();

        abort_unless($belongs, 403);

        return redirect()->route('media.document', $document->id);
    }
}
