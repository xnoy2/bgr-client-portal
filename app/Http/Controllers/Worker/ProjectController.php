<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\ProgressUpdate;
use App\Models\Project;
use App\Services\GHLService;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(private GHLService $ghl) {}

    /**
     * GET /worker/dashboard
     * All projects the authenticated worker is assigned to.
     */
    public function index()
    {
        $projects = Project::with(['stages', 'client'])
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->orderByDesc('created_at')
            ->get();

        $data = $projects->map(function ($project) {
            $ghl = $project->ghl_opportunity_id
                ? $this->ghl->getCachedOpportunity($project->ghl_opportunity_id)
                : null;

            if ($ghl && ! empty($ghl['stage_id'])) {
                $this->ghl->syncProjectStages($project, $ghl['stage_id']);
            }

            $completedStages = $project->stages->where('status', 'completed')->count();
            $totalStages     = $project->stages->count();
            $currentStage    = $project->stages->firstWhere('status', 'in_progress');

            return [
                'id'                 => $project->id,
                'ghl_opportunity_id' => $project->ghl_opportunity_id,
                'name'               => $ghl['name'] ?? $project->name,
                'status'             => $project->status,
                'address'            => $project->address,
                'progress_pct'       => $totalStages > 0 ? round(($completedStages / $totalStages) * 100) : 0,
                'current_stage'      => $currentStage?->name,
                'completed_stages'   => $completedStages,
                'total_stages'       => $totalStages,
                'ghl_stage'          => $ghl['stage_name'] ?? null,
                'client_name'        => $project->client?->name,
            ];
        });

        return Inertia::render('Worker/Dashboard', [
            'projects' => $data,
        ]);
    }

    /**
     * GET /worker/projects/{ghlId}
     * Project detail — worker can manage stages and post updates.
     */
    public function show(string $ghlId)
    {
        $project = Project::with(['stages', 'workers', 'client'])
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->where('ghl_opportunity_id', $ghlId)
            ->firstOrFail();

        $ghl = $this->ghl->getCachedOpportunity($ghlId);

        // Sync stages from GHL (read-only load)
        if ($ghl && ! empty($ghl['stage_id'])) {
            $this->ghl->syncProjectStages($project, $ghl['stage_id']);
            $project->load('stages');
        }

        // Load updates newest first, with author + stage
        $updates = ProgressUpdate::with(['author', 'stage'])
            ->where('project_id', $project->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($u) => [
                'id'         => $u->id,
                'title'      => $u->title,
                'body'       => $u->body,
                'photos'     => $u->photos ?? [],
                'stage_id'   => $u->stage_id,
                'stage_name' => $u->stage?->name,
                'author'     => $u->author?->name,
                'created_at' => $u->created_at->diffForHumans(),
                'is_mine'    => $u->user_id === auth()->id(),
            ]);

        return Inertia::render('Worker/Projects/Show', [
            'project' => [
                'id'                   => $project->id,
                'ghl_opportunity_id'   => $ghlId,
                'name'                 => $ghl['name'] ?? $project->name,
                'status'               => $project->status,
                'address'              => $project->address,
                'start_date'           => $project->start_date?->toDateString(),
                'estimated_completion' => $project->estimated_completion?->toDateString(),
                'progress_pct'         => $this->calcProgress($project),
                'completed_stages'     => $project->stages->where('status', 'completed')->count(),
                'total_stages'         => $project->stages->count(),
                'client'               => $project->client
                    ? ['id' => $project->client->id, 'name' => $project->client->name]
                    : null,
                'workers' => $project->workers->map(fn ($w) => [
                    'id'   => $w->id,
                    'name' => $w->name,
                ]),
                'stages' => $project->stages->map(fn ($s) => [
                    'id'     => $s->id,
                    'name'   => $s->name,
                    'order'  => $s->order,
                    'status' => $s->status,
                ]),
            ],
            'updates' => $updates,
            'ghl'     => $ghl ? ['stage_name' => $ghl['stage_name'], 'status' => $ghl['status']] : null,
            'flash'   => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    /**
     * PUT /worker/projects/{ghlId}/stage
     * Advance or update a stage — writes back to GHL.
     */
    public function updateStage(Request $request, string $ghlId)
    {
        $project = Project::with('stages')
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->where('ghl_opportunity_id', $ghlId)
            ->firstOrFail();

        $validated = $request->validate([
            'stage_order' => 'required|integer|min:1|max:5',
        ]);

        $this->ghl->advanceProjectStage($project, $validated['stage_order']);

        return back()->with('success', 'Stage updated.');
    }

    /**
     * POST /worker/projects/{ghlId}/update
     * Worker posts a progress update with optional photos.
     */
    public function postUpdate(Request $request, string $ghlId)
    {
        $project = Project::with('stages')
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->where('ghl_opportunity_id', $ghlId)
            ->firstOrFail();

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'body'     => 'required|string|max:5000',
            'stage_id' => 'nullable|integer|exists:project_stages,id',
            'photos'   => 'nullable|array|max:10',
            'photos.*' => 'file|mimes:jpg,jpeg,png,webp,heic|max:10240',
        ]);

        // Ensure the stage (if given) belongs to this project
        if (! empty($validated['stage_id'])) {
            $project->stages->firstOrFail('id', $validated['stage_id']);
        }

        // Upload photos to Cloudinary
        $photoUrls = [];
        foreach ($request->file('photos', []) as $file) {
            $result = Cloudinary::uploadApi()->upload($file->getRealPath(), [
                'folder'        => "bgr/project-updates/{$project->id}",
                'resource_type' => 'image',
                'quality'       => 'auto',
                'fetch_format'  => 'auto',
            ]);

            $url      = $result['secure_url'];
            $publicId = $result['public_id'];
            $photoUrls[] = $url;

            MediaFile::create([
                'project_id'        => $project->id,
                'user_id'           => auth()->id(),
                'original_filename' => $file->getClientOriginalName(),
                'url'               => $url,
                'ghl_file_id'       => $publicId,
                'resource_type'     => 'photo',
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
            ]);
        }

        // Persist update record
        ProgressUpdate::create([
            'project_id'   => $project->id,
            'user_id'      => auth()->id(),
            'stage_id'     => $validated['stage_id'] ?? null,
            'title'        => $validated['title'],
            'body'         => $validated['body'],
            'photos'       => $photoUrls ?: null,
            'is_published' => true,
            'visibility'   => 'client',
            'published_at' => now(),
        ]);

        // Post a note to GHL opportunity (Notes API supports text, not file upload fields)
        if ($project->ghl_opportunity_id) {
            $this->ghl->postOpportunityNote(
                $project->ghl_opportunity_id,
                $validated['title'],
                $validated['body'],
                $photoUrls
            );
        }

        return back()->with('success', 'Update posted successfully.');
    }

    /**
     * PUT /worker/projects/{ghlId}/updates/{updateId}
     * Worker edits their own progress update.
     */
    public function editUpdate(Request $request, string $ghlId, int $updateId)
    {
        $project = Project::with('stages')
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->where('ghl_opportunity_id', $ghlId)
            ->firstOrFail();

        $update = ProgressUpdate::where('id', $updateId)
            ->where('project_id', $project->id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'body'          => 'required|string|max:5000',
            'stage_id'      => 'nullable|integer|exists:project_stages,id',
            'kept_photos'   => 'nullable|array',
            'kept_photos.*' => 'string',
            'new_photos'    => 'nullable|array|max:10',
            'new_photos.*'  => 'file|mimes:jpg,jpeg,png,webp,heic|max:10240',
        ]);

        // Start with the photos the worker chose to keep
        $photoUrls = $validated['kept_photos'] ?? [];

        // Upload any newly added photos to Cloudinary
        foreach ($request->file('new_photos', []) as $file) {
            $result = Cloudinary::uploadApi()->upload($file->getRealPath(), [
                'folder'        => "bgr/project-updates/{$project->id}",
                'resource_type' => 'image',
                'quality'       => 'auto',
                'fetch_format'  => 'auto',
            ]);

            $url      = $result['secure_url'];
            $publicId = $result['public_id'];
            $photoUrls[] = $url;

            MediaFile::create([
                'project_id'        => $project->id,
                'user_id'           => auth()->id(),
                'original_filename' => $file->getClientOriginalName(),
                'url'               => $url,
                'ghl_file_id'       => $publicId,
                'resource_type'     => 'photo',
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
            ]);
        }

        $update->update([
            'title'    => $validated['title'],
            'body'     => $validated['body'],
            'stage_id' => $validated['stage_id'] ?? null,
            'photos'   => $photoUrls ?: null,
        ]);

        return back()->with('success', 'Update edited successfully.');
    }

    private function calcProgress(Project $project): int
    {
        $total = $project->stages->count();
        if ($total === 0) return 0;
        return round(($project->stages->where('status', 'completed')->count() / $total) * 100);
    }
}
