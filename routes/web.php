<?php

use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\UpdateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\AgreementController as AdminAgreementController;
use App\Http\Controllers\Admin\PortalDocumentController;
use App\Http\Controllers\Admin\ProposalController as AdminProposalController;
use App\Http\Controllers\Admin\VariationController as AdminVariationController;
use App\Http\Controllers\Admin\MaintenanceController as AdminMaintenanceController;
use App\Http\Controllers\Client\AgreementController as ClientAgreementController;
use App\Http\Controllers\Client\DocumentController as ClientDocumentController;
use App\Http\Controllers\Client\ProposalController as ClientProposalController;
use App\Http\Controllers\Client\ProjectController as ClientProjectController;
use App\Http\Controllers\Client\VariationController as ClientVariationController;
use App\Http\Controllers\Worker\ProjectController as WorkerProjectController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\ProfileController;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

//â”€â”€â”€ First-login password change â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Route::middleware('auth')
    ->group(function () {
        Route::get('/change-password', [ChangePasswordController::class, 'show'])
            ->name('password.change');
        Route::post('/change-password', [ChangePasswordController::class, 'update'])
            ->name('password.change.update');
    });

// Landing + post-login redirect â€” both / and /dashboard route here
Route::middleware('auth')->get('/dashboard', function () {
    $user = auth()->user();
    if ($user->hasRole('admin'))  return redirect()->route('admin.dashboard');
    if ($user->hasRole('worker')) return redirect()->route('worker.dashboard');
    if ($user->hasRole('client')) return redirect()->route('client.dashboard');
    return redirect()->route('login');
})->name('dashboard');

Route::get('/', function () {
    if (auth()->check()) return redirect()->route('dashboard');
    return redirect()->route('login');
});

// â”€â”€â”€ Profile routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Notifications
    Route::post('/notifications/read-all', function () {
        \App\Models\PortalNotification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return back();
    })->name('notifications.read-all');

    Route::post('/notifications/{notification}/read', function (\App\Models\PortalNotification $notification) {
        abort_if($notification->user_id !== auth()->id(), 403);
        $notification->update(['read_at' => now()]);
        return back();
    })->name('notifications.read');

    // Authenticated media proxy — streams files from Azure Blob (private container)
    Route::get('/media/photo/{mediaFile}',    [\App\Http\Controllers\MediaController::class, 'photo'])   ->name('media.photo');
    Route::get('/media/document/{document}',  [\App\Http\Controllers\MediaController::class, 'document'])->name('media.document');
});

require __DIR__.'/auth.php';
// Temporary: one-click Cloudinary cleanup (admin only, remove after use)
Route::middleware(['auth', 'role:admin'])
    ->get('/admin/tools/clean-cloudinary', function () {
        Artisan::call('media:clean-cloudinary');
        $output = Artisan::output();
        return response('<pre style="font-family:monospace;padding:2rem;font-size:14px;">'
            . '<strong>Cloudinary Cleanup Result:</strong><br><br>'
            . e($output)
            . '<br><br><a href="/admin/dashboard">Back to Dashboard</a></pre>');
    })->name('admin.tools.clean-cloudinary');

// Temporary: document diagnostic (admin only, remove after use)
Route::middleware(['auth', 'role:admin'])
    ->get('/admin/tools/check-doc/{id}', function ($id) {
        $doc = \App\Models\Document::withTrashed()->find($id);
        if (! $doc) {
            return response()->json(['error' => 'Document ' . $id . ' NOT FOUND in database']);
        }
        return response()->json([
            'id'           => $doc->id,
            'filename'     => $doc->filename,
            'storage_path' => $doc->storage_path,
            'storage_disk' => $doc->storage_disk,
            'url'          => $doc->url,
            'project_id'   => $doc->project_id,
            'deleted_at'   => $doc->deleted_at,
            'r2_key'       => config('filesystems.disks.r2.key') ? 'SET (' . strlen(config('filesystems.disks.r2.key')) . ' chars)' : 'NOT SET',
            'r2_endpoint'  => config('filesystems.disks.r2.endpoint') ?? 'NOT SET',
            'r2_bucket'    => config('filesystems.disks.r2.bucket') ?? 'NOT SET',
        ]);
    });



