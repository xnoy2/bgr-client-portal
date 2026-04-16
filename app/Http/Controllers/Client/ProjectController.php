<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProgressUpdate;
use App\Services\GHLService;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function __construct(private GHLService $ghl) {}

    /**
     * GET /portal/projects
     * Lists all projects belonging to the authenticated client.
     */
    public function index()
    {
        $projects = Project::with(['stages', 'workers'])
            ->where('client_id', auth()->id())
            ->orderByDesc('created_at')
            ->get();

        // Enrich each project with cached GHL data
        $data = $projects->map(function ($project) {
            $ghl = $project->ghl_opportunity_id
                ? $this->ghl->getCachedOpportunity($project->ghl_opportunity_id)
                : null;

            // Sync stages from GHL before computing progress
            if ($ghl && ! empty($ghl['stage_id'])) {
                $this->ghl->syncProjectStages($project, $ghl['stage_id']);
            }

            $completedStages = $project->stages->where('status', 'completed')->count();
            $totalStages     = $project->stages->count();
            $currentStage    = $project->stages->firstWhere('status', 'in_progress');

            return [
                'id'                   => $project->id,
                'ghl_opportunity_id'   => $project->ghl_opportunity_id,
                'name'                 => $ghl['name'] ?? $project->name,
                'status'               => $project->status,
                'address'              => $project->address,
                'start_date'           => $project->start_date?->toDateString(),
                'estimated_completion' => $project->estimated_completion?->toDateString(),
                'progress_pct'         => $totalStages > 0 ? round(($completedStages / $totalStages) * 100) : 0,
                'current_stage'        => $currentStage?->name,
                'workers_count'        => $project->workers->count(),
                'ghl_stage'            => $ghl['stage_name'] ?? null,
                'ghl_status'           => $ghl['status']     ?? null,
            ];
        });

        return Inertia::render('Client/Dashboard', [
            'projects' => $data,
        ]);
    }

    /**
     * GET /portal/projects/{ghlId}
     * Full project detail for the client — read-only.
     */
    public function show(string $ghlId)
    {
        $project = Project::with(['stages', 'workers'])
            ->where('ghl_opportunity_id', $ghlId)
            ->where('client_id', auth()->id())
            ->firstOrFail();   // 403 if not their project

        $ghl = $this->ghl->getCachedOpportunity($ghlId);

        // Sync local stages from GHL pipeline stage
        if ($ghl && ! empty($ghl['stage_id'])) {
            $this->ghl->syncProjectStages($project, $ghl['stage_id']);
            $project->load('stages');
        }

        $completedStages = $project->stages->where('status', 'completed')->count();
        $totalStages     = $project->stages->count();
        $progressPct     = $totalStages > 0 ? round(($completedStages / $totalStages) * 100) : 0;

        $updates = ProgressUpdate::with(['author', 'stage'])
            ->where('project_id', $project->id)
            ->where('is_published', true)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($u) => [
                'id'         => $u->id,
                'title'      => $u->title,
                'body'       => $u->body,
                'photos'     => $u->photos ?? [],
                'stage_name' => $u->stage?->name,
                'author'     => $u->author?->name,
                'created_at' => $u->created_at->diffForHumans(),
            ]);

        return Inertia::render('Client/Projects/Show', [
            'project' => [
                'id'                   => $project->id,
                'ghl_opportunity_id'   => $ghlId,
                'name'                 => $ghl['name']        ?? $project->name,
                'status'               => $project->status,
                'address'              => $project->address,
                'start_date'           => $project->start_date?->toDateString(),
                'estimated_completion' => $project->estimated_completion?->toDateString(),
                'progress_pct'         => $progressPct,
                'stages'               => $project->stages->map(fn ($s) => [
                    'id'     => $s->id,
                    'name'   => $s->name,
                    'order'  => $s->order,
                    'status' => $s->status,
                ]),
                'workers' => $project->workers->map(fn ($w) => [
                    'id'   => $w->id,
                    'name' => $w->name,
                ]),
            ],
            'ghl' => $ghl ? [
                'name'         => $ghl['name'],
                'status'       => $ghl['status'],
                'stage_name'   => $ghl['stage_name'],
                'contact'      => $ghl['contact'],
                'source'       => $ghl['source'],
                'custom_fields'=> $ghl['custom_fields'] ?? [],
                'created_at'   => $ghl['created_at'],
            ] : null,
            'updates' => $updates,
            'flash' => ['success' => session('success'), 'error' => session('error')],
        ]);
    }
}
