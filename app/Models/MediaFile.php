<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaFile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'stage_id', 'user_id',
        'ghl_file_id', 'url', 'storage_path', 'storage_disk',
        'resource_type', 'original_filename', 'mime_type', 'file_size',
    ];

    /** Proxy URL for private Azure files; falls back to legacy Cloudinary URL. */
    public function getProxyUrl(): string
    {
        if ($this->storage_path) {
            return route('media.photo', $this->id);
        }
        return $this->url ?? '';
    }

    public function project() { return $this->belongsTo(Project::class); }
    public function stage()   { return $this->belongsTo(ProjectStage::class, 'stage_id'); }
    public function uploader(){ return $this->belongsTo(User::class, 'user_id'); }
}
