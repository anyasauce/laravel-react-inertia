<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
Use Inertia\Inertia;

class AuthController extends Controller
{   
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    public function showRegisterForm()
    {
        return Inertia::render('Auth/Register');
    }
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|confirmed|min:8|letters|numbers|mixedCase|symbols',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);    

        Auth::login($user);

        return redirect('/user/dashboard')->with('success', 'Registered successfully!');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
            'password' => 'required|string',
        ]);

        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();
            
            return redirect('/user/dashboard')->with('success', 'Welcome back, ' . $user->name . '!');
        }

        return back()->withErrors([
            'email' => 'These credentials do not match our records.',
        ])->with('error', 'Login failed. Please check your credentials.');
    }

    public function logout()
    {
        Auth::logout();

        return redirect('/login')->with('success', 'Logged out successfully!');
    }
}
