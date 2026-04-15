<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class WorkerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user()?->hasAnyRole(['admin', 'worker'])) {
            abort(403, 'Worker access required.');
        }
        return $next($request);
    }
}