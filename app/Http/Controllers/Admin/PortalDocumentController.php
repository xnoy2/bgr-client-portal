<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortalDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortalDocumentController extends Controller
{
    public function store(Request $request, string $category)
    {
        abort_unless(in_array($category, ['terms_conditions', 'others']), 404);

        $request->validate([
            'file' => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,png,jpg,jpeg,webp',
        ]);

        $file = $request->file('file');
        $path = $file->store("portal-documents/{$category}", 'local');

        PortalDocument::create([
            'category'      => $category,
            'original_name' => $file->getClientOriginalName(),
            'disk_path'     => $path,
            'mime_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'uploaded_by'   => auth()->id(),
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    public function destroy(PortalDocument $portalDocument)
    {
        Storage::disk('local')->delete($portalDocument->disk_path);
        $portalDocument->delete();

        return back()->with('success', 'Document deleted.');
    }

    public function download(PortalDocument $portalDocument)
    {
        abort_unless(Storage::disk('local')->exists($portalDocument->disk_path), 404);

        return Storage::disk('local')->download($portalDocument->disk_path, $portalDocument->original_name);
    }
}
