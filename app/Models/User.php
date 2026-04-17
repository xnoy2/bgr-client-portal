<?php

namespace App\Models;

use App\Notifications\GHLResetPasswordNotification;
use App\Services\GHLService;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable;

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

    /**
     * Send password reset email via GHL.
     * Falls back to Laravel's default mail notification if GHL fails.
     */
    public function sendPasswordResetNotification($token): void
    {
        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $this->getEmailForPasswordReset(),
        ], false));

        $html = GHLResetPasswordNotification::buildHtml($this->name ?? 'there', $resetUrl);

        $sent = app(GHLService::class)->sendEmail(
            toEmail:   $this->getEmailForPasswordReset(),
            toName:    $this->name ?? '',
            subject:   'Reset your BGR Client Portal password',
            htmlBody:  $html,
            contactId: $this->ghl_contact_id,
        );

        if (! $sent) {
            // GHL failed — fall back to Laravel's built-in mail
            $this->notify(new GHLResetPasswordNotification($token));
        }
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