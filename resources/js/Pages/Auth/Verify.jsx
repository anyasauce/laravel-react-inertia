// Pages/Auth/Verify.jsx

import React, { useState, useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Loader2, MailCheck, RotateCw } from 'lucide-react';
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

// --- Cooldown Constants ---
const COOLDOWN_KEY = 'otpResendTimestamp';
const COOLDOWN_DURATION_MS = 60000; // 60 seconds

export default function Verify({ email: initialEmail, errors: initialErrors = {} }) {
    const email = initialEmail || ''; 
    const [cooldown, setCooldown] = useState(0); 

    // --- 1. Primary Form (OTP Verification) ---
    const { data, setData, post, processing, errors } = useForm({
        otp: '',
    });
    
    // --- 2. Secondary Form (Resend Email Action) ---
    const {
        post: resendPost,
        processing: isResending,
    } = useForm({
        email: email, // Initialize the resend form with the email prop
    });

    const currentErrors = { ...initialErrors, ...errors };

    // --- 3. Cooldown Initialization (Check localStorage on mount) ---
    useEffect(() => {
        const lastSentTime = localStorage.getItem(COOLDOWN_KEY);
        const currentTime = Date.now();

        if (lastSentTime) {
            const elapsed = currentTime - parseInt(lastSentTime, 10);
            const remaining = COOLDOWN_DURATION_MS - elapsed;

            if (remaining > 0) {
                setCooldown(Math.ceil(remaining / 1000));
            } else {
                localStorage.removeItem(COOLDOWN_KEY);
            }
        } else if (email) {
            // Start the cooldown and save the current time (initial OTP sent)
            localStorage.setItem(COOLDOWN_KEY, currentTime.toString());
            setCooldown(COOLDOWN_DURATION_MS / 1000);
        }
    }, [email]);

    // --- 4. Cooldown Timer (Runs countdown) ---
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        localStorage.removeItem(COOLDOWN_KEY);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post('/verify-otp', {
            onError: (errors, page) => {
                const message = 
                    page?.props?.flash?.error ||
                    errors.otp ||
                    'Invalid OTP or session expired.';
                showToast('error', message);
            },
            onSuccess: (page) => {
                 const message = page.props.flash?.success || 'OTP Verified! Redirecting...';
                 showToast('success', message);
            }
        });
    };

    const handleResend = () => {
        if (isResending || cooldown > 0) return;
        
        if (!email) {
            showToast('error', 'Error: Cannot resend OTP. The email address for this session is missing.');
            return;
        }

        resendPost('/forgot-password', {
            onError: (errors, page) => {
                const message = 
                    page?.props?.flash?.error ||
                    errors.email ||
                    'Could not resend OTP. Please check the email address.';
                showToast('error', message);
            },
            onSuccess: (page) => {
                localStorage.setItem(COOLDOWN_KEY, Date.now().toString()); 
                setCooldown(COOLDOWN_DURATION_MS / 1000); 
                const message = page.props.flash?.success || 'A new OTP has been sent to your email.';
                showToast('success', message);
            },
            replace: true, 
        });
    };

    // Dynamic button text
    const buttonText = isResending 
        ? "Sending..." 
        : cooldown > 0
        ? `Resend in ${cooldown}s` 
        : "Resend";

    return (
        <AuthenticationLayout>
            <Head title="Verify OTP" />
            
            {/* The content container that provides the card look. */}
            {/* NOTE: We removed the outer background/centering div as the Layout handles it. */}
            <div className="w-full space-y-6">
                
                {/* Header */}
                <div className="flex flex-col space-y-2 text-center">
                    <div className="h-12 w-12 bg-primary rounded-xl mx-auto flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
                        <MailCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Verify Identity
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        We sent a 6-digit code to <span className="font-semibold text-primary">{email || 'your email'}</span>. Please enter it below.
                    </p>
                </div>

                {/* Verification Form */}
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="otp">
                            One-Time Password (OTP)
                        </Label>
                        <Input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="6"
                            placeholder="e.g. 123456"
                            value={data.otp}
                            onChange={(e) => setData('otp', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            autoFocus
                            // Custom class for OTP tracking/spacing
                            className={`text-center text-lg tracking-[0.5em] ${currentErrors.otp ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'
                                }`}
                        />
                        {currentErrors.otp && (
                            <p className="text-sm font-medium text-red-500">
                                {currentErrors.otp}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={processing || data.otp.length !== 6}
                    >
                        {processing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Verify Code"
                        )}
                    </Button>
                </form>

                {/* Resend Link */}
                <div className="text-center mt-4">
                    <Button
                        type="button"
                        variant="link"
                        onClick={handleResend}
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center w-full p-0 h-auto"
                        // Disable if: Resending, primary form processing, email is missing, OR cooldown is active
                        disabled={isResending || processing || !email || cooldown > 0} 
                    >
                        {isResending ? (
                             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : cooldown > 0 ? (
                             <RotateCw className="h-4 w-4 mr-2 opacity-50" />
                        ) : (
                             <RotateCw className="h-4 w-4 mr-2" />
                        )}
                        
                        Didn't receive the code? {buttonText}
                    </Button>
                </div>
            </div>
        </AuthenticationLayout>
    );
}