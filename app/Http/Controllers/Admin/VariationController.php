<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortalNotification;
use App\Models\Project;
use App\Models\VariationRequest;
use App\Services\GHLService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VariationController extends Controller
{
    public function __construct(private GHLService $ghl) {}

    public function index()
    {
        $variations = VariationRequest::with(['project', 'submitter', 'reviewer'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($v) => $this->format($v));

        // Projects list for "Submit on behalf of client" modal
        $opportunities = collect($this->ghl->getCachedPipelineOpportunities()['opportunities'] ?? []);
        $ghlIds        = $opportunities->pluck('id');
        $localProjects = Project::with('client')
            ->whereIn('ghl_opportunity_id', $ghlIds)
            ->whereNotNull('client_id')
            ->get()
            ->keyBy('ghl_opportunity_id');

        $projects = $opportunities
            ->filter(fn ($opp) => $localProjects->has($opp['id']))
            ->map(function ($opp) use ($localProjects) {
                $local = $localProjects->get($opp['id']);
                return [
                    'id'          => $local->id,
                    'name'        => $opp['name'],
                    'client_name' => $opp['contact']['name'] ?? $local->client?->name ?? '—',
                    'client_id'   => $local->client_id,
                ];
            })
            ->sortBy('name')
            ->values();

        return Inertia::render('Admin/Variations/Index', [
            'variations' => $variations,
            'projects'   => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'    => 'required|exists:projects,id',
            'staff_member'  => 'required|string|max:255',
            'site_location' => 'required|string|max:500',
            'description'   => 'required|string',
        ]);

        $project = Project::with('client')->findOrFail($data['project_id']);

        abort_unless($project->client_id, 422, 'This project has no client assigned.');

        VariationRequest::create([
            'project_id'    => $data['project_id'],
            'submitted_by'  => $project->client_id,
            'source'        => 'admin',
            'title'         => Str::limit($data['description'], 80),
            'staff_member'  => $data['staff_member'],
            'site_location' => $data['site_location'],
            'description'   => $data['description'],
            'status'        => 'approved',
            'reviewed_by'   => auth()->id(),
            'reviewed_at'   => now(),
        ]);

        PortalNotification::notifyUser(
            userId:  $project->client_id,
            type:    'variation_submitted',
            title:   'Variation Request Submitted',
            message: 'A variation request has been submitted for ' . $project->name . ' on your behalf.',
            url:     route('client.variations.index'),
        );

        return back()->with('success', 'Variation submitted on behalf of client.');
    }

    public function review(Request $request, VariationRequest $variation)
    {
        $data = $request->validate([
            'status'         => 'required|in:approved,rejected',
            'admin_notes'    => 'nullable|string|max:1000',
            'agreement_link' => 'nullable|url|max:500',
        ]);

        $updates = [
            'status'      => $data['status'],
            'admin_notes' => $data['admin_notes'] ?? null,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ];

        if ($data['status'] === 'approved' && ! empty($data['agreement_link'])) {
            $updates['agreement_link']   = $data['agreement_link'];
            $updates['agreement_status'] = 'pending_signature';
        }

        $variation->update($updates);

        return back()->with('success', 'Variation request ' . ($data['status'] === 'approved' ? 'approved' : 'declined') . '.');
    }

    public function attachAgreement(Request $request, VariationRequest $variation)
    {
        $data = $request->validate([
            'agreement_link' => 'required|url|max:500',
        ]);

        $variation->update([
            'agreement_link'   => $data['agreement_link'],
            'agreement_status' => 'pending_signature',
        ]);

        return back()->with('success', 'Agreement link attached.');
    }

    private function format(VariationRequest $v): array
    {
        return [
            'id'                  => $v->id,
            'title'               => $v->title,
            'staff_member'        => $v->staff_member,
            'site_location'       => $v->site_location,
            'description'         => $v->description,
            'estimated_cost'      => $v->estimated_cost,
            'status'              => $v->status,
            'source'              => $v->source,
            'admin_notes'         => $v->admin_notes,
            'submitted_at'        => $v->created_at->format('j M Y'),
            'reviewed_at'         => $v->reviewed_at?->format('j M Y'),
            'project_name'        => $v->project?->name,
            'project_id'          => $v->project?->ghl_opportunity_id,
            'submitted_by'        => $v->submitter?->name,
            'reviewed_by'         => $v->reviewer?->name,
            'agreement_link'      => $v->agreement_link,
            'agreement_status'    => $v->agreement_status,
            'agreement_signed_at' => $v->agreement_signed_at?->format('j M Y'),
        ];
    }
}
