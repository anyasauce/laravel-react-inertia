<?php

namespace App\Http\Controllers\Global;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Blade;

class PHPMailerController extends Controller
{
    public function sendMail($to, $subject, $body)
    {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME', 'clams0706@gmail.com');
            $mail->Password   = env('MAIL_PASSWORD', 'chznocvacvlpaifm');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = env('MAIL_PORT', 587);

            $fromEmail = env('MAIL_FROM_ADDRESS', 'clams0706@gmail.com');
            $fromName  = env('MAIL_FROM_NAME') ?: config('app.name', 'CLAMS');

            if (empty($fromEmail) || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
                Log::error("Invalid From address configured: {$fromEmail}. Falling back to default.");
                $fromEmail = 'clams0706@gmail.com';
                $fromName  = 'CLAMS';
            }

            // Recipients
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            $mail->send();
            Log::info("PHPMailer sent successfully to {$to}");
            return true;
        } catch (Exception $e) {
            Log::error("PHPMailer error for {$to}: " . $e->getMessage());
            return "Error: " . $e->getMessage();
        }
    }
}