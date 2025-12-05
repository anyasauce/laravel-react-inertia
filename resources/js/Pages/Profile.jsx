import React from "react";
import { usePage, useForm } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { 
    User, 
    Lock, 
    Shield, 
    Save, 
    Loader2, 
    KeyRound,
    Mail
} from "lucide-react";

export default function Profile() {
    const { auth, flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        name: auth?.user?.name || "",
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    // Helper for Avatar Initials
    const getInitials = (name) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";
    };

    function handleSubmit(e) {
        e.preventDefault();

        put("/profile", {
            onSuccess: (page) => {
                const message = page.props.flash?.success;
                if (typeof Toast !== 'undefined') {
                    Toast.fire({ icon: "success", title: message });
                }
            },
            onError: (errors, page) => {
                const message =
                    page?.props?.flash?.error ||
                    errors.name ||
                    errors.email ||
                    "Something went wrong";
                
                if (typeof Toast !== 'undefined') {
                    Toast.fire({ icon: "error", title: message });
                }
            },
        });
    }

    if (!auth?.user) {
        return <div className="p-8 text-center">Please log in to view your profile.</div>;
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 p-4 md:p-8 max-w-6xl mx-auto">
                
                {/* Page Header */}
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your profile information and account security settings.
                    </p>
                </div>

                <Separator />

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-12 lg:gap-8">
                        
                        {/* LEFT COLUMN: User Card (3 cols) */}
                        <div className="md:col-span-4 lg:col-span-3 space-y-6">
                            {/* FIX: Ensure Card uses standard theme background/shadow */}
                            <Card className="shadow-lg overflow-hidden">
                                {/* FIX 1: Use bg-muted for the banner, ensuring contrast flip */}
                                <div className="bg-muted h-24 w-full relative">
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                        <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                                            <AvatarImage src={auth.user.avatar} />
                                            {/* Avatar Fallback is already theme-aware: bg-primary text-primary-foreground */}
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                                {getInitials(auth.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                                <CardContent className="pt-12 text-center pb-6">
                                    <h2 className="text-xl font-bold">{auth.user.name}</h2>
                                    <p className="text-sm text-muted-foreground mb-3">{auth.user.email}</p>
                                    <div className="flex justify-center">
                                      {/* FIX 2: Use theme-aware secondary colors for the badge */}
                                      <Badge
                                          variant="outline"
                                          className="px-3 py-1 bg-secondary text-secondary-foreground border-border gap-1.5 capitalize"
                                      >
                                          <Shield className="w-3 h-3" />
                                          {auth.user.role === 'user' ? 'Employee' : auth.user.role === 'admin' ? 'Admin' : 'Guest'}
                                      </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Forms (9 cols) */}
                        <div className="md:col-span-8 lg:col-span-9 space-y-6">
                            
                            {/* General Information Card */}
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your display name and public information.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                className="pl-9"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                className="pl-9 bg-muted/50"
                                                value={auth.user.email}
                                                disabled
                                                title="Contact admin to change email"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Email cannot be changed manually.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Security Card */}
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-muted-foreground" />
                                        Security & Password
                                    </CardTitle>
                                    <CardDescription>
                                        Ensure your account is using a long, random password to stay secure.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password">Current Password</Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="current_password"
                                                type="password"
                                                className="pl-9"
                                                value={data.current_password}
                                                onChange={(e) => setData('current_password', e.target.value)}
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                        {errors.current_password && <p className="text-red-500 text-sm">{errors.current_password}</p>}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="new_password">New Password</Label>
                                            <Input
                                                id="new_password"
                                                type="password"
                                                value={data.new_password}
                                                onChange={(e) => setData('new_password', e.target.value)}
                                                placeholder="Min. 8 characters"
                                            />
                                            {errors.new_password && <p className="text-red-500 text-sm">{errors.new_password}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="new_password_confirmation">Confirm Password</Label>
                                            <Input
                                                id="new_password_confirmation"
                                                type="password"
                                                value={data.new_password_confirmation}
                                                onChange={(e) => setData('new_password_confirmation', e.target.value)}
                                                placeholder="Re-enter new password"
                                            />
                                            {errors.new_password_confirmation && <p className="text-red-500 text-sm">{errors.new_password_confirmation}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                                {/* FIX 3: Use bg-muted/50 for a lighter footer background that flips in dark mode */}
                                <CardFooter className="bg-muted/50 border-t border-border/50 px-6 py-4 flex justify-end">
                                    <Button type="submit" disabled={processing} className="min-w-[120px]">
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}