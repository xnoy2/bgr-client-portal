<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'uploaded_by', 'title', 'filename',
        'url', 'mime_type', 'file_size', 'category', 'visibility', 'ghl_file_id',
        'sign_status', 'sent_at', 'signed_at', 'signer_name',
        'docuseal_template_id', 'docuseal_submission_id', 'docuseal_slug',
    ];

    protected $casts = [
        'sent_at'   => 'datetime',
        'signed_at' => 'datetime',
    ];

    public function project()  { return $this->belongsTo(Project::class); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}
