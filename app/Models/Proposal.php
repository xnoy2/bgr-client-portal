<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    protected $fillable = [
        'project_id', 'created_by', 'title', 'ghl_proposal_id',
        'ghl_link', 'status', 'amount', 'notes', 'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'       => 'decimal:2',
            'responded_at' => 'datetime',
        ];
    }

    public function project()  { return $this->belongsTo(Project::class); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
}
