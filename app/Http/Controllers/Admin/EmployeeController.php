<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Inertia\Inertia;
use App\Jobs\SendEmailJob;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Blade;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = User::where('role', 'user')
            ->latest()
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at->format('M d, Y'),
                    'initials' => collect(explode(' ', $user->name))
                        ->map(fn($segment) => $segment[0] ?? '')
                        ->take(2)
                        ->implode(''),
                ];
            });

        return Inertia::render('Dashboard/Admin/Employee', [
            'employees' => $employees,
            'stats' => [
                'total' => $employees->count(),
                'new_this_month' => User::where('role', 'user')->whereMonth('created_at', now()->month)->count(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
        ]);

        $password = Str::random(8);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($password),
            'role' => 'user',
        ]);
        dispatch(new SendEmailJob(
            $request->email,
            'Your New Account Credentials',
            $this->getNewUserAccountEmailContent($request->name, $request->email, $password)
        ));

        return redirect()->back()->with('success', 'Employee created successfully.');
    }


    private function getNewUserAccountEmailContent($name, $email, $password)
    {
        $loginUrl = url('/');

        $emailBody = <<<HTML
            <h2 style="color: #4F46E5;">Hello, {$name}</h2>
            <p style="font-size: 16px;">Your account has been successfully created. Below are your login details:</p>
            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p><strong>Login ID:</strong> <code>{$email}</code> <em></p>
                <p><strong>Password:</strong> <code>{$password}</code></p>
            </div>
            <p style="font-size: 16px;">You can log in here: <a href="{$loginUrl}">{$loginUrl}</a></p>
            <p style="font-size: 16px; margin-top: 20px;">Use either your email or your as your Login ID. Please keep your credentials secure.</p>
            <p style="font-size: 16px; color: #DC2626; margin-top: 20px;"><strong>Important:</strong> For security reasons, please change your password immediately after your first login.</p>
        HTML;

        return Blade::render(
            view('components.email-template', [
                'subject' => 'Account Details',
                'header' => 'Welcome to Nexus',
                'slot' => $emailBody,
            ])->render()
        );
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:8']);
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->back()->with('success', 'Employee removed successfully.');
    }
}
