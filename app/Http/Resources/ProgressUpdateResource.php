<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgressUpdateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'body'         => $this->body,
            'photos'       => $this->photos ?? [],
            'is_published' => $this->is_published,
            'visibility'   => $this->visibility,
            'published_at' => $this->published_at?->toISOString(),
            'stage'        => $this->whenLoaded('stage', fn () => $this->stage ? [
                'id'   => $this->stage->id,
                'name' => $this->stage->name,
            ] : null),
            'author'       => $this->whenLoaded('author', fn () => $this->author ? [
                'id'   => $this->author->id,
                'name' => $this->author->name,
            ] : null),
            'project_id'   => $this->project_id,
            'created_at'   => $this->created_at->toISOString(),
            'updated_at'   => $this->updated_at->toISOString(),
        ];
    }
}
