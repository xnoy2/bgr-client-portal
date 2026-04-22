<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agreement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'variation_request_id', 'created_by',
        'title', 'client_name', 'project_address', 'contract_reference',
        'items', 'total_amount', 'notes',
        'status', 'sent_at', 'signed_at', 'signature_data', 'signed_by_name', 'signed_ip', 'pdf_url',
    ];

    protected $casts = [
        'items'        => 'array',
        'total_amount' => 'decimal:2',
        'sent_at'      => 'datetime',
        'signed_at'    => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function variationRequest()
    {
        return $this->belongsTo(VariationRequest::class);
    }
}
