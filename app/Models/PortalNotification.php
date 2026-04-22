<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortalNotification extends Model
{
    protected $table = 'portal_notifications';

    protected $fillable = ['user_id', 'type', 'title', 'message', 'url', 'read_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function user() { return $this->belongsTo(User::class); }

    public function isUnread(): bool { return $this->read_at === null; }

    public static function notifyAdmins(string $type, string $title, string $message, ?string $url = null): void
    {
        $admins = User::role('admin')->pluck('id');
        foreach ($admins as $adminId) {
            static::create(compact('type', 'title', 'message', 'url') + ['user_id' => $adminId]);
        }
    }

    public static function notifyUser(int $userId, string $type, string $title, string $message, ?string $url = null): void
    {
        static::create(['user_id' => $userId, 'type' => $type, 'title' => $title, 'message' => $message, 'url' => $url]);
    }
}
