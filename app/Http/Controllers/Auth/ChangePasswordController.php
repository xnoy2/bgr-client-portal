<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ChangePasswordController extends Controller
{
    public function show()
    {
        return Inertia::render('Auth/ChangePassword');
    }

    public function update(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $request->user()->update([
            'password'            => Hash::make($request->password),
            'must_change_password' => false,
        ]);

        return redirect()->intended(
            $this->redirectPath($request->user())
        )->with('success', 'Password changed successfully.');
    }

    private function redirectPath($user): string
    {
        if ($user->hasRole('admin'))  return route('admin.dashboard');
        if ($user->hasRole('worker')) return route('worker.dashboard');
        return route('client.dashboard');
    }
}