// â”€â”€â”€ Admin routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Route::middleware(['auth', 'password.changed', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Admin/Dashboard', [
                'stats' => [
                    'total_users'    => \App\Models\User::count(),
                    'total_workers'  => \App\Models\User::role('worker')->count(),
                    'total_clients'  => \App\Models\User::role('client')->count(),
                    'total_projects' => \App\Models\Project::count(),
                ],
            ]);
        })->name('dashboard');

        // User management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->name('users.reset-password');

        // Updates feed
        Route::get('/updates', [UpdateController::class, 'index'])->name('updates.index');

        // Variation requests
        Route::get('/variations',                                      [AdminVariationController::class, 'index'])->name('variations.index');
        Route::put('/variations/{variation}/review',                   [AdminVariationController::class, 'review'])->name('variations.review');
        Route::put('/variations/{variation}/attach-agreement',         [AdminVariationController::class, 'attachAgreement'])->name('variations.attach-agreement');

        // Agreements (in-app document signing)
        Route::get('/agreements',                                          [AdminAgreementController::class, 'index'])->name('agreements.index');
        Route::post('/agreements',                                         [AdminAgreementController::class, 'store'])->name('agreements.store');
        // Portal documents (Terms & Conditions / Others) — must be before {agreement} wildcard routes
        Route::post('/agreements/documents/{category}',                    [PortalDocumentController::class, 'store'])->name('agreements.documents.store');
        Route::delete('/agreements/documents/{portalDocument}',            [PortalDocumentController::class, 'destroy'])->name('agreements.documents.destroy');
        Route::get('/agreements/documents/{portalDocument}/download',      [PortalDocumentController::class, 'download'])->name('agreements.documents.download');
        Route::put('/agreements/{agreement}',                              [AdminAgreementController::class, 'update'])->name('agreements.update');
        Route::post('/agreements/{agreement}/send',                        [AdminAgreementController::class, 'send'])->name('agreements.send');
        Route::get('/agreements/{agreement}/download',                     [AdminAgreementController::class, 'download'])->name('agreements.download');
        Route::delete('/agreements/{agreement}',                           [AdminAgreementController::class, 'destroy'])->name('agreements.destroy');

        // Proposals
        Route::get('/proposals',                    [AdminProposalController::class, 'index'])->name('proposals.index');
        Route::post('/proposals',                   [AdminProposalController::class, 'store'])->name('proposals.store');
        Route::put('/proposals/{proposal}',         [AdminProposalController::class, 'update'])->name('proposals.update');
        Route::delete('/proposals/{proposal}',      [AdminProposalController::class, 'destroy'])->name('proposals.destroy');

        // Maintenance enquiries & subscriptions
        Route::get('/maintenance',                                           [AdminMaintenanceController::class, 'index'])->name('maintenance.index');
        Route::put('/maintenance/enquiries/{enquiry}',                       [AdminMaintenanceController::class, 'updateEnquiry'])->name('maintenance.enquiries.update');
        Route::post('/maintenance/enquiries/{enquiry}/convert',               [AdminMaintenanceController::class, 'convertEnquiry'])->name('maintenance.enquiries.convert');
        Route::post('/maintenance/subscriptions',                            [AdminMaintenanceController::class, 'storeSubscription'])->name('maintenance.subscriptions.store');
        Route::put('/maintenance/subscriptions/{subscription}',              [AdminMaintenanceController::class, 'updateSubscription'])->name('maintenance.subscriptions.update');
        Route::delete('/maintenance/subscriptions/{subscription}',           [AdminMaintenanceController::class, 'destroySubscription'])->name('maintenance.subscriptions.destroy');
        Route::post('/maintenance/plans',                                        [AdminMaintenanceController::class, 'storePlan'])->name('maintenance.plans.store');
        Route::put('/maintenance/plans/{plan}',                                  [AdminMaintenanceController::class, 'updatePlan'])->name('maintenance.plans.update');
        Route::delete('/maintenance/plans/{plan}',                               [AdminMaintenanceController::class, 'destroyPlan'])->name('maintenance.plans.destroy');

        // Project management â€” {ghlId} is the GHL opportunity ID (string)
        Route::get('/projects',                            [ProjectController::class, 'index'])->name('projects.index');
        Route::post('/projects/refresh-pipeline',          [ProjectController::class, 'refreshPipeline'])->name('projects.refresh-pipeline');
        Route::get('/projects/{ghlId}',                    [ProjectController::class, 'show'])->name('projects.show');
        Route::put('/projects/{ghlId}',                    [ProjectController::class, 'update'])->name('projects.update');
        Route::put('/projects/{ghlId}/stage',              [ProjectController::class, 'updateStage'])->name('projects.stage.update');
        Route::post('/projects/{ghlId}/refresh-ghl',       [ProjectController::class, 'refreshGHL'])->name('projects.refresh-ghl');
        Route::post('/projects/{ghlId}/documents',                        [ProjectController::class, 'uploadDocument'])->name('projects.documents.upload');
        Route::delete('/projects/{ghlId}/documents/{document}',           [ProjectController::class, 'deleteDocument'])->name('projects.documents.delete');
        Route::get('/projects/{ghlId}/documents/{document}/download',     [ProjectController::class, 'downloadDocument'])->name('projects.documents.download');
    });

