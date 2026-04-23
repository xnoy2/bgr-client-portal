<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortalDocument;
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

        PortalDocument::create([
            'category'      => $category,
            'project_id'    => $request->input('project_id'),
            'original_name' => $file->getClientOriginalName(),
            'disk_path'     => $path,
            'storage_disk'  => $disk,
            'mime_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'uploaded_by'   => auth()->id(),
        ]);

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

        abort_unless(Storage::disk($disk)->exists($path), 404);

        if ($disk === 'r2') {
            return response()->stream(function () use ($disk, $path) {
                $stream = Storage::disk($disk)->readStream($path);
                fpassthru($stream);
                fclose($stream);
            }, 200, [
                'Content-Type'        => $portalDocument->mime_type ?? 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', $portalDocument->original_name) . '"',
                'Cache-Control'       => 'private, max-age=3600',
                'X-Accel-Buffering'   => 'no',
            ]);
        }

        return Storage::disk($disk)->download($path, $portalDocument->original_name);
    }
}
