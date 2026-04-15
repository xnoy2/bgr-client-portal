<?php

namespace App\Jobs\GHL;

use App\Models\Project;
use App\Services\GHLService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateOpportunityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Project $project) {}

    public function handle(GHLService $ghl): void
    {
        if (! $this->project->client?->ghl_contact_id) {
            Log::warning('CreateOpportunityJob: no ghl_contact_id on client', [
                'project_id' => $this->project->id,
            ]);
            return;
        }

        $opportunity = $ghl->createOpportunity(
            $this->project->client->ghl_contact_id,
            $this->project->name
        );

        if (! empty($opportunity['id'])) {
            $this->project->update(['ghl_opportunity_id' => $opportunity['id']]);
        }
    }
}