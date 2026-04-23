<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceSubscription;
use App\Models\MediaFile;
use App\Models\ProgressUpdate;
use App\Models\Project;
use App\Services\MediaStorageService;
use App\Services\GHLService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(
        private GHLService $ghl,
        private MediaStorageService $azure,
    ) {}

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

        // Pre-fetch active/paused maintenance subscriptions keyed by client_id
        $clientIds = $projects->pluck('client_id')->filter()->unique()->values();

        $subs = MaintenanceSubscription::whereIn('client_id', $clientIds)
            ->whereIn('status', ['active', 'paused'])
            ->get(['client_id', 'plan']);

        // Resolve plan slugs â†’ display names from maintenance_plans table
        $slugs     = $subs->pluck('plan')->unique();
        $planNames = \App\Models\MaintenancePlan::whereIn('slug', $slugs)
            ->pluck('name', 'slug');

        // Build client_id â†’ plan name map
        $maintenanceByClient = $subs->mapWithKeys(fn ($s) => [
            $s->client_id => $planNames[$s->plan] ?? ucfirst($s->plan),
        ]);

        $data = $projects->map(function ($project) use ($maintenanceByClient) {
            $ghl = $project->ghl_opportunity_id
                ? $this->ghl->getCachedOpportunity($project->ghl_opportunity_id)
                : null;

            $allCompleted = $project->stages->isNotEmpty()
                && $project->stages->every(fn ($s) => $s->status === 'completed');

            if ($ghl && ! empty($ghl['stage_id']) && ! $allCompleted) {
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
                'maintenance_plan'   => $maintenanceByClient[$project->client_id] ?? null,
            ];
        });

        return Inertia::render('Worker/Dashboard', [
            'projects' => $data,
        ]);
    }

    /**
     * GET /worker/projects/{ghlId}
     * Project detail â€” worker can manage stages and post updates.
     */
    public function show(string $ghlId)
    {
        $project = Project::with(['stages', 'workers', 'client'])
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->where('ghl_opportunity_id', $ghlId)
            ->firstOrFail();

        $ghl = $this->ghl->getCachedOpportunity($ghlId);

        // Sync stages from GHL unless the worker has already completed all stages
        // locally â€” prevents GHL from overriding a completed project back to in_progress.
        $allCompleted = $project->stages->isNotEmpty()
            && $project->stages->every(fn ($s) => $s->status === 'completed');

        if ($ghl && ! empty($ghl['stage_id']) && ! $allCompleted) {
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
     * Advance or update a stage â€” writes back to GHL.
     */
    public function updateStage(Request $request, string $ghlId)
    {
        $project = Project::with('stages')
            ->whereHas('workers', fn ($q) => $q->where('users.id', auth()->id()))
            ->where('ghl_opportunity_id', $ghlId)
            ->firstOrFail();

        $validated = $request->validate([
            'stage_order' => 'required|integer|min:1|max:6', // 6 = "complete final stage"
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

        // Upload photos to Azure Blob Storage (private)
        $photoUrls = [];
        foreach ($request->file('photos', []) as $file) {
            $path = $this->azure->upload($file, "project-updates/{$project->id}");

            $media = MediaFile::create([
                'project_id'        => $project->id,
                'user_id'           => auth()->id(),
                'original_filename' => $file->getClientOriginalName(),
                'storage_path'      => $path,
                'storage_disk'      => 'r2',
                'resource_type'     => 'photo',
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
            ]);

            // Store the authenticated proxy URL (not a direct Azure URL)
            $photoUrls[] = route('media.photo', $media->id);
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

        // Upload any newly added photos to Azure Blob Storage (private)
        foreach ($request->file('new_photos', []) as $file) {
            $path = $this->azure->upload($file, "project-updates/{$project->id}");

            $media = MediaFile::create([
                'project_id'        => $project->id,
                'user_id'           => auth()->id(),
                'original_filename' => $file->getClientOriginalName(),
                'storage_path'      => $path,
                'storage_disk'      => 'r2',
                'resource_type'     => 'photo',
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
            ]);

            $photoUrls[] = route('media.photo', $media->id);
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
