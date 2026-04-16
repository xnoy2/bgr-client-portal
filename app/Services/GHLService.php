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
}
