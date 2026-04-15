<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ClientMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user()?->hasRole('client')) {
            abort(403, 'Client portal access required.');
        }
        return $next($request);
    }
}