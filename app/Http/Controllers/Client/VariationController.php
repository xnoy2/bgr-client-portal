<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\VariationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariationController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $variations = VariationRequest::where('submitted_by', $user->id)
            ->with('project')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($v) => [
                'id'             => $v->id,
                'title'          => $v->title,
                'description'    => $v->description,
                'estimated_cost' => $v->estimated_cost,
                'status'         => $v->status,
                'admin_notes'    => $v->admin_notes,
                'submitted_at'        => $v->created_at->format('j M Y'),
                'project_name'        => $v->project?->name,
                'project_id'          => $v->project?->ghl_opportunity_id,
                'agreement_link'      => $v->agreement_link,
                'agreement_status'    => $v->agreement_status,
                'agreement_signed_at' => $v->agreement_signed_at?->format('j M Y'),
            ]);

        $projects = Project::where('client_id', $user->id)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Client/Variations/Index', [
            'variations' => $variations,
            'projects'   => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'     => 'required|exists:projects,id',
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'estimated_cost' => 'nullable|numeric|min:0',
        ]);

        Project::where('id', $data['project_id'])
            ->where('client_id', auth()->id())
            ->firstOrFail();

        VariationRequest::create([
            'project_id'     => $data['project_id'],
            'submitted_by'   => auth()->id(),
            'title'          => $data['title'],
            'description'    => $data['description'],
            'estimated_cost' => $data['estimated_cost'] ?? null,
            'status'         => 'pending',
        ]);

        return back()->with('success', 'Variation request submitted successfully.');
    }
}
