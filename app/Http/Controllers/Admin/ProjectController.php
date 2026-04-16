<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use App\Services\GHLService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(private GHLService $ghl) {}

    // ── Index ─────────────────────────────────────────────────────────────────

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

        // Enrich each GHL opp with any local data we already have
        $opportunities = $ghlOpps->map(function ($opp) use ($localByGhlId) {
            $local = $localByGhlId->get($opp['id']);
            return array_merge($opp, [
                'local' => $local ? [
                    'id'            => $local->id,
                    'status'        => $local->status,
                    'address'       => $local->address,
                    'workers_count' => $local->workers->count(),
                    'client'        => $local->client
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

    // ── Show ──────────────────────────────────────────────────────────────────

    /**
     * GET /admin/projects/{ghlId}
     * GHL opportunity IS the project. Find-or-create local record on first open.
     */
    public function show(string $ghlId)
    {
        // 1. Fetch live GHL data first — it's the source of truth
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

        // 3. Auto-create the 5 stages if this is the first open
        if ($project->wasRecentlyCreated) {
            foreach (Project::defaultStageNames() as $i => $name) {
                $project->stages()->create(['name' => $name, 'order' => $i + 1, 'status' => 'pending']);
            }
            $this->ghl->forgetPipelineCache();
        }

        $project->load(['client', 'workers', 'stages']);

        // Sync local stage statuses from GHL pipeline stage (GHL is source of truth)
        if ($ghl && ! empty($ghl['stage_id'])) {
            $this->ghl->syncProjectStages($project, $ghl['stage_id']);
            $project->load('stages'); // reload after sync
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
            'ghl'     => $ghl,
            'workers' => User::role('worker')->orderBy('name')->get(['id', 'name']),
            'clients' => User::role('client')->orderBy('name')->get(['id', 'name', 'email']),
            'flash'   => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

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
            $project->workers()->sync($validated['worker_ids']);
        }

        $this->ghl->forgetOpportunityCache($ghlId);

        return back()->with('success', 'Project updated.');
    }

    // ── Stage update ──────────────────────────────────────────────────────────

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

    // ── Cache helpers ─────────────────────────────────────────────────────────

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
}
