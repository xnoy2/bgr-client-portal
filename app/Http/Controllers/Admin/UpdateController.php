<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProgressUpdate;
use Inertia\Inertia;

class UpdateController extends Controller
{
    public function index()
    {
        $updates = ProgressUpdate::with(['project', 'stage', 'author'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($u) => [
                'id'           => $u->id,
                'title'        => $u->title,
                'body'         => $u->body,
                'photos'       => $u->photos ?? [],
                'is_published' => $u->is_published,
                'date'         => $u->created_at->format('j M'),
                'project_name' => $u->project?->name,
                'project_id'   => $u->project?->ghl_opportunity_id,
                'stage_name'   => $u->stage?->name,
                'author_name'  => $u->author?->name,
            ]);

        return Inertia::render('Admin/Updates/Index', [
            'updates' => $updates,
        ]);
    }
}
