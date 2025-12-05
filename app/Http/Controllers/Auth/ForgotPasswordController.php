<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailJob;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log; // Added Log import

class ForgotPasswordController extends Controller
{

    // ========================
    // 📝 SHOW FORMS
    // ========================
    public function showVerifyForm()
    {
        if (!Session::has('otp_email')) {
            return redirect()->route('login')->with('error', 'Please initiate password reset first.');
        }

        $email = Session::get('otp_email');
        return Inertia::render('Auth/Verify', ['email' => $email]);
    }

    // ========================
    // 📝 SHOW RESET FORMS
    // ========================
    public function showResetForm(Request $request)
    {
        if (!Session::has('otp_verified') || !Session::get('otp_verified')) {
            return redirect()->route('login')->with('error', 'Verification required before resetting password.');
        }

        $name = $request->query('name', null);
        return Inertia::render('Auth/ResetPassword', ['name' => $name]);
    }

    // ========================
    // 📩 SEND OTP
    // ========================
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'The provided email address is not registered.',
        ]);

        $email = $request->email;
        $otp = rand(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(5);

        Session::put('otp', $otp);
        Session::put('otp_email', $email);
        Session::put('otp_expires_at', $expiresAt);
        Session::put('otp_sent_at', now());
        Session::forget('otp_verified');

        $emailContent = $this->getOtpEmailContent($otp);
        dispatch(new SendEmailJob($email, 'Your OTP Code for Password Reset', $emailContent));

        return Inertia::location(route('verify.page'));
    }

    // ========================
    // 🔍 VERIFY OTP
    // ========================
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp' => 'required|numeric|digits:6',
        ]);

        if (!Session::has('otp')) {
            return back()->withErrors(['otp' => 'OTP session expired. Please restart the process.']);
        }

        $sessionOtp = Session::get('otp');
        $email = Session::get('otp_email');
        $expires = Session::get('otp_expires_at');

        if ((int)$request->otp !== (int)$sessionOtp) {
            return back()->withErrors(['otp' => 'Invalid OTP.']);
        }

        if (now()->greaterThan($expires)) {
            Session::forget(['otp', 'otp_expires_at']);
            return back()->withErrors(['otp' => 'OTP expired.']);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return back()->withErrors(['otp' => 'User not found.']);
        }

        Session::put('otp_verified', true);
        Session::forget(['otp', 'otp_expires_at']); // OTP served its purpose

        return redirect()->route('reset.page', ['name' => $user->name])
            ->with('success', 'OTP verified successfully. You can now reset your password.');
    }

    // ========================
    // 🔑 RESET PASSWORD
    // ========================
    public function resetPassword(Request $request)
    {
        if (!Session::has('otp_verified') || !Session::get('otp_verified')) {
            return redirect()->route('login')->with('error', 'Unauthorized access to password reset.');
        }

        $request->validate([
            'password' => 'required|confirmed|min:8',
        ]);

        $email = Session::get('otp_email') ?? $request->email;
        $user = User::where('email', $email)->first();

        if (!$user) {
            return back()->with('error', 'User session lost. Please restart the process.');
        }

        $user->password = Hash::make($request->password);
        $user->save();

        Session::forget(['otp', 'otp_email', 'otp_expires_at', 'otp_verified']);

        return redirect()->route('login')->with('success', 'Password reset successfully. You can now log in with your new password.');
    }

    // ========================
    // 📄 EMAIL TEMPLATE
    // ========================
    private function getOtpEmailContent($otp)
    {
        $emailBody = <<<HTML
            <h2 style="color: #4F46E5;">OTP Verification</h2>
            <p style="font-size: 16px;">You requested to reset your password. Use the OTP code below to verify your identity:</p>
            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; margin: 0;">{$otp}</p>
            </div>
            <p style="font-size: 16px;">This OTP is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
            <p style="font-size: 16px;">If you did not request a password reset, please ignore this message.</p>
        HTML;

        return Blade::render(
            view('components.email-template', [
                'subject' => 'OTP Verification',
                'header' => 'Verify Your Identity',
                'slot' => $emailBody,
            ])->render()
        );

    }
}