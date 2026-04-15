<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view_any_project',
            'view_own_project',
            'update_project_progress',
            'override_progress',
            'manage_workers',
            'view_documents',
            'manage_documents',
            'submit_variation_request',
            'view_activity_log',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($permissions); // admin gets everything

        $worker = Role::firstOrCreate(['name' => 'worker']);
        $worker->syncPermissions([
            'update_project_progress', // assigned projects only — enforced via policy
        ]);

        $client = Role::firstOrCreate(['name' => 'client']);
        $client->syncPermissions([
            'view_own_project',
            'view_documents',
            'submit_variation_request',
        ]);
    }
}
