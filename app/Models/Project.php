<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name', 'description', 'address',
        'start_date', 'estimated_completion',
        'status', 'client_id', 'ghl_opportunity_id',
    ];

    protected function casts(): array
    {
        return [
            'start_date'           => 'date',
            'estimated_completion' => 'date',
        ];
    }

    // The client who owns this project
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    // Workers assigned to this project
    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user');
    }

    public function stages(): HasMany
    {
        return $this->hasMany(ProjectStage::class)->orderBy('order');
    }

    public function progressUpdates(): HasMany
    {
        return $this->hasMany(ProgressUpdate::class);
    }

    public function mediaFiles(): HasMany
    {
        return $this->hasMany(MediaFile::class);
    }

    public function variationRequests(): HasMany
    {
        return $this->hasMany(VariationRequest::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    // Returns the currently active stage
    public function currentStage(): ?ProjectStage
    {
        return $this->stages()
            ->where('status', 'in_progress')
            ->first();
    }

    // The 5 fixed stage names in order — used when auto-seeding on project create
    public static function defaultStageNames(): array
    {
        return [
            'Design Approved',
            'Groundworks',
            'Structure Build',
            'Interior & Fit-Out',
            'Completion',
        ];
    }
}