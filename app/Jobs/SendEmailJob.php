<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Http\Controllers\Global\PHPMailerController;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    protected $to, $subject, $body;

    public function __construct($to, $subject, $body)
    {
        $this->to = $to;
        $this->subject = $subject;
        $this->body = $body;

        Log::info("SendEmailJob constructed for: {$to}");
    }

    public function handle()
    {
        try {
            Log::info("SendEmailJob started for: {$this->to}");

            $mailer = new PHPMailerController();

            // Optionally log before sending
            Log::info("Attempting to send email to: {$this->to}");

            $mailer->sendMail($this->to, $this->subject, $this->body);

            Log::info("SendEmailJob completed successfully for: {$this->to}");
        } catch (\Exception $e) {
            Log::error("SendEmailJob failed for: {$this->to}. Error: " . $e->getMessage());
        }
    }
}