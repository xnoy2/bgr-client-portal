<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\PortalDocument;
use App\Models\PortalNotification;
use App\Models\Project;
use App\Models\VariationRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgreementController extends Controller
{
    public function index()
    {
        $agreements = Agreement::with(['project.client', 'creator', 'variationRequest'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => $this->format($a));

        $projects = Project::with('client')
            ->whereNotNull('client_id')
            ->whereNotIn('status', ['cancelled'])
            ->orderByDesc('id')
            ->get()
            ->unique(fn ($p) => $p->name . '|' . $p->client_id)
            ->sortBy('name')
            ->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'client_name' => $p->client?->name ?? '—',
                'address'     => $p->address ?? '',
            ])
            ->values();

        $variations = VariationRequest::with('project')
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($v) => [
                'id'             => $v->id,
                'title'          => $v->title,
                'project_id'     => $v->project_id,
                'description'    => $v->description,
                'estimated_cost' => $v->estimated_cost,
            ]);

        $portalDocs = PortalDocument::orderByDesc('created_at')
            ->get()
            ->map(fn ($d) => [
                'id'            => $d->id,
                'category'      => $d->category,
                'project_id'    => $d->project_id,
                'original_name' => $d->original_name,
                'mime_type'     => $d->mime_type,
                'file_size'     => $d->file_size,
                'uploaded_at'   => $d->created_at->format('j M Y'),
            ])
            ->values();

        return Inertia::render('Admin/Agreements/Index', [
            'agreements'    => $agreements,
            'projects'      => $projects,
            'variations'    => $variations,
            'portalDocs'    => $portalDocs,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'           => 'required|exists:projects,id',
            'variation_request_id' => 'nullable|exists:variation_requests,id',
            'title'                => 'required|string|max:255',
            'client_name'          => 'required|string|max:255',
            'project_address'      => 'nullable|string|max:500',
            'contract_reference'   => 'nullable|string|max:255',
            'items'                => 'nullable|array',
            'items.*.description'  => 'required|string|max:500',
            'items.*.price'        => 'required|numeric|min:0',
            'total_amount'         => 'nullable|numeric|min:0',
            'notes'                => 'nullable|string|max:2000',
            'send_now'             => 'boolean',
        ]);

        $sendNow = (bool) ($data['send_now'] ?? false);

        $project = Project::with('client')->findOrFail($data['project_id']);

        Agreement::create([
            'project_id'           => $data['project_id'],
            'variation_request_id' => $data['variation_request_id'] ?? null,
            'created_by'           => auth()->id(),
            'title'                => $data['title'],
            'client_name'          => $data['client_name'],
            'project_address'      => $data['project_address'] ?? null,
            'contract_reference'   => $data['contract_reference'] ?? null,
            'items'                => $data['items'] ?? [],
            'total_amount'         => $data['total_amount'] ?? null,
            'notes'                => $data['notes'] ?? null,
            'status'               => $sendNow ? 'sent' : 'draft',
            'sent_at'              => $sendNow ? now() : null,
        ]);

        if ($sendNow && $project->client_id) {
            PortalNotification::notifyUser(
                userId:  $project->client_id,
                type:    'agreement_sent',
                title:   'Agreement Ready to Sign',
                message: 'A new agreement "' . $data['title'] . '" has been sent for your signature.',
                url:     route('client.agreements.index'),
            );
        }

        $msg = $sendNow ? 'Agreement created and sent to client.' : 'Agreement saved as draft.';

        return back()->with('success', $msg);
    }

    public function update(Request $request, Agreement $agreement)
    {
        abort_if($agreement->status === 'signed', 422, 'Cannot edit a signed agreement.');

        $data = $request->validate([
            'title'              => 'sometimes|string|max:255',
            'client_name'        => 'sometimes|string|max:255',
            'project_address'    => 'nullable|string|max:500',
            'contract_reference' => 'nullable|string|max:255',
            'items'              => 'nullable|array',
            'items.*.description'=> 'required|string|max:500',
            'items.*.price'      => 'required|numeric|min:0',
            'total_amount'       => 'nullable|numeric|min:0',
            'notes'              => 'nullable|string|max:2000',
        ]);

        $agreement->update($data);

        return back()->with('success', 'Agreement updated.');
    }

    public function send(Agreement $agreement)
    {
        abort_if($agreement->status === 'signed', 422, 'Agreement already signed.');

        $agreement->update(['status' => 'sent', 'sent_at' => now()]);

        $clientId = $agreement->project?->client_id;
        if ($clientId) {
            PortalNotification::notifyUser(
                userId:  $clientId,
                type:    'agreement_sent',
                title:   'Agreement Ready to Sign',
                message: 'A new agreement "' . $agreement->title . '" has been sent for your signature.',
                url:     route('client.agreements.index'),
            );
        }

        return back()->with('success', 'Agreement sent to client.');
    }

    public function destroy(Agreement $agreement)
    {
        abort_if($agreement->status === 'signed', 422, 'Cannot delete a signed agreement.');

        $agreement->delete();

        return back()->with('success', 'Agreement deleted.');
    }

    public function download(Agreement $agreement)
    {
        abort_unless($agreement->status === 'signed', 404, 'Agreement not yet signed.');

        $pdf = Pdf::loadView('pdf.agreement', ['agreement' => $agreement])
            ->setPaper('a4', 'portrait');

        $filename = 'agreement-' . $agreement->id . '-' . str($agreement->title)->slug() . '.pdf';

        return $pdf->download($filename);
    }

    private function format(Agreement $a): array
    {
        return [
            'id'                   => $a->id,
            'title'                => $a->title,
            'client_name'          => $a->client_name,
            'project_address'      => $a->project_address,
            'contract_reference'   => $a->contract_reference,
            'items'                => $a->items ?? [],
            'total_amount'         => $a->total_amount,
            'notes'                => $a->notes,
            'status'               => $a->status,
            'sent_at'              => $a->sent_at?->format('j M Y'),
            'signed_at'            => $a->signed_at?->format('j M Y'),
            'signed_by_name'       => $a->signed_by_name,
            'signature_data'       => $a->signature_data,
            'project_id'           => $a->project?->id,
            'project_name'         => $a->project?->name,
            'variation_request_id' => $a->variation_request_id,
            'created_at'           => $a->created_at->format('j M Y'),
            'created_by'           => $a->creator?->name,
        ];
    }
}
