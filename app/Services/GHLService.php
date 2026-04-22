<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GHLService
{
    private string $baseUrl;
    private string $apiKey;
    private string $locationId;
    private string $pipelineId;
    private array  $stageNames;
    private bool   $sslVerify;

    public function __construct()
    {
        $this->baseUrl    = config('services.ghl.base_url');
        $this->apiKey     = config('services.ghl.api_key');
        $this->locationId = config('services.ghl.location_id');
        $this->pipelineId = config('services.ghl.pipeline_id');
        $this->stageNames = config('services.ghl.stage_names', []);
        $this->sslVerify  = (bool) config('services.ghl.ssl_verify', true);
    }

    // ── HTTP client ───────────────────────────────────────────────────────────

    private function http()
    {
        $client = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Version'       => '2021-07-28',
            'Accept'        => 'application/json',
        ])->baseUrl($this->baseUrl)->timeout(15);

        if (! $this->sslVerify) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    // ── Single opportunity ────────────────────────────────────────────────────

    public function getOpportunity(string $id): ?array
    {
        try {
            $response = $this->http()->get("/opportunities/{$id}");

            if ($response->successful()) {
                $opp = $response->json('opportunity');
                return $opp ? $this->normalise($opp) : null;
            }

            Log::warning('GHL getOpportunity failed', [
                'id'     => $id,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('GHL getOpportunity exception', ['id' => $id, 'error' => $e->getMessage()]);
        }

        return null;
    }

    /** Cached — 5 minute TTL */
    public function getCachedOpportunity(string $id): ?array
    {
        return Cache::remember("ghl_opp_{$id}", 300, fn () => $this->getOpportunity($id));
    }

    // ── Pipeline opportunity list ─────────────────────────────────────────────

    public function getPipelineOpportunities(int $limit = 100, int $page = 1): array
    {
        try {
            $response = $this->http()->get('/opportunities/search', [
                'pipeline_id' => $this->pipelineId,
                'location_id' => $this->locationId,
                'limit'       => $limit,
                'page'        => $page,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'opportunities' => collect($data['opportunities'] ?? [])
                        ->map(fn ($opp) => $this->normalise($opp))
                        ->values()
                        ->all(),
                    'meta' => $data['meta'] ?? [],
                ];
            }

            Log::warning('GHL getPipelineOpportunities failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('GHL getPipelineOpportunities exception', ['error' => $e->getMessage()]);
        }

        return ['opportunities' => [], 'meta' => []];
    }

    /** Cached pipeline list — 5 minute TTL */
    public function getCachedPipelineOpportunities(): array
    {
        return Cache::remember(
            "ghl_pipeline_{$this->pipelineId}",
            300,
            fn () => $this->getPipelineOpportunities()
        );
    }

    // ── Cache invalidation ────────────────────────────────────────────────────

    public function forgetOpportunityCache(string $id): void
    {
        Cache::forget("ghl_opp_{$id}");
    }

    public function forgetPipelineCache(): void
    {
        Cache::forget("ghl_pipeline_{$this->pipelineId}");
    }

    // ── Normalise GHL response shape ──────────────────────────────────────────

    /**
     * Flatten a raw GHL opportunity into a consistent shape
     * used by both controllers and React pages.
     */
    private function normalise(array $opp): array
    {
        $stageId   = $opp['pipelineStageId'] ?? null;
        $stageName = $this->stageNames[$stageId] ?? ($opp['pipelineStage']['name'] ?? null);

        return [
            'id'           => $opp['id'],
            'name'         => $opp['name'] ?? 'Untitled',
            'status'       => $opp['status'] ?? 'open',      // open|won|lost|abandoned
            'stage_id'     => $stageId,
            'stage_name'   => $stageName,
            'value'        => $opp['monetaryValue'] ?? 0,
            'contact'      => isset($opp['contact']) ? [
                'id'    => $opp['contact']['id']    ?? null,
                'name'  => $opp['contact']['name']  ?? null,
                'email' => $opp['contact']['email'] ?? null,
                'phone' => $opp['contact']['phone'] ?? null,
            ] : null,
            'assigned_to'  => $opp['assignedTo'] ?? null,
            'source'       => $opp['source']     ?? null,
            'custom_fields'=> $opp['customFields'] ?? [],
            'created_at'   => $opp['createdAt']  ?? null,
            'updated_at'   => $opp['updatedAt']  ?? null,
        ];
    }

    // ── GHL writeback ─────────────────────────────────────────────────────────

    /**
     * Push a stage change back to GHL so the pipeline stage stays in sync.
     * Called when a worker advances or completes a stage.
     */
    public function updateOpportunityStage(string $opportunityId, string $ghlStageId): bool
    {
        try {
            $response = $this->http()->put("/opportunities/{$opportunityId}", [
                'pipelineStageId' => $ghlStageId,
            ]);

            if ($response->successful()) {
                $this->forgetOpportunityCache($opportunityId);
                $this->forgetPipelineCache();
                return true;
            }

            Log::warning('GHL updateOpportunityStage failed', [
                'opportunity_id' => $opportunityId,
                'stage_id'       => $ghlStageId,
                'status'         => $response->status(),
                'body'           => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('GHL updateOpportunityStage exception', ['error' => $e->getMessage()]);
        }

        return false;
    }

    /**
     * Update local stage statuses AND write the resulting stage back to GHL.
     * Use this instead of syncProjectStages() when a worker advances a stage.
     */
    public function advanceProjectStage(Project $project, int $newOrder): void
    {
        // 1. Update local stages
        if (! $project->relationLoaded('stages')) {
            $project->load('stages');
        }

        $maxOrder = $project->stages->max('order') ?? 5;

        // newOrder > maxOrder means "complete everything" (no next in_progress stage)
        foreach ($project->stages as $stage) {
            $newStatus = match (true) {
                $newOrder > $maxOrder          => 'completed',          // final-stage complete
                $stage->order < $newOrder      => 'completed',
                $stage->order === $newOrder    => 'in_progress',
                default                        => 'pending',
            };

            if ($stage->status !== $newStatus) {
                $stage->update(['status' => $newStatus]);
                $stage->status = $newStatus;
            }
        }

        // 2. Write back to GHL — always clear cache so the next page load
        //    reads fresh GHL data instead of overwriting our local changes.
        if ($project->ghl_opportunity_id) {
            $ghlStageId = config("services.ghl.stage_id_by_order.{$newOrder}");
            if ($ghlStageId) {
                $this->updateOpportunityStage($project->ghl_opportunity_id, $ghlStageId);
            } else {
                // Unknown/final order — still bust the cache so syncProjectStages
                // doesn't revert our local changes on the next request.
                $this->forgetOpportunityCache($project->ghl_opportunity_id);
            }
        }
    }

    // ── Notes (progress updates → GHL) ───────────────────────────────────────

    /**
     * Post a note on the GHL opportunity.
     * The GHL "Photos" custom field is a file-upload widget — it cannot be
     * populated via the PUT API.  Instead we attach photo URLs as clickable
     * links inside a note, which appears in the Notes tab of the opportunity.
     */
    public function postOpportunityNote(
        string $opportunityId,
        string $title,
        string $body,
        array  $photoUrls = []
    ): bool {
        $lines   = ["📋 {$title}", '', $body];

        if (! empty($photoUrls)) {
            $lines[] = '';
            $lines[] = '📷 Photos:';
            foreach ($photoUrls as $url) {
                $lines[] = $url;
            }
        }

        $noteBody = implode("\n", $lines);

        try {
            $response = $this->http()->post("/opportunities/{$opportunityId}/notes", [
                'body'   => $noteBody,
                'userId' => null,
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning('GHL postOpportunityNote failed', [
                'opportunity_id' => $opportunityId,
                'status'         => $response->status(),
                'body'           => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('GHL postOpportunityNote exception', ['error' => $e->getMessage()]);
        }

        return false;
    }

    // ── Email sending ─────────────────────────────────────────────────────────

    /**
     * Fetch a single GHL contact by ID.
     * Used when the opportunity payload doesn't include the contact email.
     */
    public function getContact(string $contactId): ?array
    {
        try {
            $response = $this->http()->get("/contacts/{$contactId}");
            if ($response->successful()) {
                return $response->json('contact') ?? $response->json();
            }
            Log::warning('GHL getContact failed', ['contactId' => $contactId, 'status' => $response->status()]);
        } catch (\Exception $e) {
            Log::error('GHL getContact exception', ['contactId' => $contactId, 'error' => $e->getMessage()]);
        }
        return null;
    }

    /**
     * Find a GHL contact by email address.
     * Returns the contact ID or null if not found.
     */
    public function findContactByEmail(string $email): ?string
    {
        try {
            $response = $this->http()->get('/contacts/', [
                'locationId' => $this->locationId,
                'query'      => $email,
            ]);

            if ($response->successful()) {
                $contacts = $response->json('contacts') ?? [];
                foreach ($contacts as $contact) {
                    if (strtolower($contact['email'] ?? '') === strtolower($email)) {
                        return $contact['id'];
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('GHL findContactByEmail exception', ['email' => $email, 'error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Get or create a GHL conversation for a contact.
     * Returns the conversation ID or null on failure.
     */
    public function getOrCreateConversation(string $contactId): ?string
    {
        try {
            // Search for existing conversation
            $response = $this->http()->get('/conversations/search', [
                'locationId' => $this->locationId,
                'contactId'  => $contactId,
            ]);

            if ($response->successful()) {
                $conversations = $response->json('conversations') ?? [];
                if (! empty($conversations)) {
                    return $conversations[0]['id'];
                }
            }

            // No conversation found — create one
            $create = $this->http()->post('/conversations/', [
                'locationId' => $this->locationId,
                'contactId'  => $contactId,
            ]);

            if ($create->successful()) {
                return $create->json('conversation.id') ?? $create->json('id');
            }
        } catch (\Exception $e) {
            Log::error('GHL getOrCreateConversation exception', ['contactId' => $contactId, 'error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Send a transactional email via GHL conversations API.
     * Falls back gracefully — returns false on failure so caller can fall back to log mail.
     */
    public function sendEmail(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        ?string $contactId = null
    ): bool {
        try {
            // Resolve contact ID if not provided
            $contactId ??= $this->findContactByEmail($toEmail);

            if (! $contactId) {
                Log::warning('GHL sendEmail: no contact found for email', ['email' => $toEmail]);
                return false;
            }

            $conversationId = $this->getOrCreateConversation($contactId);

            if (! $conversationId) {
                Log::warning('GHL sendEmail: could not get/create conversation', ['contactId' => $contactId]);
                return false;
            }

            $response = $this->http()->post('/conversations/messages', [
                'type'           => 'Email',
                'conversationId' => $conversationId,
                'contactId'      => $contactId,
                'subject'        => $subject,
                'html'           => $htmlBody,
                'emailFrom'      => config('mail.from.address'),
                'emailTo'        => $toEmail,
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning('GHL sendEmail failed', [
                'email'  => $toEmail,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('GHL sendEmail exception', ['email' => $toEmail, 'error' => $e->getMessage()]);
        }

        return false;
    }

    // ── Stage sync ────────────────────────────────────────────────────────────

    /**
     * Syncs a project's local stage statuses to match the current GHL pipeline stage.
     *
     * Given the GHL stage ID, all local stages with order < current become 'completed',
     * the matching stage becomes 'in_progress', and later stages stay 'pending'.
     *
     * This is called on every project show so GHL is always the source of truth.
     */
    public function syncProjectStages(Project $project, string $ghlStageId): void
    {
        $stageOrder = config("services.ghl.stage_order.{$ghlStageId}");

        if (! $stageOrder) {
            return; // Unknown stage ID — don't touch local stages
        }

        // Load stages if not already loaded
        if (! $project->relationLoaded('stages')) {
            $project->load('stages');
        }

        foreach ($project->stages as $stage) {
            if ($stage->order < $stageOrder) {
                $newStatus = 'completed';
            } elseif ($stage->order === $stageOrder) {
                $newStatus = 'in_progress';
            } else {
                $newStatus = 'pending';
            }

            if ($stage->status !== $newStatus) {
                $stage->update(['status' => $newStatus]);
                $stage->status = $newStatus; // keep in-memory collection in sync
            }
        }
    }

    // ── Documents & Contracts ─────────────────────────────────────────────────

    /**
     * Send a Documents & Contracts template to a recipient.
     * Returns ['documentId' => '...', 'documentLink' => '...'] on success, null on failure.
     *
     * Requires scope: documents_contracts/template/sendLink.write
     * Endpoint: POST /documents-contracts/template/send-link
     */
    public function sendDocumentTemplate(
        string $templateId,
        string $recipientName,
        string $recipientEmail,
        string $title
    ): ?array {
        try {
            $response = $this->http()->post('/documents-contracts/template/send-link', [
                'locationId' => $this->locationId,
                'templateId' => $templateId,
                'title'      => $title,
                'recipients' => [
                    [
                        'name'     => $recipientName,
                        'email'    => $recipientEmail,
                        'roleName' => 'Client',
                    ],
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('GHL sendDocumentTemplate success', ['templateId' => $templateId, 'response' => $data]);
                return [
                    'documentId'   => $data['documentId']   ?? $data['id']   ?? null,
                    'documentLink' => $data['documentLink'] ?? $data['link'] ?? $data['signingUrl'] ?? null,
                ];
            }

            Log::warning('GHL sendDocumentTemplate failed', [
                'templateId' => $templateId,
                'status'     => $response->status(),
                'body'       => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('GHL sendDocumentTemplate exception', ['templateId' => $templateId, 'error' => $e->getMessage()]);
        }

        return null;
    }
}
