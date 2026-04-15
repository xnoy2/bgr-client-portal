<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaFile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'stage_id', 'user_id',
        'ghl_file_id', 'url', 'resource_type', 'original_filename',
    ];

    public function project() { return $this->belongsTo(Project::class); }
    public function stage()   { return $this->belongsTo(ProjectStage::class, 'stage_id'); }
    public function uploader(){ return $this->belongsTo(User::class, 'user_id'); }
}