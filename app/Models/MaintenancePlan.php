<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenancePlan extends Model
{
    protected $fillable = ['name', 'slug', 'price', 'is_popular', 'is_active', 'sort_order', 'features'];

    protected $casts = [
        'features'   => 'array',
        'is_popular' => 'boolean',
        'is_active'  => 'boolean',
    ];
}
