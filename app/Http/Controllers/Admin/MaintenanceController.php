<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceEnquiry;
use App\Models\MaintenancePlan;
use App\Models\MaintenanceSubscription;
use App\Models\PortalNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaintenanceController extends Controller
{
    public function index()
    {
        $enquiries = MaintenanceEnquiry::with('client:id,name,email')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($e) => [
                'id'          => $e->id,
                'client'      => $e->client,
                'plan'        => $e->plan,
                'message'     => $e->message,
                'status'      => $e->status,
                'admin_notes' => $e->admin_notes,
                'created_at'  => $e->created_at->diffForHumans(),
            ]);

        $subscriptions = MaintenanceSubscription::with('client:id,name,email')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($s) => [
                'id'           => $s->id,
                'client'       => $s->client,
                'plan'         => $s->plan,
                'status'       => $s->status,
                'start_date'   => $s->start_date?->format('Y-m-d'),
                'renewal_date' => $s->renewal_date?->format('Y-m-d'),
                'notes'        => $s->notes,
                'created_at'   => $s->created_at->diffForHumans(),
            ]);

        $plans = MaintenancePlan::orderBy('sort_order')->get()
            ->map(fn ($p) => [
                'id'         => $p->id,
                'name'       => $p->name,
                'slug'       => $p->slug,
                'price'      => $p->price,
                'is_popular' => $p->is_popular,
                'is_active'  => $p->is_active,
                'sort_order' => $p->sort_order,
                'features'   => $p->features ?? [],
            ]);

        $clients = User::role('client')->select('id', 'name', 'email')->orderBy('name')->get();

        return Inertia::render('Admin/Maintenance/Index', compact('enquiries', 'subscriptions', 'plans', 'clients'));
    }

    // ── Enquiries ─────────────────────────────────────────────────────────────

    public function updateEnquiry(Request $request, MaintenanceEnquiry $enquiry)
    {
        $data = $request->validate([
            'status'      => 'required|in:pending,reviewed',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $enquiry->update($data);

        return back()->with('success', 'Enquiry updated.');
    }

    public function convertEnquiry(Request $request, MaintenanceEnquiry $enquiry)
    {
        $data = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $startDate   = now()->toDateString();
        $renewalDate = now()->addYear()->toDateString();

        MaintenanceSubscription::create([
            'client_id'    => $enquiry->client_id,
            'plan'         => $enquiry->plan,
            'status'       => 'active',
            'start_date'   => $startDate,
            'renewal_date' => $renewalDate,
            'notes'        => $data['notes'] ?? null,
        ]);

        $enquiry->update(['status' => 'converted']);

        $plan = MaintenancePlan::where('slug', $enquiry->plan)->first();

        PortalNotification::notifyUser(
            userId:  $enquiry->client_id,
            type:    'maintenance_subscription',
            title:   'Maintenance Plan Activated',
            message: 'Your ' . ($plan?->name ?? ucfirst($enquiry->plan)) . ' maintenance plan has been activated.',
            url:     route('client.maintenance.index'),
        );

        return back()->with('success', 'Subscription created and client notified.');
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────

    public function storeSubscription(Request $request)
    {
        $slugs = MaintenancePlan::pluck('slug')->toArray();

        $data = $request->validate([
            'client_id'    => 'required|exists:users,id',
            'plan'         => 'required|in:' . implode(',', $slugs),
            'status'       => 'required|in:active,paused,cancelled',
            'start_date'   => 'nullable|date',
            'renewal_date' => 'nullable|date',
            'notes'        => 'nullable|string|max:1000',
        ]);

        MaintenanceSubscription::create($data);

        $plan = MaintenancePlan::where('slug', $data['plan'])->first();

        PortalNotification::notifyUser(
            userId:  $data['client_id'],
            type:    'maintenance_subscription',
            title:   'Maintenance Plan Activated',
            message: 'Your ' . ($plan->name ?? ucfirst($data['plan'])) . ' maintenance plan has been activated.',
            url:     route('client.maintenance.index'),
        );

        return back()->with('success', 'Subscription created.');
    }

    public function updateSubscription(Request $request, MaintenanceSubscription $subscription)
    {
        $slugs = MaintenancePlan::pluck('slug')->toArray();

        $data = $request->validate([
            'plan'         => 'required|in:' . implode(',', $slugs),
            'status'       => 'required|in:active,paused,cancelled',
            'start_date'   => 'nullable|date',
            'renewal_date' => 'nullable|date',
            'notes'        => 'nullable|string|max:1000',
        ]);

        $subscription->update($data);

        return back()->with('success', 'Subscription updated.');
    }

    public function destroySubscription(MaintenanceSubscription $subscription)
    {
        $subscription->delete();

        return back()->with('success', 'Subscription removed.');
    }

    // ── Plans ─────────────────────────────────────────────────────────────────

    public function storePlan(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'slug'       => 'required|string|max:100|unique:maintenance_plans,slug|regex:/^[a-z0-9-]+$/',
            'price'      => 'required|integer|min:0',
            'is_popular' => 'boolean',
            'is_active'  => 'boolean',
            'sort_order' => 'integer|min:0',
            'features'   => 'array',
            'features.*' => 'string|max:200',
        ]);

        MaintenancePlan::create($data);

        return back()->with('success', 'Plan created.');
    }

    public function updatePlan(Request $request, MaintenancePlan $plan)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'slug'       => 'required|string|max:100|unique:maintenance_plans,slug,' . $plan->id . '|regex:/^[a-z0-9-]+$/',
            'price'      => 'required|integer|min:0',
            'is_popular' => 'boolean',
            'is_active'  => 'boolean',
            'sort_order' => 'integer|min:0',
            'features'   => 'array',
            'features.*' => 'string|max:200',
        ]);

        $plan->update($data);

        return back()->with('success', 'Plan updated.');
    }

    public function destroyPlan(MaintenancePlan $plan)
    {
        $plan->delete();

        return back()->with('success', 'Plan deleted.');
    }
}
