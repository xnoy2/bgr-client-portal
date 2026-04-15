<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);

        // Default admin account — change credentials after first login
        $admin = User::firstOrCreate(
            ['email' => 'admin@bgr.com.au'],
            [
                'name'                => 'BGR Admin',
                'username'            => 'admin',
                'password'            => 'Admin@1234', // hashed cast on User model handles hashing
                'must_change_password' => true,
                'is_active'           => true,
            ]
        );

        $admin->assignRole('admin');
    }
}
