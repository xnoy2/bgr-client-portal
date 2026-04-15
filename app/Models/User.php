<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles, Notifiable;

    protected $fillable = [
        'name', 'username', 'email', 'password',
        'ghl_contact_id', 'must_change_password', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'password'             => 'hashed',
            'must_change_password' => 'boolean',
            'is_active'            => 'boolean',
        ];
    }

    // Projects this user owns as a client
    public function projects()
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    // Projects this user is assigned to as a worker
    public function assignedProjects()
    {
        return $this->belongsToMany(Project::class, 'project_user');
    }
}