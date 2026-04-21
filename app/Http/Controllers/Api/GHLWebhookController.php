<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ClientProvisioningService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class GHLWebhookController extends Controller
{
    public function __construct(private ClientProvisioningService $clientProvisioning) {}

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

    private function handleDocumentSigned(array $payload): void
    {
        // TODO Phase 8: update document status, create document_signatures row, notify admin
        Log::info('GHLWebhook: DocumentSigned stub');
    }

    private function handleDocumentDeclined(array $payload): void
    {
        // TODO Phase 8: update document status, notify admin
        Log::info('GHLWebhook: DocumentDeclined stub');
    }
}
