<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariationRequest extends Model
{
    protected $table = 'variation_requests';

    protected $fillable = [
        'ghl_submission_id', 'source',
        'project_id', 'submitted_by', 'title', 'description',
        'estimated_cost', 'status', 'admin_notes', 'reviewed_at', 'reviewed_by',
        'agreement_link', 'agreement_status', 'agreement_signed_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_cost'      => 'decimal:2',
            'reviewed_at'         => 'datetime',
            'agreement_signed_at' => 'datetime',
        ];
    }

    public function project()   { return $this->belongsTo(Project::class); }
    public function submitter() { return $this->belongsTo(User::class, 'submitted_by'); }
    public function reviewer()  { return $this->belongsTo(User::class, 'reviewed_by'); }
}
