<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use App\Notifications\WelcomeClientNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ClientProvisioningService
{
    public function __construct(private GHLService $ghl) {}

    /**
     * Find or create a client account from GHL contact data.
     * Sends a welcome email only on first creation.
     * Returns the User, or null if contact has no email.
     */
    public function findOrCreateFromContact(array $contact, ?string $opportunityId = null): ?User
    {
        $email     = $contact['email'] ?? null;
        $contactId = $contact['id']    ?? null;
        $name      = $contact['name']  ?? null;

        // GHL pipeline list sometimes omits the email — fetch the full contact if needed
        if (! $email && $contactId) {
            $full  = $this->ghl->getContact($contactId);
            $email = $full['email'] ?? null;
            $name  = $name ?? ($full['name'] ?? null);
        }

        if (! $email) {
            Log::warning('ClientProvisioning: no email found for contact', [
                'contactId'     => $contactId,
                'opportunityId' => $opportunityId,
            ]);
            return null;
        }

        // Existing account — just ensure it's linked
        $existing = User::where('email', $email)
            ->orWhere(fn ($q) => $q->whereNotNull('ghl_contact_id')->where('ghl_contact_id', $contactId))
            ->first();

        if ($existing) {
            if ($contactId && ! $existing->ghl_contact_id) {
                $existing->update(['ghl_contact_id' => $contactId]);
            }
            $this->linkToProject($existing->id, $opportunityId);

            Log::info('ClientProvisioning: existing client linked', [
                'userId'        => $existing->id,
                'email'         => $email,
                'opportunityId' => $opportunityId,
            ]);
            return $existing;
        }

        // New account
        $username     = $this->generateUsername($name ?? 'client');
        $tempPassword = $this->generatePassword();

        $user = User::create([
            'name'                 => $name ?? 'Client',
            'email'                => $email,
            'username'             => $username,
            'password'             => Hash::make($tempPassword),
            'ghl_contact_id'       => $contactId,
            'must_change_password' => true,
            'is_active'            => true,
        ]);

        $user->assignRole('client');
        $this->linkToProject($user->id, $opportunityId);

        Log::info('ClientProvisioning: new client account created', [
            'userId'        => $user->id,
            'email'         => $email,
            'opportunityId' => $opportunityId,
        ]);

        $this->sendWelcomeEmail($user, $tempPassword, $contactId);

        return $user;
    }

    private function linkToProject(int $userId, ?string $opportunityId): void
    {
        if (! $opportunityId) {
            return;
        }

        Project::where('ghl_opportunity_id', $opportunityId)
            ->whereNull('client_id')
            ->update(['client_id' => $userId]);
    }

    private function sendWelcomeEmail(User $user, string $tempPassword, ?string $contactId): void
    {
        $html = WelcomeClientNotification::buildHtml($user->name, $user->email, $tempPassword);

        $sent = $this->ghl->sendEmail(
            $user->email,
            $user->name,
            'Welcome to BGR Client Portal – Your Account Details',
            $html,
            $contactId
        );

        if (! $sent) {
            $user->notify(new WelcomeClientNotification($user->email, $tempPassword));
        }
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
