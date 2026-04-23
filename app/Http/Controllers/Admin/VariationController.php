<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VariationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariationController extends Controller
{
    public function index()
    {
        $variations = VariationRequest::with(['project', 'submitter', 'reviewer'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($v) => [
                'id'             => $v->id,
                'title'          => $v->title,
                'staff_member'   => $v->staff_member,
                'site_location'  => $v->site_location,
                'description'    => $v->description,
                'estimated_cost' => $v->estimated_cost,
                'status'         => $v->status,
                'admin_notes'    => $v->admin_notes,
                'submitted_at'   => $v->created_at->format('j M Y'),
                'reviewed_at'    => $v->reviewed_at?->format('j M Y'),
                'project_name'   => $v->project?->name,
                'project_id'     => $v->project?->ghl_opportunity_id,
                'submitted_by'       => $v->submitter?->name,
                'reviewed_by'        => $v->reviewer?->name,
                'agreement_link'     => $v->agreement_link,
                'agreement_status'   => $v->agreement_status,
                'agreement_signed_at' => $v->agreement_signed_at?->format('j M Y'),
            ]);

        return Inertia::render('Admin/Variations/Index', [
            'variations' => $variations,
        ]);
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
}
