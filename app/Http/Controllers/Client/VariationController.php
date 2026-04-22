<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\VariationRequest;
use App\Services\GHLService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VariationController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $variations = VariationRequest::where('submitted_by', $user->id)
            ->with('project')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($v) => [
                'id'             => $v->id,
                'title'          => $v->title,
                'staff_member'   => $v->staff_member,
                'site_location'  => $v->site_location,
                'photos'         => $v->photos ?? [],
                'description'    => $v->description,
                'estimated_cost' => $v->estimated_cost,
                'status'         => $v->status,
                'admin_notes'    => $v->admin_notes,
                'submitted_at'   => $v->created_at->format('j M Y'),
                'project_id'     => $v->project_id,
                'project_name'   => $v->project?->name,
            ]);

        $projects = Project::where('client_id', $user->id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Client/Variations/Index', [
            'variations' => $variations,
            'projects'   => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'    => 'required|exists:projects,id',
            'staff_member'  => 'required|string|max:255',
            'site_location' => 'required|string|max:500',
            'description'   => 'required|string',
            'photos'        => 'nullable|array|max:10',
            'photos.*'      => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
        ]);

        $project = Project::where('id', $data['project_id'])
            ->where('client_id', auth()->id())
            ->firstOrFail();

        $photoPaths = $this->storePhotos($request);

        $variation = VariationRequest::create([
            'project_id'    => $data['project_id'],
            'submitted_by'  => auth()->id(),
            'title'         => Str::limit($data['description'], 80),
            'staff_member'  => $data['staff_member'],
            'site_location' => $data['site_location'],
            'photos'        => $photoPaths ?: null,
            'description'   => $data['description'],
            'status'        => 'pending',
        ]);

        $this->pushToGHL($project, $variation, 'new');

        return back()->with('success', 'Variation request submitted successfully.');
    }

    public function update(Request $request, VariationRequest $variation)
    {
        abort_if($variation->submitted_by !== auth()->id(), 403);
        abort_if($variation->status !== 'pending', 403);

        $data = $request->validate([
            'project_id'        => 'required|exists:projects,id',
            'staff_member'      => 'required|string|max:255',
            'site_location'     => 'required|string|max:500',
            'description'       => 'required|string',
            'photos'            => 'nullable|array|max:10',
            'photos.*'          => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
            'existing_photos'   => 'nullable|array',
            'existing_photos.*' => 'string',
        ]);

        $project = Project::where('id', $data['project_id'])
            ->where('client_id', auth()->id())
            ->firstOrFail();

        $photoPaths = array_merge(
            $data['existing_photos'] ?? [],
            $this->storePhotos($request),
        );

        $variation->update([
            'project_id'    => $data['project_id'],
            'title'         => Str::limit($data['description'], 80),
            'staff_member'  => $data['staff_member'],
            'site_location' => $data['site_location'],
            'photos'        => $photoPaths ?: null,
            'description'   => $data['description'],
        ]);

        $this->pushToGHL($project, $variation->fresh(), 'updated');

        return back()->with('success', 'Variation request updated successfully.');
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function storePhotos(Request $request): array
    {
        $urls = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $path = $file->store('variations', 'public');
                $urls[] = Storage::url($path);
            }
        }
        return $urls;
    }

    /**
     * Post a note on the client's GHL contact — fire-and-forget, never
     * surfaces errors to the client. $type is 'new' or 'updated'.
     *
     * GHL API v2021-07-28 does not support /opportunities/{id}/notes (404).
     * Notes posted to the contact appear in the contact's Notes tab and are
     * visible when viewing the linked opportunity via the contact record.
     */
    private function pushToGHL(Project $project, VariationRequest $variation, string $type): void
    {
        $client = auth()->user();

        if (! $client->ghl_contact_id) {
            return;
        }

        $date  = now()->format('d M Y, g:i A');
        $label = $type === 'new' ? '🆕 New Variation Request' : '✏️ Variation Request Updated';
        $title = "{$label} — {$project->name}";

        $body = implode("\n", [
            "Project: {$project->name}",
            "Client: {$client->name}",
            "Email: {$client->email}",
            "Staff Member: {$variation->staff_member}",
            "Site Location: {$variation->site_location}",
            "Date: {$date}",
            "",
            "Description:",
            $variation->description,
        ]);

        app(GHLService::class)->postContactNote(
            contactId: $client->ghl_contact_id,
            title:     $title,
            body:      $body,
            photoUrls: $variation->photos ?? [],
        );
    }
}
