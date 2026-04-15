<?php

namespace App\Jobs\GHL;

use App\Models\ProjectStage;
use App\Services\GHLService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncStageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public ProjectStage $stage) {}

    public function handle(GHLService $ghl): void
    {
        $project = $this->stage->project;

        if (! $project->ghl_opportunity_id) {
            return;
        }

        // Map portal stage name to GHL stage ID from config
        $stageMap = [
            'Design Approved'     => config('services.ghl.stages.design_approved'),
            'Groundworks'         => config('services.ghl.stages.groundworks'),
            'Structure Build'     => config('services.ghl.stages.structure_build'),
            'Interior & Fit-Out'  => config('services.ghl.stages.fit_out'),
            'Completion'          => config('services.ghl.stages.completed'),
        ];

        $ghlStageId = $stageMap[$this->stage->name] ?? null;

        if ($ghlStageId) {
            $ghl->updateOpportunityStage($project->ghl_opportunity_id, $ghlStageId);
        }
    }
}