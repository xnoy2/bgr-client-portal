<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\User;
use App\Models\VariationRequest;
use App\Services\ClientProvisioningService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class GHLWebhookController extends Controller
{
    public function __construct(private ClientProvisioningService $clientProvisioning) {}

    // Called by GHL Workflow → Webhook action after "Form Submitted" trigger
    public function handleVariationForm(Request $request): Response
    {
        $payload = $request->json()->all();

        Log::info('GHL VariationForm webhook received', ['payload' => $payload]);

        // GHL workflow webhooks send contact data at the top level (no 'type' field)
        $email = $payload['email']
            ?? $payload['contact_email']
            ?? ($payload['contact']['email'] ?? null)
            ?? null;

        if (! $email) {
            Log::warning('GHL VariationForm: missing email', ['payload' => $payload]);
            return response('Missing email', 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            Log::warning('GHL VariationForm: no user found', ['email' => $email]);
            return response('User not found', 404);
        }

        // Deduplicate by submission ID if GHL provides one
        $submissionId = $payload['submission_id'] ?? $payload['submissionId'] ?? null;
        if ($submissionId && VariationRequest::where('ghl_submission_id', $submissionId)->exists()) {
            return response('Duplicate', 200);
        }

        // Resolve project — check client ownership first, then worker assignment
        $projectName = $this->extractField($payload, ['project', 'project_name', 'property_address', 'address']);

        $project = null;
        if ($projectName) {
            $project = Project::where(fn ($q) => $q->where('client_id', $user->id)
                                                    ->orWhereHas('workers', fn ($q) => $q->where('users.id', $user->id)))
                ->where(fn ($q) => $q->where('name', 'like', "%{$projectName}%")
                                     ->orWhere('address', 'like', "%{$projectName}%"))
                ->first();
        }

        // Fall back to the user's most recent project (as client or worker)
        $project ??= Project::where('client_id', $user->id)->orderByDesc('created_at')->first();
        $project ??= $user->projects()->orderByDesc('created_at')->first();

        if (! $project) {
            Log::warning('GHL VariationForm: no project found', ['userId' => $user->id]);
            return response('No project', 404);
        }

        $title = $this->extractField($payload, [
            'title', 'change_title', 'request_title', 'summary', 'subject', 'variation_title',
        ]) ?? 'Variation Request';

        $description = $this->extractField($payload, [
            'description', 'change_description', 'request_details', 'details',
            'message', 'notes', 'variation_details',
        ]) ?? '(Submitted via GHL form — see logs for raw payload)';

        $cost = $this->extractField($payload, ['estimated_cost', 'cost', 'price', 'amount', 'estimate']);

        VariationRequest::create([
            'ghl_submission_id' => $submissionId,
            'source'            => 'ghl_form',
            'project_id'        => $project->id,
            'submitted_by'      => $user->id,
            'title'             => $title,
            'description'       => $description,
            'estimated_cost'    => is_numeric($cost) ? $cost : null,
            'status'            => 'pending',
        ]);

        Log::info('GHL VariationForm: VariationRequest created', [
            'userId'    => $user->id,
            'projectId' => $project->id,
            'title'     => $title,
        ]);

        return response('OK', 200);
    }

    // Called by GHL Workflow when a proposal/estimate status changes
    public function handleProposalStatus(Request $request): Response
    {
        $payload = $request->json()->all();

        Log::info('GHL ProposalStatus webhook received', ['payload' => $payload]);

        $ghlProposalId = $payload['proposal_id'] ?? $payload['estimateId'] ?? $payload['id'] ?? null;
        $status        = strtolower($payload['status'] ?? $payload['event'] ?? '');

        // Map GHL status words to our enum
        $statusMap = [
            'accepted' => 'accepted',
            'approve'  => 'accepted',
            'approved' => 'accepted',
            'declined' => 'declined',
            'decline'  => 'declined',
            'rejected' => 'declined',
            'viewed'   => 'viewed',
            'paid'     => 'paid',
            'sent'     => 'sent',
        ];

        $mapped = $statusMap[$status] ?? null;

        if (! $ghlProposalId || ! $mapped) {
            Log::warning('GHL ProposalStatus: missing id or unrecognised status', ['payload' => $payload]);
            return response('Bad payload', 422);
        }

        $proposal = Proposal::where('ghl_proposal_id', $ghlProposalId)->first();
        if (! $proposal) {
            Log::warning('GHL ProposalStatus: no matching proposal', ['ghlProposalId' => $ghlProposalId]);
            return response('Not found', 404);
        }

        $proposal->update([
            'status'       => $mapped,
            'responded_at' => in_array($mapped, ['accepted', 'declined', 'paid']) ? now() : $proposal->responded_at,
        ]);

        Log::info('GHL ProposalStatus: updated', ['proposalId' => $proposal->id, 'status' => $mapped]);

        return response('OK', 200);
    }

    public function handle(Request $request): Response
    {
        // Validate HMAC signature
        $secret    = config('services.ghl.webhook_secret');
        $signature = $request->header('X-GHL-Signature', '');
        $rawBody   = $request->getContent();

        if ($secret && ! hash_equals(
            hash_hmac('sha256', $rawBody, $secret),
            $signature
        )) {
            Log::warning('GHLWebhook: invalid signature', [
                'received'  => $signature,
                'headers'   => $request->headers->all(),
            ]);
            return response('Unauthorized', 401);
        }

        $payload   = $request->json()->all();
        $eventType = $payload['type'] ?? 'unknown';

        Log::info("GHLWebhook received: {$eventType}", ['payload' => $payload]);

        match ($eventType) {
            'opportunity.created'       => $this->handleOpportunityCreated($payload),
            'contact.created'           => $this->handleContactCreated($payload),
            'opportunity.stageChanged'  => $this->handleStageChanged($payload),
            'appointment.created',
            'appointment.updated'       => $this->handleAppointment($payload),
            'DocumentSigned'            => $this->handleDocumentSigned($payload),
            'DocumentDeclined'          => $this->handleDocumentDeclined($payload),
            'FormSubmitted'             => $this->handleFormSubmitted($payload),
            default                     => Log::debug("GHLWebhook: unhandled event {$eventType}"),
        };

        return response('OK', 200);
    }

    private function handleOpportunityCreated(array $payload): void
    {
        // Build a contact array from all known payload paths GHL might use
        $nested = $payload['contact'] ?? [];

        $contact = [
            'id'    => $nested['id']    ?? $payload['contactId']    ?? $payload['contact_id'] ?? null,
            'email' => $nested['email'] ?? $payload['email']        ?? $payload['contactEmail'] ?? null,
            'name'  => $nested['name']  ?? $payload['contactName']  ?? $payload['fullName']    ?? null,
        ];

        $opportunityId = $payload['id'] ?? null;

        $this->clientProvisioning->findOrCreateFromContact($contact, $opportunityId);
    }

    private function handleContactCreated(array $payload): void
    {
        // TODO Phase 12: find-or-create portal user with role=client
        Log::info('GHLWebhook: contact.created stub', ['contactId' => $payload['id'] ?? null]);
    }

    private function handleStageChanged(array $payload): void
    {
        // TODO Phase 12: log to audit_logs (portal is source of truth)
        Log::info('GHLWebhook: opportunity.stageChanged stub');
    }

    private function handleAppointment(array $payload): void
    {
        // TODO Phase 12: log to audit_logs
        Log::info('GHLWebhook: appointment stub');
    }

    // Called by GHL Workflow → Webhook action after "Documents & Contracts" trigger (Status = Completed)
    public function handleDocumentCompleted(Request $request): Response
    {
        $payload = $request->json()->all();

        Log::info('GHL DocumentCompleted webhook received — raw payload', ['payload' => $payload]);

        return response('OK', 200);
    }

    private function handleDocumentSigned(array $payload): void
    {
        Log::info('GHLWebhook: DocumentSigned payload received', ['payload' => $payload]);
    }

    private function handleDocumentDeclined(array $payload): void
    {
        Log::info('GHLWebhook: DocumentDeclined payload received', ['payload' => $payload]);
    }

    private function handleFormSubmitted(array $payload): void
    {
        $formId = $payload['formId'] ?? $payload['form_id'] ?? null;

        // Only handle our variation request form
        if ($formId !== 'Y9cP2PtdUriHgHPCP4VV') {
            Log::debug('GHLWebhook: FormSubmitted ignored (different form)', ['formId' => $formId]);
            return;
        }

        Log::info('GHLWebhook: FormSubmitted (variation)', ['payload' => $payload]);

        // Deduplicate by submission ID
        $submissionId = $payload['submissionId'] ?? $payload['submission_id'] ?? null;
        if ($submissionId && VariationRequest::where('ghl_submission_id', $submissionId)->exists()) {
            Log::info('GHLWebhook: duplicate FormSubmitted skipped', ['submissionId' => $submissionId]);
            return;
        }

        // Resolve contact email — GHL may nest it differently
        $formData = $payload['formData'] ?? $payload['form_data'] ?? [];
        $email    = $payload['email']
            ?? $payload['contact']['email']
            ?? $formData['email']
            ?? null;

        if (! $email) {
            Log::warning('GHLWebhook: FormSubmitted missing email', ['payload' => $payload]);
            return;
        }

        // Find the portal client user by email
        $user = User::where('email', $email)->role('client')->first();
        if (! $user) {
            Log::warning('GHLWebhook: FormSubmitted no client found', ['email' => $email]);
            return;
        }

        // Resolve project — try matching by name from form, otherwise use client's first project
        $projectName = $this->extractField($formData, ['project', 'project_name', 'property_address', 'address']);
        $project = $projectName
            ? Project::where('client_id', $user->id)
                ->where(fn ($q) => $q->where('name', 'like', "%{$projectName}%")
                                     ->orWhere('address', 'like', "%{$projectName}%"))
                ->first()
            : null;

        $project ??= Project::where('client_id', $user->id)->orderByDesc('created_at')->first();

        if (! $project) {
            Log::warning('GHLWebhook: FormSubmitted no project found for client', ['userId' => $user->id]);
            return;
        }

        // Extract title & description from form fields (field names vary by form builder)
        $title = $this->extractField($formData, [
            'title', 'change_title', 'request_title', 'summary', 'subject',
            'variation_title', 'name',
        ]) ?? 'Variation Request';

        $description = $this->extractField($formData, [
            'description', 'change_description', 'request_details', 'details',
            'message', 'notes', 'variation_details', 'what_change',
        ]) ?? '';

        $cost = $this->extractField($formData, [
            'estimated_cost', 'cost', 'price', 'amount', 'estimate',
        ]);

        VariationRequest::create([
            'ghl_submission_id' => $submissionId,
            'source'            => 'ghl_form',
            'project_id'        => $project->id,
            'submitted_by'      => $user->id,
            'title'             => $title,
            'description'       => $description ?: '(Submitted via GHL form — see form data in logs)',
            'estimated_cost'    => is_numeric($cost) ? $cost : null,
            'status'            => 'pending',
        ]);

        Log::info('GHLWebhook: VariationRequest created', [
            'userId'    => $user->id,
            'projectId' => $project->id,
            'title'     => $title,
        ]);
    }

    // Helper: find first non-empty value from a list of candidate keys
    private function extractField(array $data, array $keys): ?string
    {
        foreach ($keys as $key) {
            // Exact match
            if (isset($data[$key]) && $data[$key] !== '') {
                return (string) $data[$key];
            }
            // Case-insensitive partial match on key
            foreach ($data as $k => $v) {
                if (str_contains(strtolower($k), strtolower($key)) && $v !== '') {
                    return (string) $v;
                }
            }
        }
        return null;
    }
}
