<?php

namespace App\Jobs\GHL;

use App\Models\Document;
use App\Services\GHLService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public Document $document,
        public string $contactId,
        public string $clientName,
        public string $clientEmail
    ) {}

    public function handle(GHLService $ghl): void
    {
        $result = $ghl->sendDocumentForSigning(
            $this->document->ghl_template_id,
            $this->contactId,
            $this->clientName,
            $this->clientEmail
        );

        if (! empty($result['documentId'])) {
            $this->document->update([
                'ghl_document_id' => $result['documentId'],
                'signing_url'     => $result['signingUrl'],
                'status'          => 'sent',
                'sent_at'         => now(),
            ]);
        }
    }
}