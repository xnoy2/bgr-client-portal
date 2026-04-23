<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Proposal;
use App\Services\GHLService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProposalController extends Controller
{
    public function index()
    {
        $proposals = Proposal::with(['project.client', 'creator'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($p) => $this->format($p));

        $projects = Project::with('client')
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'client_name' => $p->client?->name ?? '—',
            ]);

        return Inertia::render('Admin/Proposals/Index', [
            'proposals' => $proposals,
            'projects'  => $projects,
        ]);
    }

    public function store(Request $request, GHLService $ghl)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title'      => 'required|string|max:255',
            'amount'     => 'nullable|numeric|min:0',
            'notes'      => 'nullable|string|max:1000',
        ]);

        $project = Project::with('client')->findOrFail($data['project_id']);
        $client  = $project->client;

        abort_unless($client, 422, 'This project has no linked client.');

        $templateId = config('services.ghl.proposal_template_id', '6985b3ee69026a438f3efa83');

        // Call GHL Documents & Contracts API to send the template
        $result = $ghl->sendDocumentTemplate(
            $templateId,
            $client->name,
            $client->email,
            $data['title']
        );

        if (! $result) {
            return back()->withErrors(['ghl' => 'Failed to send proposal via GHL. Please try again or check the API key scopes.']);
        }

        Proposal::create([
            'project_id'      => $data['project_id'],
            'created_by'      => auth()->id(),
            'title'           => $data['title'],
            'ghl_proposal_id' => $result['documentId'],
            'ghl_link'        => $result['documentLink'] ?? '',
            'amount'          => $data['amount'] ?? null,
            'notes'           => $data['notes'] ?? null,
            'status'          => 'sent',
        ]);

        return back()->with('success', "Proposal sent to {$client->email}.");
    }

    public function update(Request $request, Proposal $proposal)
    {
        $data = $request->validate([
            'title'    => 'sometimes|string|max:255',
            'ghl_link' => 'sometimes|url|max:500',
            'amount'   => 'nullable|numeric|min:0',
            'notes'    => 'nullable|string|max:1000',
            'status'   => 'sometimes|in:sent,viewed,accepted,declined,paid',
        ]);

        $proposal->update($data);

        return back()->with('success', 'Proposal updated.');
    }

    public function destroy(Proposal $proposal)
    {
        $proposal->delete();

        return back()->with('success', 'Proposal deleted.');
    }

    private function format(Proposal $p): array
    {
        return [
            'id'              => $p->id,
            'title'           => $p->title,
            'ghl_link'        => $p->ghl_link,
            'ghl_proposal_id' => $p->ghl_proposal_id,
            'status'          => $p->status,
            'amount'          => $p->amount,
            'notes'           => $p->notes,
            'created_at'      => $p->created_at->format('j M Y'),
            'responded_at'    => $p->responded_at?->format('j M Y'),
            'project_id'      => $p->project?->id,
            'project_name'    => $p->project?->name,
            'client_name'     => $p->project?->client?->name,
            'created_by'      => $p->creator?->name,
        ];
    }
}
