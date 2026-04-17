<?php

namespace App\Notifications;

use App\Services\GHLService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class GHLResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): \Illuminate\Notifications\Messages\MailMessage
    {
        $resetUrl = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $expiry = config('auth.passwords.users.expire', 60);

        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('Reset your BGR Client Portal password')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $resetUrl)
            ->line("This password reset link will expire in {$expiry} minutes.")
            ->line('If you did not request a password reset, no further action is required.');
    }

    /**
     * Build the branded HTML email body for GHL sending.
     */
    public static function buildHtml(string $name, string $resetUrl): string
    {
        $appName = config('app.name', 'BGR Client Portal');
        $expiry  = config('auth.passwords.users.expire', 60);

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Reset your password</title>
        </head>
        <body style="margin:0;padding:0;background:#f2f0eb;font-family:'Inter',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0eb;padding:40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#1a2e1a,#0f1f0f);border-radius:16px 16px 0 0;padding:32px 36px 24px;text-align:center;">
                                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.2em;color:#8aab35;text-transform:uppercase;">{$appName}</p>
                                    <p style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Reset Your Password</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="background:#ffffff;padding:36px;border-radius:0 0 16px 16px;">
                                    <p style="margin:0 0 16px;font-size:15px;color:#3a3a32;">Hi {$name},</p>
                                    <p style="margin:0 0 24px;font-size:14px;color:#6a6a62;line-height:1.7;">
                                        We received a request to reset your password for your BGR Client Portal account.
                                        Click the button below to choose a new password.
                                    </p>

                                    <!-- CTA button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding:8px 0 28px;">
                                                <a href="{$resetUrl}"
                                                   style="display:inline-block;padding:14px 36px;background:#3d5c10;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.02em;">
                                                    Reset Password
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:0 0 12px;font-size:13px;color:#9a9a92;">
                                        This link will expire in <strong>{$expiry} minutes</strong>.
                                        If you didn't request a password reset, no action is needed.
                                    </p>

                                    <!-- Fallback URL -->
                                    <div style="background:#f7f6f3;border-radius:8px;padding:14px 16px;margin-top:20px;">
                                        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#9a9a92;text-transform:uppercase;letter-spacing:0.05em;">
                                            Button not working? Copy this link:
                                        </p>
                                        <p style="margin:0;font-size:12px;color:#3d5c10;word-break:break-all;">{$resetUrl}</p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding:20px 0;text-align:center;">
                                    <p style="margin:0;font-size:11px;color:#b0afaa;">
                                        © {$appName} · Ballycastle, Northern Ireland
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        HTML;
    }
}
