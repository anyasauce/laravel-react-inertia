import React from "react";
import { usePage, Link } from "@inertiajs/react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChevronDown,
    User,
    Settings,
    LogOut,
    ShieldCheck,
    LayoutDashboard,
    Menu,
    Calendar,
    Bell,
    Store 
} from "lucide-react";
import { useForm, router } from '@inertiajs/react';

// Import SweetAlert2 and define Toast mixin
import Swal from "sweetalert2"; 
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

// The local definition remains for onError handling (no redirect).

const SystemStatus = {
    database: 'online', 
    inventorySync: 'delay', 
    paymentGateway: 'error', 
};

const unreadNotifications = 3; 

const StatusIndicator = React.memo(({ status }) => {
    let colorClass = 'bg-gray-400';
    let tooltip = 'Status Unknown';

    if (status === 'online') {
        colorClass = 'bg-green-500';
        tooltip = 'Database Online (Green)';
    } else if (status === 'delay') {
        colorClass = 'bg-orange-500';
        tooltip = 'Inventory Sync Delayed (Orange)';
    } else if (status === 'error') {
        colorClass = 'bg-red-500';
        tooltip = 'Payment Gateway Error (Red)';
    }

    return (
        <div 
            className={`w-2 h-2 rounded-full ${colorClass} transition-colors duration-200 shadow-md`}
            title={tooltip}
        ></div>
    );
});


export default function Header({ onMenuToggle }) {
    const { auth } = usePage().props;

    const role = auth?.user?.role || "user";
    const isAdmin = role === "admin";

    const settingsRoute = role === "admin" ? "/admin/settings" : "/user/settings";

    const getInitials = (name) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";
    };

    const adminMenuItems = (
        <>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Panel
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Dashboard
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
        </>
    );
    
    const handleLogout = (e) => {
    e.preventDefault();

    // Use Inertia post like Laravel expects
    router.post("/logout", {
        onSuccess: () => {
            // The redirect happens automatically, no need for manual toast here
            // Optional: you can let the home page read the flash message and display toast
            console.log("✅ Logout SUCCESS, redirected to home.");
        },
        onError: (errors, page) => {
            // If any error happens before redirect
            const message = page?.props?.flash?.error || "Failed to logout!";
            (window.Toast || Toast).fire({ icon: "error", title: message });
        },
    });
};

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4">

                {/* 🌟 LEFT SECTION: Controls, Branding (Responsive), Status, and Calendar */}
                <div className="flex items-center gap-4">
                    
                    {/* 1. HAMBURGER MENU - Mobile Only */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden -ml-2 text-muted-foreground hover:text-primary"
                        onClick={onMenuToggle}
                    >
                        <Menu className="w-6 h-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>

                    {/* 2. BRANDING Block (HIDDEN ON DESKTOP) */}
                    {/* 👇 FIX: Apply md:hidden to hide the entire block on desktop screens */}
                    <div className="flex items-center gap-2 md:hidden">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20 shrink-0">
                            <Store className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                             <h1 className="text-base font-bold leading-none tracking-tight text-foreground whitespace-nowrap">
                                Nexus POS
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium sm:text-xs whitespace-nowrap">
                                {isAdmin ? "Admin Workspace" : "Retail Terminal"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-2 pl-4 h-full py-2">
                        
                        <div className="flex items-center gap-1 p-2 rounded-full bg-muted/50 border border-border/50">
                            <StatusIndicator status={SystemStatus.paymentGateway} /> 
                            <StatusIndicator status={SystemStatus.inventorySync} /> 
                            <StatusIndicator status={SystemStatus.database} />       
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-primary h-9 w-9"
                            onClick={() => router.visit('/calendar')}
                            title="View Calendar"
                        >
                            <Calendar className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                {/* 👆 END LEFT SECTION */}


                {/* 🌟 RIGHT SECTION: Notifications, Badge, and User Menu */}
                <div className="flex items-center gap-2 md:gap-4">

                    {/* Notification Button (Enhanced Interactivity) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative text-muted-foreground hover:text-primary h-9 w-9"
                        onClick={() => console.log('Open Notifications')}
                        title={`You have ${unreadNotifications} unread notifications`}
                    >
                        {/* Interactive Bell Icon: Shakes if unread notifications exist */}
                        <Bell className={`w-5 h-5 ${unreadNotifications > 0 ? 'animate-wiggle' : ''}`} />
                        
                        {unreadNotifications > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                {unreadNotifications}
                            </span>
                        )}
                    </Button>
                    
                    {/* Role Badge (Separated slightly for visual break) */}
                    {isAdmin && (
                        <Badge
                            variant="secondary"
                            className="hidden md:flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                        >
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                        </Badge>
                    )}

                    {/* User Dropdown */}
                    {auth?.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 h-auto py-1 px-1 md:py-2 md:px-2 
                                        hover:bg-muted rounded-full md:rounded-lg border border-transparent hover:border-border transition-all"
                                >
                                    <Avatar className="w-8 h-8 md:w-8 md:h-8 border-2 border-background shadow-sm">
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Name & Email - Hidden on Mobile */}
                                    <div className="hidden md:flex flex-col items-start">
                                        <span className="text-sm font-semibold leading-none max-w-[200px] truncate text-foreground">
                                            {auth.user.name}
                                        </span>
                                    </div>
                                    <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-70">
                                <div className="p-1">
                                    {/* Admin Section */}
                                    {isAdmin && adminMenuItems}

                                    {/* Account Section */}
                                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                                        Account
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                            <User className="w-4 h-4 text-primary" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={settingsRoute}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Settings className="w-4 h-4 text-primary" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-2" />

                                    {/* Logout */}
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}