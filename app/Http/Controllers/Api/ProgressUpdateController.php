<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgressUpdateResource;
use App\Models\MediaFile;
use App\Models\ProgressUpdate;
use App\Models\Project;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;

class ProgressUpdateController extends Controller
{
    /**
     * GET /api/projects/{project}/updates
     *
     * Admin/Worker: all updates for the project.
     * Client:       published updates only.
     */
    public function index(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project);

        $query = ProgressUpdate::with(['author', 'stage'])
            ->where('project_id', $project->id);

        if ($request->user()->hasRole('client')) {
            $query->where('is_published', true);
        }

        $query->when($request->stage_id, fn ($q) => $q->where('stage_id', $request->stage_id))
              ->orderByDesc('created_at');

        return ProgressUpdateResource::collection($query->paginate(20));
    }

    /**
     * POST /api/projects/{project}/updates
     *
     * Worker / Admin only.
     */
    public function store(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project);

        if ($request->user()->hasRole('client')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'body'     => 'required|string|max:5000',
            'stage_id' => 'nullable|integer|exists:project_stages,id',
            'photos'   => 'nullable|array|max:10',
            'photos.*' => 'file|mimes:jpg,jpeg,png,webp,heic|max:10240',
        ]);

        $photoUrls = $this->uploadPhotos($request, $project, 'photos');

        $update = ProgressUpdate::create([
            'project_id'   => $project->id,
            'user_id'      => $request->user()->id,
            'stage_id'     => $validated['stage_id'] ?? null,
            'title'        => $validated['title'],
            'body'         => $validated['body'],
            'photos'       => $photoUrls ?: null,
            'is_published' => true,
            'visibility'   => 'client',
            'published_at' => now(),
        ]);

        return new ProgressUpdateResource($update->load(['author', 'stage']));
    }

    /**
     * GET /api/projects/{project}/updates/{update}
     */
    public function show(Request $request, Project $project, ProgressUpdate $update)
    {
        $this->authorizeProjectAccess($request, $project);
        $this->authorizeUpdateBelongsToProject($update, $project);

        if ($request->user()->hasRole('client') && ! $update->is_published) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return new ProgressUpdateResource($update->load(['author', 'stage']));
    }

    /**
     * PUT /api/projects/{project}/updates/{update}
     *
     * Worker: own updates only.
     * Admin:  any update.
     */
    public function update(Request $request, Project $project, ProgressUpdate $update)
    {
        $this->authorizeProjectAccess($request, $project);
        $this->authorizeUpdateBelongsToProject($update, $project);

        $user = $request->user();

        if ($user->hasRole('client')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->hasRole('worker') && $update->user_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your own updates.'], 403);
        }

        $validated = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'body'          => 'sometimes|string|max:5000',
            'stage_id'      => 'nullable|integer|exists:project_stages,id',
            'kept_photos'   => 'nullable|array',
            'kept_photos.*' => 'string',
            'new_photos'    => 'nullable|array|max:10',
            'new_photos.*'  => 'file|mimes:jpg,jpeg,png,webp,heic|max:10240',
        ]);

        $photoUrls = array_merge(
            $validated['kept_photos'] ?? [],
            $this->uploadPhotos($request, $project, 'new_photos')
        );

        $update->update([
            'title'    => $validated['title']    ?? $update->title,
            'body'     => $validated['body']     ?? $update->body,
            'stage_id' => array_key_exists('stage_id', $validated) ? $validated['stage_id'] : $update->stage_id,
            'photos'   => $photoUrls ?: null,
        ]);

        return new ProgressUpdateResource($update->load(['author', 'stage']));
    }

    /**
     * DELETE /api/projects/{project}/updates/{update}
     *
     * Worker: own updates only.
     * Admin:  any update.
     */
    public function destroy(Request $request, Project $project, ProgressUpdate $update)
    {
        $this->authorizeProjectAccess($request, $project);
        $this->authorizeUpdateBelongsToProject($update, $project);

        $user = $request->user();

        if ($user->hasRole('client')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->hasRole('worker') && $update->user_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your own updates.'], 403);
        }

        $update->delete();

        return response()->json(['message' => 'Update deleted.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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

    private function authorizeUpdateBelongsToProject(ProgressUpdate $update, Project $project): void
    {
        if ($update->project_id !== $project->id) {
            abort(404, 'Update not found on this project.');
        }
    }

    private function uploadPhotos(Request $request, Project $project, string $field): array
    {
        $urls = [];
        foreach ($request->file($field, []) as $file) {
            $result = Cloudinary::uploadApi()->upload($file->getRealPath(), [
                'folder'        => "bgr/project-updates/{$project->id}",
                'resource_type' => 'image',
                'quality'       => 'auto',
                'fetch_format'  => 'auto',
            ]);

            $urls[] = $result['secure_url'];

            MediaFile::create([
                'project_id'        => $project->id,
                'user_id'           => $request->user()->id,
                'original_filename' => $file->getClientOriginalName(),
                'url'               => $result['secure_url'],
                'ghl_file_id'       => $result['public_id'],
                'resource_type'     => 'photo',
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
            ]);
        }
        return $urls;
    }
}
