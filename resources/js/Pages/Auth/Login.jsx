// Login.jsx

import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import Swal from "sweetalert2";
import AuthenticationLayout from "@/Layouts/AuthenticationLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ForgotPassword from "@/Pages/Auth/ForgotPassword";
import { usePage } from "@inertiajs/react";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export default function Login() {

  const {
    data,
    setData,
    post,
    processing,
    errors,
  } = useForm({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const { props: pageProps } = usePage();

  useEffect(() => {
    if (pageProps.flash?.success) {
      (window.Toast || Toast).fire({
        icon: "success",
        title: pageProps.flash.success,
      });
    }
  }, [pageProps.flash?.success]);

  function handleSubmit(e) {
    e.preventDefault();

    post("/login", {
      onSuccess: (page) => {
        const message = page.props.flash?.success || "Welcome back!";
        (window.Toast || Toast).fire({
          icon: "success",
          title: message,
        });
      },
      onError: (errors, page) => {
        const message =
          page?.props?.flash?.error ||
          errors.email ||
          "Invalid email or password";

        (window.Toast || Toast).fire({
          icon: "error",
          title: message,
        });
      },
    });
  }

  const handleGoogleSignIn = () => {
      window.location.href = "/login/google";
  };


  return (
    <AuthenticationLayout>
      <div className="flex flex-col space-y-2 text-center">
        <div className="h-12 w-12 bg-primary rounded-xl mx-auto flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
          <Store className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nexus POS System Access
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage inventory, sales, and employees
        </p>
      </div>

      {/* Form Container */}
      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">

            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@store.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={processing}
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                className={`${errors.email
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-border"
                  }`}
              />
              {errors.email && (
                <p className="text-sm font-medium text-red-500 animate-in slide-in-from-top-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button" // Important: use type="button" to prevent form submission
                  onClick={() => setIsForgotModalOpen(true)} // Open the modal
                  className="text-sm font-medium text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={processing}
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                  className={`pr-10 ${errors.password ? "border-red-500" : "border-border"
                    }`}
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
              {errors.password && (
                <p className="text-sm font-medium text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={processing}>
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={processing}
            onClick={handleGoogleSignIn}
            className="shadow-sm"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>

      <ForgotPassword
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={data.email}
      />
    </AuthenticationLayout>
  );
}