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
            ->action('Log In to Your Portal', $loginUrl)
            ->line('You will be asked to change your password after your first login.')
            ->line('If you have any questions, please contact our team.');
    }

    public static function buildHtml(string $name, string $email, string $tempPassword): string
    {
        $loginUrl = url('/login');

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Welcome to BGR Client Portal</title>
        </head>
        <body style="margin:0;padding:0;background:#F1F1EF;font-family:'Inter',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F1EF;padding:40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                            <!-- Header -->
                            <tr>
                                <td style="background:#25282D;border-radius:12px 12px 0 0;padding:36px 36px 28px;text-align:center;">
                                    <p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:0.12em;text-transform:uppercase;">Bespoke Garden Rooms</p>
                                    <p style="margin:0 0 12px;font-size:11px;font-weight:300;color:rgba(255,255,255,0.38);letter-spacing:0.18em;text-transform:uppercase;">Ballycastle</p>
                                    <p style="margin:0;font-size:11px;font-weight:500;color:#B2945B;letter-spacing:0.22em;text-transform:uppercase;">Client Portal</p>
                                </td>
                            </tr>

                            <!-- Divider accent -->
                            <tr>
                                <td style="background:#B2945B;height:2px;font-size:0;line-height:0;">&nbsp;</td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="background:#ffffff;padding:36px;border-radius:0 0 12px 12px;">
                                    <p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#25282D;">Welcome to the Portal</p>
                                    <p style="margin:0 0 24px;font-size:13px;color:#888480;">Your account has been created successfully.</p>

                                    <p style="margin:0 0 20px;font-size:14px;color:#4A4A4A;line-height:1.7;">
                                        Hi {$name}, your BGR Client Portal account is ready. Use the credentials below to log in and track your project.
                                    </p>

                                    <!-- Credentials box -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F1EF;border-radius:8px;border:0.5px solid #D1CDC7;margin-bottom:28px;">
                                        <tr>
                                            <td style="padding:14px 20px 4px;">
                                                <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;color:#888480;text-transform:uppercase;">Your Login Credentials</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:8px 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0" style="border-top:0.5px solid #D1CDC7;">
                                                    <tr>
                                                        <td style="padding:10px 0 6px;font-size:12px;color:#888480;width:42%;">Email</td>
                                                        <td style="padding:10px 0 6px;font-size:13px;font-weight:600;color:#25282D;">{$email}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:6px 0 10px;font-size:12px;color:#888480;border-top:0.5px solid #D1CDC7;">Temporary Password</td>
                                                        <td style="padding:6px 0 10px;font-size:13px;font-weight:600;color:#25282D;letter-spacing:0.04em;border-top:0.5px solid #D1CDC7;">{$tempPassword}</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CTA button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding:0 0 28px;">
                                                <a href="{$loginUrl}"
                                                   style="display:inline-block;padding:13px 36px;background:#25282D;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.04em;">
                                                    Log In to Your Portal
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:0;font-size:12px;color:#888480;line-height:1.6;">
                                        You will be prompted to set a new password on your first login.
                                        Keep your credentials safe and do not share them with anyone.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding:20px 0;text-align:center;">
                                    <p style="margin:0;font-size:11px;color:#B0AFAA;">
                                        © BGR Client Portal · Ballycastle, Northern Ireland
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
