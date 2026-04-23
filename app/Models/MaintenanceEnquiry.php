<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceEnquiry extends Model
{
    protected $fillable = ['client_id', 'plan', 'message', 'status', 'admin_notes'];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
