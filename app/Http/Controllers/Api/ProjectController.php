<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * GET /api/projects
     * Admin: all projects.
     * Worker: assigned projects only.
     * Client: own projects only.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Project::with(['client', 'workers', 'stages'])
            ->withCount('stages');

        if ($user->hasRole('client')) {
            $query->where('client_id', $user->id);
        } elseif ($user->hasRole('worker')) {
            $query->whereHas('workers', fn ($q) => $q->where('users.id', $user->id));
        }

        $query->when($request->status, fn ($q) => $q->where('status', $request->status))
              ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"));

        return ProjectResource::collection(
            $query->orderByDesc('created_at')->paginate(15)
        );
    }

    /**
     * POST /api/projects
     * Admin only.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                 => 'required|string|max:255',
            'client_id'            => 'required|exists:users,id',
            'description'          => 'nullable|string',
            'address'              => 'nullable|string|max:255',
            'start_date'           => 'nullable|date',
            'estimated_completion' => 'nullable|date|after_or_equal:start_date',
            'status'               => 'in:pending,active,on_hold,completed,cancelled',
        ]);

        $project = Project::create($request->validated());

        // Auto-create the 5 default stages
        foreach (Project::defaultStageNames() as $i => $name) {
            $project->stages()->create([
                'name'  => $name,
                'order' => $i + 1,
                'status' => 'pending',
            ]);
        }

        return new ProjectResource($project->load(['client', 'workers', 'stages']));
    }

    /**
     * GET /api/projects/{project}
     */
    public function show(Request $request, Project $project)
    {
        $user = $request->user();

        if ($user->hasRole('client') && $project->client_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->hasRole('worker') && ! $project->workers->contains($user->id)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return new ProjectResource(
            $project->load(['client', 'workers', 'stages'])
        );
    }

    /**
     * PUT /api/projects/{project}
     * Admin only.
     */
    public function update(Request $request, Project $project)
    {
        $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'description'          => 'nullable|string',
            'address'              => 'nullable|string|max:255',
            'status'               => 'sometimes|in:pending,active,on_hold,completed,cancelled',
            'start_date'           => 'nullable|date',
            'estimated_completion' => 'nullable|date',
            'client_id'            => 'sometimes|exists:users,id',
        ]);

        $project->update($request->validated());

        return new ProjectResource($project->load(['client', 'workers', 'stages']));
    }

    /**
     * DELETE /api/projects/{project}
     * Admin only — sets status to cancelled.
     */
    public function destroy(Project $project)
    {
        $project->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Project cancelled.']);
    }
}
