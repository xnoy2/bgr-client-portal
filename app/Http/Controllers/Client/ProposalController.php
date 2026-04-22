<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Proposal;
use Inertia\Inertia;

class ProposalController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $proposals = Proposal::whereHas('project', fn ($q) => $q->where('client_id', $user->id))
            ->with('project')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'title'        => $p->title,
                'ghl_link'     => $p->ghl_link,
                'status'       => $p->status,
                'amount'       => $p->amount,
                'notes'        => $p->notes,
                'created_at'   => $p->created_at->format('j M Y'),
                'responded_at' => $p->responded_at?->format('j M Y'),
                'project_name' => $p->project?->name,
            ]);

        return Inertia::render('Client/Proposals/Index', [
            'proposals' => $proposals,
        ]);
    }
}
