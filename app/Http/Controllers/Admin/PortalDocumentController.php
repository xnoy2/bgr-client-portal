<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortalDocument;
use App\Models\PortalNotification;
use App\Models\Project;
use App\Services\MediaStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortalDocumentController extends Controller
{
    public function __construct(private MediaStorageService $storage) {}

    public function store(Request $request, string $category)
    {
        abort_unless(in_array($category, ['terms_conditions', 'others']), 404);

        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'file'       => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,png,jpg,jpeg,webp',
        ]);

        $file = $request->file('file');

        if ($this->storage->configured()) {
            $path = $this->storage->upload($file, "portal-documents/{$category}");
            $disk = 'r2';
        } else {
            $path = $file->store("portal-documents/{$category}", 'local');
            $disk = 'local';
        }

        $projectId = $request->input('project_id');

        PortalDocument::create([
            'category'      => $category,
            'project_id'    => $projectId,
            'original_name' => $file->getClientOriginalName(),
            'disk_path'     => $path,
            'storage_disk'  => $disk,
            'mime_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'uploaded_by'   => auth()->id(),
        ]);

        // Notify the client that a document has been shared
        try {
            $project = Project::find($projectId);
            if ($project?->client_id) {
                $categoryLabel = $category === 'terms_conditions' ? 'Terms & Conditions' : 'Other Document';
                PortalNotification::notifyUser(
                    userId:  $project->client_id,
                    type:    'document_shared',
                    title:   'New Document Shared',
                    message: 'A new ' . $categoryLabel . ' "' . $file->getClientOriginalName() . '" has been shared on your project.',
                    url:     route('client.documents.index'),
                );
            }
        } catch (\Throwable) {
            // Non-fatal — upload already succeeded
        }

        return back()->with('success', 'Document uploaded.');
    }

    public function destroy(PortalDocument $portalDocument)
    {
        Storage::disk($portalDocument->storage_disk)->delete($portalDocument->disk_path);
        $portalDocument->delete();

        return back()->with('success', 'Document deleted.');
    }

    public function download(PortalDocument $portalDocument)
    {
        $disk = $portalDocument->storage_disk;
        $path = $portalDocument->disk_path;

        if ($disk === 'r2') {
            $s3 = new \Aws\S3\S3Client([
                'version'                 => 'latest',
                'region'                  => 'auto',
                'endpoint'                => config('filesystems.disks.r2.endpoint'),
                'use_path_style_endpoint' => true,
                'credentials'             => [
                    'key'    => config('filesystems.disks.r2.key'),
                    'secret' => config('filesystems.disks.r2.secret'),
                ],
            ]);
            $cmd = $s3->getCommand('GetObject', [
                'Bucket'                     => config('filesystems.disks.r2.bucket'),
                'Key'                        => $path,
                'ResponseContentDisposition' => 'attachment; filename="' . str_replace('"', '', $portalDocument->original_name) . '"',
            ]);
            return redirect((string) $s3->createPresignedRequest($cmd, '+10 minutes')->getUri());
        }

        // Local disk (dev environment)
        $content = Storage::disk($disk)->get($path);
        abort_unless($content !== null, 404, 'File not found.');
        return response($content, 200, [
            'Content-Type'        => $portalDocument->mime_type ?? 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', $portalDocument->original_name) . '"',
            'Cache-Control'       => 'no-store',
        ]);
    }
}
