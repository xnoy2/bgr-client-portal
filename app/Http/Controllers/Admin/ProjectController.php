<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use App\Services\MediaStorageService;
use App\Models\PortalNotification;
use App\Services\ClientProvisioningService;
use App\Services\GHLService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(
        private GHLService $ghl,
        private ClientProvisioningService $clientProvisioning,
        private MediaStorageService $storage,
    ) {}

    // Ã¢â€â‚¬Ã¢â€â‚¬ Index Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    /**
     * GET /admin/projects
     * All GHL pipeline opportunities. Each IS a project.
     */
    public function index()
    {
        $ghlData = $this->ghl->getCachedPipelineOpportunities();
        $ghlOpps = collect($ghlData['opportunities'] ?? []);

        // Existing local records keyed by ghl_opportunity_id
        $localByGhlId = Project::with(['client', 'workers'])
            ->whereNotNull('ghl_opportunity_id')
            ->get()
            ->keyBy('ghl_opportunity_id');

        // For every GHL opportunity that has a contact email but no linked client,
        // ensure a local project record exists and provision the client account.
        // This runs automatically when admin views the Projects page Ã¢â‚¬â€ no webhook needed.
        $provisioned = false;
        foreach ($ghlOpps as $opp) {
            $contact = $opp['contact'] ?? [];
            if (empty($contact['email'])) continue;

            $local = $localByGhlId->get($opp['id']);
            if ($local && $local->client_id) continue; // already done

            $project = Project::firstOrCreate(
                ['ghl_opportunity_id' => $opp['id']],
                ['name' => $opp['name'], 'status' => 'pending']
            );

            if ($project->wasRecentlyCreated) {
                foreach (Project::defaultStageNames() as $i => $stageName) {
                    $project->stages()->create(['name' => $stageName, 'order' => $i + 1, 'status' => 'pending']);
                }
            }

            $this->clientProvisioning->findOrCreateFromContact($contact, $opp['id']);
            $provisioned = true;
        }

        // Refresh local data if anything was provisioned
        if ($provisioned) {
            $this->ghl->forgetPipelineCache();
            $localByGhlId = Project::with(['client', 'workers'])
                ->whereNotNull('ghl_opportunity_id')
                ->get()
                ->keyBy('ghl_opportunity_id');
        }

        // Pre-fetch maintenance subscriptions keyed by client_id
        $clientIds = $localByGhlId->pluck('client_id')->filter()->unique()->values();
        $maintenanceSubs = \App\Models\MaintenanceSubscription::whereIn('client_id', $clientIds)
            ->whereIn('status', ['active', 'paused'])
            ->get(['client_id', 'plan']);
        $slugs     = $maintenanceSubs->pluck('plan')->unique();
        $planNames = \App\Models\MaintenancePlan::whereIn('slug', $slugs)->pluck('name', 'slug');
        $maintenanceByClient = $maintenanceSubs->mapWithKeys(fn ($s) => [
            $s->client_id => $planNames[$s->plan] ?? ucfirst($s->plan),
        ]);

        // Enrich each GHL opp with any local data we already have
        $opportunities = $ghlOpps->map(function ($opp) use ($localByGhlId, $maintenanceByClient) {
            $local = $localByGhlId->get($opp['id']);
            return array_merge($opp, [
                'local' => $local ? [
                    'id'               => $local->id,
                    'status'           => $local->status,
                    'address'          => $local->address,
                    'workers_count'    => $local->workers->count(),
                    'maintenance_plan' => $maintenanceByClient[$local->client_id] ?? null,
                    'client'           => $local->client
                        ? ['id' => $local->client->id, 'name' => $local->client->name]
                        : null,
                ] : null,
            ]);
        })->values();

        return Inertia::render('Admin/Projects/Index', [
            'opportunities' => $opportunities,
            'ghl_meta'      => $ghlData['meta'] ?? [],
            'clients'       => User::role('client')->orderBy('name')->get(['id', 'name', 'email']),
            'workers'       => User::role('worker')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Show Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    /**
     * GET /admin/projects/{ghlId}
     * GHL opportunity IS the project. Find-or-create local record on first open.
     */
    public function show(string $ghlId)
    {
        // 1. Fetch live GHL data first Ã¢â‚¬â€ it's the source of truth
        $ghl = $this->ghl->getCachedOpportunity($ghlId);

        if (! $ghl) {
            abort(404, 'GHL opportunity not found.');
        }

        // 2. Find or create local project record
        $project = Project::firstOrCreate(
            ['ghl_opportunity_id' => $ghlId],
            [
                'name'   => $ghl['name'],
                'status' => 'pending',
            ]
        );

        // 3. Auto-create the 5 stages if none exist yet
        if ($project->stages()->doesntExist()) {
            foreach (Project::defaultStageNames() as $i => $name) {
                $project->stages()->create(['name' => $name, 'order' => $i + 1, 'status' => 'pending']);
            }
            $this->ghl->forgetPipelineCache();
        }

        $project->load(['client', 'workers', 'stages', 'documents.uploader']);

        // Auto-provision client account if not yet linked and GHL has contact email
        if (! $project->client_id && ! empty($ghl['contact']['email'])) {
            $this->clientProvisioning->findOrCreateFromContact($ghl['contact'], $ghlId);
            $project->refresh()->load(['client', 'workers', 'stages', 'documents.uploader']);
        }

        // Sync local stage statuses from GHL Ã¢â‚¬â€ skip if all stages are already completed
        // so GHL cannot revert a completed project back to in_progress.
        $allCompleted = $project->stages->isNotEmpty()
            && $project->stages->every(fn ($s) => $s->status === 'completed');

        if (! $allCompleted && ! empty($ghl['stage_id'])) {
            $this->ghl->syncProjectStages($project, $ghl['stage_id']);
            $project->load('stages');
        }

        return Inertia::render('Admin/Projects/Show', [
            'project' => [
                'id'                   => $project->id,
                'name'                 => $project->name,
                'description'          => $project->description,
                'address'              => $project->address,
                'status'               => $project->status,
                'start_date'           => $project->start_date?->toDateString(),
                'estimated_completion' => $project->estimated_completion?->toDateString(),
                'ghl_opportunity_id'   => $ghlId,
                'client'               => $project->client
                    ? ['id' => $project->client->id, 'name' => $project->client->name, 'email' => $project->client->email]
                    : null,
                'workers' => $project->workers->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
                'stages'  => $project->stages->map(fn ($s) => [
                    'id'         => $s->id,
                    'name'       => $s->name,
                    'order'      => $s->order,
                    'status'     => $s->status,
                    'start_date' => $s->start_date?->toDateString(),
                    'end_date'   => $s->end_date?->toDateString(),
                ]),
            ],
            'ghl'       => $ghl,
            'workers'   => User::role('worker')->orderBy('name')->get(['id', 'name']),
            'clients'   => User::role('client')->orderBy('name')->get(['id', 'name', 'email']),
            'documents' => $project->documents->map(fn ($d) => [
                'id'          => $d->id,
                'title'       => $d->title,
                'filename'    => $d->filename,
                'url'         => $d->url,
                'mime_type'   => $d->mime_type,
                'file_size'   => $d->file_size,
                'category'    => $d->category,
                'uploaded_by' => $d->uploader?->name,
                'uploaded_at' => $d->created_at->format('j M Y'),
            ]),
            'flash'   => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Update Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    /**
     * PUT /admin/projects/{ghlId}
     */
    public function update(Request $request, string $ghlId)
    {
        $project = Project::where('ghl_opportunity_id', $ghlId)->firstOrFail();

        $validated = $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'description'          => 'nullable|string',
            'address'              => 'nullable|string|max:255',
            'status'               => 'sometimes|in:pending,active,on_hold,completed,cancelled',
            'start_date'           => 'nullable|date',
            'estimated_completion' => 'nullable|date',
            'client_id'            => 'nullable|exists:users,id',
            'worker_ids'           => 'sometimes|array',
            'worker_ids.*'         => 'exists:users,id',
        ]);

        $project->update(Arr::except($validated, ['worker_ids']));

        if (array_key_exists('worker_ids', $validated)) {
            $previousIds = $project->workers()->pluck('users.id')->toArray();
            $project->workers()->sync($validated['worker_ids']);

            $newlyAssigned = array_diff($validated['worker_ids'], $previousIds);
            foreach ($newlyAssigned as $workerId) {
                PortalNotification::notifyUser(
                    userId:  $workerId,
                    type:    'project_assigned',
                    title:   'New Project Assigned',
                    message: 'You have been assigned to project: ' . $project->name,
                    url:     route('worker.projects.show', $project->ghl_opportunity_id),
                );
            }
        }

        $this->ghl->forgetOpportunityCache($ghlId);

        return back()->with('success', 'Project updated.');
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Stage update Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    /**
     * PUT /admin/projects/{ghlId}/stage
     */
    public function updateStage(Request $request, string $ghlId)
    {
        $project = Project::where('ghl_opportunity_id', $ghlId)->firstOrFail();

        $validated = $request->validate([
            'stage_id' => 'required|exists:project_stages,id',
            'status'   => 'required|in:pending,in_progress,completed',
        ]);

        $stage = $project->stages()->findOrFail($validated['stage_id']);

        if ($validated['status'] === 'in_progress') {
            $project->stages()->where('order', '<', $stage->order)->update(['status' => 'completed']);
            $project->stages()->where('order', '>', $stage->order)->update(['status' => 'pending']);
        }

        $stage->update(['status' => $validated['status']]);

        return back()->with('success', 'Stage updated.');
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Cache helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    /**
     * POST /admin/projects/refresh-pipeline
     */
    public function refreshPipeline()
    {
        $this->ghl->forgetPipelineCache();
        return back()->with('success', 'GHL pipeline refreshed.');
    }

    /**
     * POST /admin/projects/{ghlId}/refresh-ghl
     */
    public function refreshGHL(string $ghlId)
    {
        $this->ghl->forgetOpportunityCache($ghlId);
        $this->ghl->forgetPipelineCache();
        return back()->with('success', 'GHL data refreshed.');
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Documents Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    /**
     * POST /admin/projects/{ghlId}/documents
     */
    public function uploadDocument(Request $request, string $ghlId)
    {
        $project = Project::where('ghl_opportunity_id', $ghlId)->firstOrFail();

        $request->validate([
            'file'     => 'required|file|max:20480',
            'category' => 'nullable|in:contract,quote,invoice,plan,report,other',
        ]);

        $file     = $request->file('file');
        $filename = $file->getClientOriginalName();
        $title    = pathinfo($filename, PATHINFO_FILENAME);

        try {
            $path = $this->storage->upload($file, "documents/{$project->id}");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('R2 document upload failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['file' => 'File upload failed: ' . $e->getMessage()]);
        }

        if (! $path) {
            return back()->withErrors(['file' => 'Storage is not configured. Please contact the administrator.']);
        }

        Document::create([
            'project_id'   => $project->id,
            'uploaded_by'  => auth()->id(),
            'title'        => $title,
            'filename'     => $filename,
            'storage_path' => $path,
            'storage_disk' => 'r2',
            'mime_type'    => $file->getMimeType(),
            'file_size'    => $file->getSize(),
            'category'     => $request->input('category', 'other'),
            'visibility'   => 'client',
            'sign_status'  => 'pending',
            'sent_at'      => now(),
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    /**
     * DELETE /admin/projects/{ghlId}/documents/{document}
     */
    public function deleteDocument(string $ghlId, Document $document)
    {
        $project = Project::where('ghl_opportunity_id', $ghlId)->firstOrFail();

        abort_unless($document->project_id === $project->id, 403);

        try {
            Cloudinary::uploadApi()->destroy($document->ghl_file_id, ['resource_type' => 'raw']);
        } catch (\Throwable) {
            // Non-fatal Ã¢â‚¬â€ remove local record even if CDN delete fails
        }

        $document->delete();

        return back()->with('success', 'Document deleted.');
    }

    /**
     * GET /admin/projects/{ghlId}/documents/{document}/download
     * Generates a short-lived presigned R2 URL and redirects the browser to it.
     */
    public function downloadDocument(string $ghlId, Document $document)
    {
        $project = Project::where('ghl_opportunity_id', $ghlId)->firstOrFail();
        abort_unless($document->project_id === $project->id, 403);

        if ($document->storage_path) {
            return $this->r2PresignedRedirect($document->storage_path, $document->filename ?? 'document');
        }

        // Legacy Cloudinary — proxy via HTTP
        if ($document->url) {
            $response = \Illuminate\Support\Facades\Http::timeout(30)->get($document->url);
            abort_unless($response->successful(), 502, 'Could not retrieve the file.');
            return response($response->body(), 200, [
                'Content-Type'        => $document->mime_type ?? 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', $document->filename ?? 'document') . '"',
                'Cache-Control'       => 'no-store',
            ]);
        }

        abort(404, 'File not available. Please re-upload this document.');
    }

    private function r2PresignedRedirect(string $path, string $filename): \Illuminate\Http\RedirectResponse
    {
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
            'Bucket'                        => config('filesystems.disks.r2.bucket'),
            'Key'                           => $path,
            'ResponseContentDisposition'    => 'attachment; filename="' . str_replace('"', '', $filename) . '"',
        ]);

        $url = (string) $s3->createPresignedRequest($cmd, '+10 minutes')->getUri();

        return redirect($url);
    }
}
