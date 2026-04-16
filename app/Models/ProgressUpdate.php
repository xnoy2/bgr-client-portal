<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgressUpdate extends Model
{
    protected $fillable = [
        'project_id', 'stage_id', 'user_id',
        'title', 'body', 'photos', 'is_published', 'visibility', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'photos'       => 'array',
        ];
    }

    public function project() { return $this->belongsTo(Project::class); }
    public function stage()   { return $this->belongsTo(ProjectStage::class, 'stage_id'); }
    public function author()  { return $this->belongsTo(User::class, 'user_id'); }
}