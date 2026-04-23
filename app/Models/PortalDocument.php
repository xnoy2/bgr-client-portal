<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortalDocument extends Model
{
    protected $fillable = [
        'category',
        'original_name',
        'disk_path',
        'storage_disk',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
