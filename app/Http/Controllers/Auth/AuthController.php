<?php

namespace App\Http\Controllers\Auth;

use Exception;
use ErrorException;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\RateLimiter;


class AuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $email = $googleUser->getEmail();

            $user = User::where('email', $email)->first();

            Auth::login($user);
            $request->session()->regenerate();

            if ($user->role === 'admin') {
                return redirect('/admin/dashboard')->with('success', 'Welcome back, Admin ' . $user->name . '!');
            }

            return redirect('/user/dashboard')->with('success', 'Welcome back, ' . $user->name . '!');

        } catch (Exception $e) {
            return "Google Login Error: " . $e->getMessage();
        }
    }


    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
            'password' => 'required|string',
        ]);

        $loginInput = $request->email;
        $password = $request->input('password');
        $remember = $request->has('remember');

        $fieldType = 'email';
        $ip = $request->ip();
        $userAgent = $request->header('User-Agent');

        $throttleKey = hash('sha256', Str::lower($loginInput).'|'.$ip.'|'.$userAgent);
        $maxAttempts = 5;
        $lockoutSeconds = 3600;

        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);

            return back()->withErrors(['email' => "Too many login attempts. Try again in {$minutes} minute(s)."])
                ->withInput($request->only('email'));
        }

        if (! Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            RateLimiter::hit($throttleKey, $lockoutSeconds);
            $attemptsLeft = max(0, $maxAttempts - RateLimiter::attempts($throttleKey));

            return back()->withErrors(['email' => "Login failed. {$attemptsLeft} attempt(s) remaining."])
                ->with('error', 'Login failed. Please check your credentials.');
        }

        $user = Auth::user();
        $request->session()->regenerate();
        RateLimiter::clear($throttleKey);

        if ($user->role === 'admin') {
            return redirect('/admin/dashboard')->with('success', 'Welcome back, Admin ' . $user->name . '!');
        } else {
            return redirect('/user/dashboard')->with('success', 'Welcome back, ' . $user->name . '!');
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Logged out successfully!');
    }


}
