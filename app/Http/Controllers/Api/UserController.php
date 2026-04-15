<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * GET /api/users
     * Admin: all users. Others: forbidden.
     */
    public function index(Request $request)
    {
        $users = User::with('roles')
            ->when($request->role,   fn ($q) => $q->role($request->role))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                                                   ->orWhere('email', 'like', "%{$request->search}%"))
            ->orderBy('name')
            ->paginate(20);

        return UserResource::collection($users);
    }

    /**
     * POST /api/users
     * Admin only.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role'  => 'required|in:admin,worker,client',
        ]);

        $username     = $this->generateUsername($request->name);
        $tempPassword = $this->generatePassword();

        $user = User::create([
            'name'                => $request->name,
            'email'               => $request->email,
            'username'            => $username,
            'password'            => $tempPassword,
            'must_change_password' => true,
            'is_active'           => true,
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'user'     => new UserResource($user->load('roles')),
            'username' => $username,
            'password' => $tempPassword,
        ], 201);
    }

    /**
     * GET /api/users/{user}
     */
    public function show(User $user)
    {
        return new UserResource($user->load('roles'));
    }

    /**
     * PUT /api/users/{user}
     * Admin only.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $user->id,
            'role'      => 'sometimes|in:admin,worker,client',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($request->only('name', 'email', 'is_active'));

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return new UserResource($user->load('roles'));
    }

    /**
     * DELETE /api/users/{user}
     * Admin only — deactivates (soft disable), does not delete.
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot deactivate yourself.'], 422);
        }

        $user->update(['is_active' => false]);

        return response()->json(['message' => 'User deactivated.']);
    }

    private function generateUsername(string $name): string
    {
        $parts = explode(' ', strtolower(trim($name)));
        $base  = preg_replace('/[^a-z0-9]/', '', $parts[0] . (isset($parts[1]) ? $parts[1][0] : ''));

        do { $username = $base . rand(100, 999); }
        while (User::where('username', $username)->exists());

        return $username;
    }

    private function generatePassword(): string
    {
        return Str::upper(Str::random(2))
             . Str::lower(Str::random(4))
             . rand(10, 99)
             . Str::of('!@#$%')->split(1)->random();
    }
}
