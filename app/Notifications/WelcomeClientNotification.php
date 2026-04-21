<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeClientNotification extends Notification
{
    use Queueable;

    public function __construct(
        private string $email,
        private string $tempPassword
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = url('/login');

        return (new MailMessage)
            ->subject('Welcome to BGR Client Portal – Your Account Details')
            ->greeting("Hi {$notifiable->name},")
            ->line('Your BGR Client Portal account has been created.')
            ->line("**Email:** {$this->email}")
            ->line("**Temporary Password:** {$this->tempPassword}")
            ->action('Log In Now', $loginUrl)
            ->line('You will be asked to change your password after your first login.')
            ->line('If you have any questions, please contact our team.');
    }

    /**
     * Build the branded HTML email body.
     * Logo is base64-encoded inline so it renders in all email clients
     * regardless of server URL or local development environment.
     */
    public static function buildHtml(string $name, string $email, string $tempPassword): string
    {
        $appName  = 'BGR Client Portal';
        $loginUrl = url('/login');
        $logoUrl  = 'https://res.cloudinary.com/dlh4kthyq/image/upload/v1776755742/bgr/brand/bgr-logo.png';

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Welcome to {$appName}</title>
        </head>
        <body style="margin:0;padding:0;background:#f2f0eb;font-family:'Inter',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0eb;padding:40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#1a2e1a,#0f1f0f);border-radius:16px 16px 0 0;padding:32px 36px 24px;text-align:center;">
                                    <img src="{$logoUrl}" alt="BGR Client Portal" style="max-width:180px;height:auto;display:block;margin:0 auto 16px;">
                                    <p style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Welcome to BGR Client Portal</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="background:#ffffff;padding:36px;border-radius:0 0 16px 16px;">
                                    <p style="margin:0 0 16px;font-size:15px;color:#3a3a32;">Hi {$name},</p>
                                    <p style="margin:0 0 24px;font-size:14px;color:#6a6a62;line-height:1.7;">
                                        Your BGR Client Portal account has been created. Use the credentials below to log in and track your project.
                                    </p>

                                    <!-- Credentials box -->
                                    <div style="background:#f7f6f3;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                                        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#9a9a92;text-transform:uppercase;">Your Login Credentials</p>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:6px 0;font-size:13px;color:#6a6a62;width:40%;">Email</td>
                                                <td style="padding:6px 0;font-size:14px;font-weight:600;color:#3a3a32;">{$email}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;font-size:13px;color:#6a6a62;">Temporary Password</td>
                                                <td style="padding:6px 0;font-size:14px;font-weight:600;color:#3a3a32;letter-spacing:0.05em;">{$tempPassword}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- CTA button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding:0 0 28px;">
                                                <a href="{$loginUrl}"
                                                   style="display:inline-block;padding:14px 36px;background:#3d5c10;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.02em;">
                                                    Log In to Your Portal
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:0;font-size:13px;color:#9a9a92;line-height:1.6;">
                                        You will be prompted to set a new password on your first login.
                                        Keep your credentials safe and do not share them with anyone.
                                    </p>
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
