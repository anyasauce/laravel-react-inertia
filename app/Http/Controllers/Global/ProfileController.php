<?php

namespace App\Http\Controllers\Global;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    // Show the profile page
    public function edit()
    {
        return Inertia::render('Profile');
    }

    // Update profile data
    public function update(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'current_password' => ['nullable', 'required_with:new_password', 'string'],
            'new_password' => ['nullable', 'required_with:current_password', 'string', 'min:8', 'confirmed'],
        ]);

        $user = Auth::user();

        // Update name
        $user->name = $request->input('name');

        // If user wants to change password
        if ($request->filled('current_password') && $request->filled('new_password')) {
            // Check current password
            if (!Hash::check($request->current_password, $user->password)) {
                return back()->withErrors(['current_password' => 'Current password is incorrect.']);
            }
            // Update password
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return redirect()->route('profile')->with('success', 'Profile updated successfully.');
    }
}
