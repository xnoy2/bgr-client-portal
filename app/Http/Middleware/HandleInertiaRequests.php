<?php

namespace App\Http\Middleware;

use App\Models\PortalNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * These props are available on every page via usePage().props
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'    => $request->user()->id,
                    'name'  => $request->user()->name,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->getRoleNames(),
                ] : null,
            ],
            'notifications' => function () use ($request) {
                $user = $request->user();
                if (! $user) return ['unread_count' => 0, 'items' => []];

                $items = PortalNotification::where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get()
                    ->map(fn ($n) => [
                        'id'      => $n->id,
                        'type'    => $n->type,
                        'title'   => $n->title,
                        'message' => $n->message,
                        'url'     => $n->url,
                        'read'    => $n->read_at !== null,
                        'time'    => $n->created_at->diffForHumans(),
                    ]);

                return [
                    'unread_count' => $items->where('read', false)->count(),
                    'items'        => $items->values(),
                ];
            },
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'created' => $request->session()->get('created'), // temp credentials after user creation
            ],
        ]);
    }
}