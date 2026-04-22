<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\Project;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgreementController extends Controller
{
    public function index()
    {
        $projectIds = Project::where('client_id', auth()->id())->pluck('id');

        $agreements = Agreement::whereIn('project_id', $projectIds)
            ->whereIn('status', ['sent', 'signed'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => [
                'id'                 => $a->id,
                'type'               => $a->type,
                'title'              => $a->title,
                'client_name'        => $a->client_name,
                'status'             => $a->status,
                'total_amount'       => $a->total_amount,
                'sent_at'            => $a->sent_at?->format('j M Y'),
                'signed_at'          => $a->signed_at?->format('j M Y'),
                'project_id'         => $a->project_id,
            ]);

        return Inertia::render('Client/Agreements/Index', [
            'agreements' => $agreements,
        ]);
    }

    public function show(Agreement $agreement)
    {
        $belongs = Project::where('client_id', auth()->id())
            ->where('id', $agreement->project_id)
            ->exists();

        abort_unless($belongs, 403);
        abort_unless(in_array($agreement->status, ['sent', 'signed']), 403);

        return Inertia::render('Client/Agreements/Show', [
            'agreement' => [
                'id'                 => $agreement->id,
                'type'               => $agreement->type,
                'title'              => $agreement->title,
                'client_name'        => $agreement->client_name,
                'project_address'    => $agreement->project_address,
                'contract_reference' => $agreement->contract_reference,
                'items'              => $agreement->items ?? [],
                'total_amount'       => $agreement->total_amount,
                'notes'              => $agreement->notes,
                'status'             => $agreement->status,
                'sent_at'            => $agreement->sent_at?->format('j M Y'),
                'signed_at'          => $agreement->signed_at?->format('j M Y \a\t g:i A'),
                'signed_by_name'     => $agreement->signed_by_name,
                'signature_data'     => $agreement->signature_data,
            ],
        ]);
    }

    public function download(Agreement $agreement)
    {
        $belongs = Project::where('client_id', auth()->id())
            ->where('id', $agreement->project_id)
            ->exists();

        abort_unless($belongs, 403);
        abort_unless($agreement->status === 'signed', 404, 'Agreement not yet signed.');

        $pdf = Pdf::loadView('pdf.agreement', ['agreement' => $agreement])
            ->setPaper('a4', 'portrait');

        $filename = 'agreement-' . $agreement->id . '-' . str($agreement->title)->slug() . '.pdf';

        return $pdf->download($filename);
    }

    public function sign(Request $request, Agreement $agreement)
    {
        $belongs = Project::where('client_id', auth()->id())
            ->where('id', $agreement->project_id)
            ->exists();

        abort_unless($belongs, 403);
        abort_unless($agreement->status === 'sent', 422, 'This agreement cannot be signed.');

        $request->validate([
            'signed_by_name' => 'required|string|max:255',
            'signature_data' => 'required|string',
        ]);

        $agreement->update([
            'status'         => 'signed',
            'signed_at'      => now(),
            'signed_by_name' => $request->signed_by_name,
            'signature_data' => $request->signature_data,
            'signed_ip'      => $request->ip(),
        ]);

        return redirect()->route('client.agreements.index')
            ->with('success', 'Agreement signed successfully.');
    }
}