// â”€â”€â”€ Worker routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Route::middleware(['auth', 'password.changed', 'role:worker|admin'])
    ->prefix('worker')
    ->name('worker.')
    ->group(function () {
        Route::get('/dashboard',                       [WorkerProjectController::class, 'index'])->name('dashboard');
        Route::get('/projects/{ghlId}',                [WorkerProjectController::class, 'show'])->name('projects.show');
        Route::put('/projects/{ghlId}/stage',          [WorkerProjectController::class, 'updateStage'])->name('projects.stage.update');
        Route::post('/projects/{ghlId}/update',            [WorkerProjectController::class, 'postUpdate'])->name('projects.update.post');
        Route::put('/projects/{ghlId}/updates/{updateId}', [WorkerProjectController::class, 'editUpdate'])->name('projects.update.edit');
    });

// â”€â”€â”€ Client portal routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Route::middleware(['auth', 'password.changed', 'role:client'])
    ->prefix('portal')
    ->name('client.')
    ->group(function () {
        Route::get('/dashboard',                          [ClientProjectController::class, 'index'])->name('dashboard');
        Route::get('/projects/{ghlId}',                   [ClientProjectController::class, 'show'])->name('projects.show');
        Route::get('/variations',                         [ClientVariationController::class, 'index'])->name('variations.index');
        Route::post('/variations',                        [ClientVariationController::class, 'store'])->name('variations.store');
        Route::post('/variations/{variation}/update',     [ClientVariationController::class, 'update'])->name('variations.update');
        Route::get('/proposals',                          [ClientProposalController::class, 'index'])->name('proposals.index');
        Route::get('/agreements',                         [ClientAgreementController::class, 'index'])->name('agreements.index');
        Route::get('/agreements/{agreement}',             [ClientAgreementController::class, 'show'])->name('agreements.show');
        Route::get('/agreements/{agreement}/download',    [ClientAgreementController::class, 'download'])->name('agreements.download');
        Route::post('/agreements/{agreement}/sign',       [ClientAgreementController::class, 'sign'])->name('agreements.sign');
        Route::get('/documents',                                        [ClientDocumentController::class, 'index'])->name('documents.index');
        Route::get('/documents/{document}/download',                    [ClientDocumentController::class, 'download'])->name('documents.download');
        Route::post('/documents/{document}/sign',                       [ClientDocumentController::class, 'sign'])->name('documents.sign');
        Route::get('/portal-documents/{portalDocument}/download',       [ClientDocumentController::class, 'downloadPortalDocument'])->name('portal-documents.download');

        // Maintenance plans
        Route::get('/maintenance', function () {
            $plans = \App\Models\MaintenancePlan::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($p) => [
                    'id'       => $p->id,
                    'key'      => $p->slug,
                    'name'     => $p->name,
                    'price'    => $p->price,
                    'popular'  => $p->is_popular,
                    'features' => collect($p->features ?? [])->map(fn ($f) => ['label' => $f])->values()->all(),
                ]);
            $subscription = \App\Models\MaintenanceSubscription::where('client_id', auth()->id())
                ->whereIn('status', ['active', 'paused'])
                ->orderByDesc('created_at')
                ->first();
            $subPlan = $subscription ? \App\Models\MaintenancePlan::where('slug', $subscription->plan)->first() : null;
            return \Inertia\Inertia::render('Client/Maintenance/Index', [
                'plans'        => $plans,
                'subscription' => $subscription ? [
                    'plan'         => $subscription->plan,
                    'plan_name'    => $subPlan?->name ?? ucfirst($subscription->plan),
                    'price'        => $subPlan ? '£' . number_format($subPlan->price) . '/yr' : null,
                    'status'       => $subscription->status,
                    'renewal_date' => $subscription->renewal_date?->format('d M Y'),
                ] : null,
            ]);
        })->name('maintenance.index');
        Route::post('/maintenance/enquire', [\App\Http\Controllers\Client\MaintenanceController::class, 'enquire'])->name('maintenance.enquire');
    });