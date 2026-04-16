<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'description'          => $this->description,
            'address'              => $this->address,
            'status'               => $this->status,
            'start_date'           => $this->start_date?->toDateString(),
            'estimated_completion' => $this->estimated_completion?->toDateString(),
            'actual_completion'    => $this->actual_completion?->toDateString(),
            'ghl_opportunity_id'   => $this->ghl_opportunity_id,
            'client'               => $this->whenLoaded('client', fn () => [
                'id'    => $this->client->id,
                'name'  => $this->client->name,
                'email' => $this->client->email,
            ]),
            'workers'              => $this->whenLoaded('workers', fn () =>
                $this->workers->map(fn ($w) => [
                    'id'   => $w->id,
                    'name' => $w->name,
                ])
            ),
            'current_stage'        => $this->whenLoaded('stages', fn () => {
                $stage = $this->stages->firstWhere('status', 'in_progress');
                return $stage ? ['id' => $stage->id, 'name' => $stage->name] : null;
            }),
            'stages_count'         => $this->whenCounted('stages'),
            'created_at'           => $this->created_at->toISOString(),
            'updated_at'           => $this->updated_at->toISOString(),
        ];
    }
}
