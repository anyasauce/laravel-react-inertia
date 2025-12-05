// Pages/Auth/ResetPassword.jsx (Production Ready with hardcoded URL and Theming Fix)

import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { LockKeyhole, Loader2, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2'; 

// Import Authentication Layout
import AuthenticationLayout from "@/Layouts/AuthenticationLayout"; 

// Import Shadcn UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// NOTE: Define Toast Mixin (If not globally defined in app.js)
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

const showToast = (icon, title) => {
    (window.Toast || Toast).fire({ icon, title });
};


export default function ResetPassword({ name: initialName, errors: initialErrors = {} }) {
    // The name prop will be passed from the Controller via Inertia props.
    const name = initialName || 'System User'; 
    
    // The POST path for password update is '/reset-password'
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    
    // Merge initial errors with useForm errors
    const currentErrors = { ...initialErrors, ...errors };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // 🛑 FIX: Use hardcoded path '/reset-password' instead of route('password.update')
        post('/reset-password', {
            onError: (errors, page) => {
                const message = 
                    page?.props?.flash?.error ||
                    errors.password || 
                    errors.password_confirmation || 
                    'Error resetting password. Please try again.';
                showToast('error', message);
            },
            onSuccess: (page) => {
                 // The Controller handles redirection to the login page on success.
                 const message = page.props.flash?.success || 'Password reset successfully. Redirecting to login...';
                 showToast('success', message);
            }
        });
    };

    return (
        <AuthenticationLayout>
            <Head title="Reset Password" />
            
            {/* Card wrapper maintained for padding, background, and shadow */}
            <div className="w-full p-8 space-y-6 bg-card rounded-xl shadow-2xl shadow-primary/10"> 
                
                {/* Header */}
                <div className="flex flex-col space-y-2 text-center">
                    <div className="h-12 w-12 bg-primary rounded-xl mx-auto flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
                        <LockKeyhole className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Set New Password
                    </h1>
                    {name && (
                        <p className="text-sm text-muted-foreground">
                            Hello, <span className="font-semibold text-primary">{name}</span>. Enter your new password below.
                        </p>
                    )}
                </div>

                {/* Reset Form */}
                <form onSubmit={handleSubmit} className="grid gap-4">
                    
                    {/* New Password Input */}
                    <div className="grid gap-2">
                        {/* Replaced generic label with Shadcn Label */}
                        <Label htmlFor="password">
                            New Password
                        </Label>
                        <div className="relative">
                            {/* Replaced generic input with Shadcn Input, simplifying class string */}
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoFocus
                                className={`pr-10 ${currentErrors.password ? "border-red-500" : "border-border"}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    {showPassword ? "Hide password" : "Show password"}
                                </span>
                            </button>
                        </div>
                        {currentErrors.password && (
                            <p className="text-sm font-medium text-red-500">
                                {currentErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="grid gap-2">
                        {/* Replaced generic label with Shadcn Label */}
                        <Label htmlFor="password_confirmation">
                            Confirm Password
                        </Label>
                        {/* Replaced generic input with Shadcn Input, simplifying class string */}
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className={`${currentErrors.password_confirmation ? "border-red-500" : "border-border"}`}
                        />
                        {currentErrors.password_confirmation && (
                            <p className="text-sm font-medium text-red-500">
                                {currentErrors.password_confirmation}
                            </p>
                        )}
                    </div>

                    {/* Replaced generic button with Shadcn Button, simplifying class string */}
                    <Button
                        type="submit"
                        disabled={processing}
                        className="mt-2"
                    >
                        {processing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>
            </div>
        </AuthenticationLayout>
    );
}