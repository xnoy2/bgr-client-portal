<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceSubscription extends Model
{
    protected $fillable = ['client_id', 'plan', 'status', 'start_date', 'renewal_date', 'notes'];

    protected $casts = [
        'start_date'   => 'date',
        'renewal_date' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
