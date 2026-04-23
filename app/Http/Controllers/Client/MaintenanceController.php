<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceEnquiry;
use App\Models\MaintenancePlan;
use App\Models\PortalNotification;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function enquire(Request $request)
    {
        $slugs = MaintenancePlan::where('is_active', true)->pluck('slug')->toArray();

        $data = $request->validate([
            'plan'    => 'required|in:' . implode(',', $slugs),
            'message' => 'nullable|string|max:1000',
        ]);

        $client = auth()->user();
        $plan   = MaintenancePlan::where('slug', $data['plan'])->firstOrFail();

        MaintenanceEnquiry::create([
            'client_id' => $client->id,
            'plan'      => $data['plan'],
            'message'   => $data['message'] ?? null,
        ]);

        PortalNotification::notifyAdmins(
            type:    'maintenance_enquiry',
            title:   'Maintenance Plan Enquiry',
            message: $client->name . ' enquired about the ' . $plan->name . ' plan (£' . number_format($plan->price) . '/yr)',
            url:     route('admin.maintenance.index'),
        );

        return back()->with('success', 'Your enquiry has been sent. We\'ll be in touch shortly.');
    }
}
