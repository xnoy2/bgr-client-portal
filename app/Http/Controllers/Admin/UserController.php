<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'email'     => $u->email,
                'username'  => $u->username,
                'role'      => $u->roles->first()?->name,
                'is_active' => $u->is_active,
                'must_change_password' => $u->must_change_password,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role'  => 'required|in:admin,worker,client',
        ]);

        $username    = $this->generateUsername($request->name);
        $tempPassword = $this->generatePassword();

        $user = User::create([
            'name'                => $request->name,
            'email'               => $request->email,
            'username'            => $username,
            'password'            => Hash::make($tempPassword),
            'must_change_password' => true,
            'is_active'           => true,
        ]);

        $user->assignRole($request->role);

        return back()->with('created', [
            'name'     => $user->name,
            'email'    => $user->email,
            'password' => $tempPassword,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email,' . $user->id,
            'role'      => 'required|in:admin,worker,client',
            'is_active' => 'required|boolean',
        ]);

        $user->update([
            'name'      => $request->name,
            'email'     => $request->email,
            'is_active' => $request->is_active,
        ]);

        $user->syncRoles([$request->role]);

        return back()->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate yourself.');
        }

        $user->update(['is_active' => false]);

        return back()->with('success', 'User deactivated.');
    }

    public function resetPassword(User $user)
    {
        $tempPassword = $this->generatePassword();

        $user->update([
            'password'            => Hash::make($tempPassword),
            'must_change_password' => true,
        ]);

        return back()->with('created', [
            'name'     => $user->name,
            'email'    => $user->email,
            'password' => $tempPassword,
        ]);
    }

    private function generateUsername(string $name): string
    {
        $parts = explode(' ', strtolower(trim($name)));
        $base  = $parts[0] . (isset($parts[1]) ? $parts[1][0] : '');
        $base  = preg_replace('/[^a-z0-9]/', '', $base);

        do {
            $username = $base . rand(100, 999);
        } while (User::where('username', $username)->exists());

        return $username;
    }

    private function generatePassword(): string
    {
        $upper   = Str::upper(Str::random(2));
        $lower   = Str::lower(Str::random(4));
        $numbers = rand(10, 99);
        $special = Str::of('!@#$%')->split(1)->random();

        return str_shuffle($upper . $lower . $numbers . $special);
    }
}
