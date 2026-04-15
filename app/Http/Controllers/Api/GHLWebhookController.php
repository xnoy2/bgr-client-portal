<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class GHLWebhookController extends Controller
{
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
            Log::warning('GHLWebhook: invalid signature');
            return response('Unauthorized', 401);
        }

        $payload   = $request->json()->all();
        $eventType = $payload['type'] ?? 'unknown';

        Log::info("GHLWebhook received: {$eventType}", ['payload' => $payload]);

        match ($eventType) {
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

    // -------------------------------------------------------------------------
    // Phase 12 will fully implement each handler below.
    // For Phase 1, these are stubs that log and return.
    // -------------------------------------------------------------------------

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