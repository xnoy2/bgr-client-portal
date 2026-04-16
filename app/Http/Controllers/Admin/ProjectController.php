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

    /**
     * GET /admin/projects
     * Shows GHL pipeline opportunities merged with local project records.
     */
    public function index()
    {
        // Pull from GHL (cached 5 min)
        $ghlData = $this->ghl->getCachedPipelineOpportunities();
        $ghlOpps = collect($ghlData['opportunities'] ?? []);

        // Local projects keyed by ghl_opportunity_id for quick lookup
        $localByGhlId = Project::with(['client', 'workers'])
            ->whereNotNull('ghl_opportunity_id')
            ->get()
            ->keyBy('ghl_opportunity_id');

        // Merge GHL opps with local project data
        $opportunities = $ghlOpps->map(function ($opp) use ($localByGhlId) {
            $local = $localByGhlId->get($opp['id']);
            return array_merge($opp, [
                'local_project' => $local ? [
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
            'flash'         => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    /**
     * GET /admin/projects/{project}
     * Local project detail enriched with live GHL opportunity data.
     */
    public function show(Project $project)
    {
        $project->load(['client', 'workers', 'stages']);

        $ghl = null;
        if ($project->ghl_opportunity_id) {
            $ghl = $this->ghl->getCachedOpportunity($project->ghl_opportunity_id);
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
                'ghl_opportunity_id'   => $project->ghl_opportunity_id,
                'client'               => $project->client ? [
                    'id'    => $project->client->id,
                    'name'  => $project->client->name,
                    'email' => $project->client->email,
                ] : null,
                'workers' => $project->workers->map(fn ($w) => [
                    'id'   => $w->id,
                    'name' => $w->name,
                ]),
                'stages' => $project->stages->map(fn ($s) => [
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
            'flash'   => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    /**
     * POST /admin/projects
     * Creates a local project record (can be linked to a GHL opportunity).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'client_id'            => 'required|exists:users,id',
            'description'          => 'nullable|string',
            'address'              => 'nullable|string|max:255',
            'start_date'           => 'nullable|date',
            'estimated_completion' => 'nullable|date|after_or_equal:start_date',
            'status'               => 'nullable|in:pending,active,on_hold,completed,cancelled',
            'ghl_opportunity_id'   => 'nullable|string|max:255',
        ]);

        $project = Project::create($validated + ['status' => $validated['status'] ?? 'pending']);

        foreach (Project::defaultStageNames() as $i => $name) {
            $project->stages()->create(['name' => $name, 'order' => $i + 1, 'status' => 'pending']);
        }

        $this->ghl->forgetPipelineCache();

        return redirect()->route('admin.projects.show', $project)
            ->with('success', "Project \"{$project->name}\" created.");
    }

    /**
     * PUT /admin/projects/{project}
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'description'          => 'nullable|string',
            'address'              => 'nullable|string|max:255',
            'status'               => 'sometimes|in:pending,active,on_hold,completed,cancelled',
            'start_date'           => 'nullable|date',
            'estimated_completion' => 'nullable|date',
            'client_id'            => 'sometimes|exists:users,id',
            'ghl_opportunity_id'   => 'nullable|string|max:255',
            'worker_ids'           => 'sometimes|array',
            'worker_ids.*'         => 'exists:users,id',
        ]);

        $project->update(Arr::except($validated, ['worker_ids']));

        if (array_key_exists('worker_ids', $validated)) {
            $project->workers()->sync($validated['worker_ids']);
        }

        if ($project->ghl_opportunity_id) {
            $this->ghl->forgetOpportunityCache($project->ghl_opportunity_id);
        }

        return back()->with('success', 'Project updated.');
    }

    /**
     * PUT /admin/projects/{project}/stage
     * Update a single stage status.
     */
    public function updateStage(Request $request, Project $project)
    {
        $validated = $request->validate([
            'stage_id' => 'required|exists:project_stages,id',
            'status'   => 'required|in:pending,in_progress,completed',
        ]);

        $stage = $project->stages()->findOrFail($validated['stage_id']);

        // If marking in_progress, complete previous stages and reset any later ones
        if ($validated['status'] === 'in_progress') {
            $project->stages()
                ->where('order', '<', $stage->order)
                ->update(['status' => 'completed']);

            $project->stages()
                ->where('order', '>', $stage->order)
                ->update(['status' => 'pending']);
        }

        $stage->update(['status' => $validated['status']]);

        return back()->with('success', 'Stage updated.');
    }

    /**
     * POST /admin/projects/refresh-pipeline
     * Bust the cached pipeline opportunity list.
     */
    public function refreshPipeline()
    {
        $this->ghl->forgetPipelineCache();
        return back()->with('success', 'GHL pipeline refreshed.');
    }

    /**
     * POST /admin/projects/{project}/refresh-ghl
     * Bust GHL cache and reload opportunity data for a single project.
     */
    public function refreshGHL(Project $project)
    {
        if ($project->ghl_opportunity_id) {
            $this->ghl->forgetOpportunityCache($project->ghl_opportunity_id);
        }
        $this->ghl->forgetPipelineCache();

        return back()->with('success', 'GHL data refreshed.');
    }
}
