<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StageResource;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Services\GHLService;
use Illuminate\Http\Request;

class StageController extends Controller
{
    public function __construct(private GHLService $ghl) {}

    /**
     * GET /api/projects/{project}/stages
     *
     * All roles can view stages.
     */
    public function index(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project);

        return StageResource::collection(
            $project->stages()->orderBy('order')->get()
        );
    }

    /**
     * PUT /api/projects/{project}/stages/{stage}
     *
     * Worker / Admin: advance or set stage status.
     * Client: forbidden.
     */
    public function update(Request $request, Project $project, ProjectStage $stage)
    {
        $this->authorizeProjectAccess($request, $project);

        if ($request->user()->hasRole('client')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($stage->project_id !== $project->id) {
            return response()->json(['message' => 'Stage not found on this project.'], 404);
        }

        $validated = $request->validate([
            'stage_order' => 'required|integer|min:1|max:5',
        ]);

        $this->ghl->advanceProjectStage($project, $validated['stage_order']);

        $project->load('stages');

        return StageResource::collection($project->stages);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function authorizeProjectAccess(Request $request, Project $project): void
    {
        $user = $request->user();

        if ($user->hasRole('client') && $project->client_id !== $user->id) {
            abort(403, 'Forbidden.');
        }

        if ($user->hasRole('worker') && ! $project->workers()->where('users.id', $user->id)->exists()) {
            abort(403, 'Forbidden.');
        }
    }
}
