// Pages/Auth/ForgotPassword.jsx

import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Loader2, Mail } from "lucide-react";
import Swal from "sweetalert2";

// Import Shadcn UI Components for the Modal
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

/**
 * ForgotPassword Component
 *
 * @param {boolean} isOpen
 * @param {function} onClose 
 * @param {string} initialEmail 
 */
export default function ForgotPassword({ isOpen, onClose, initialEmail = "" }) {
    const {
        data: resetData,
        setData: setResetData,
        post: resetPost,
        processing: resetProcessing,
        errors: resetErrors,
        reset: resetForm,
    } = useForm({
        email: initialEmail,
    });

    useEffect(() => {
        if (initialEmail && !resetData.email) {
            setResetData("email", initialEmail);
        }
    }, [initialEmail, resetData.email, setResetData]);

    function handleForgotPassword(e) {
        e.preventDefault();

        resetPost("/forgot-password", {
            onSuccess: (page) => {
                const message = page.props.flash?.success || "Password reset link sent to your email!";
                (window.Toast || Toast).fire({
                    icon: "success",
                    title: message,
                });
                onClose();
                resetForm();
            },
            onError: (errors, page) => {
                const message =
                    page?.props?.flash?.error ||
                    resetErrors.email ||
                    "Could not process request. Please check your email.";

                (window.Toast || Toast).fire({
                    icon: "error",
                    title: message,
                });
            },
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Reset Your Password
                    </DialogTitle>
                    <DialogDescription>
                        Enter the email address associated with your account. We will send you a password reset link.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleForgotPassword} className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reset-email">
                            Email Address
                        </Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="manager@store.com"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={resetProcessing}
                            value={resetData.email}
                            onChange={(e) => setResetData("email", e.target.value)}
                            className={`${resetErrors.email ? "border-red-500 focus-visible:ring-red-500" : "border-border"}`}
                        />
                        {resetErrors.email && (
                            <p className="text-sm font-medium text-red-500 animate-in slide-in-from-top-1">
                                {resetErrors.email}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={resetProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={resetProcessing}
                        >
                            {resetProcessing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}