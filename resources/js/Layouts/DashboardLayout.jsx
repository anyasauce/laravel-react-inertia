// DashboardLayout.jsx

import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <ThemeProvider defaultTheme="system">
        <div className="min-h-screen flex bg-background text-foreground">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-col grow w-full">
                <Header onMenuToggle={toggleSidebar}  />
                <main className="grow px-4 py-6 w-full">
                    <div className="max-w-full w-full mx-auto">{children}</div>
                </main>

                <Footer />
            </div>
        </div>
        </ThemeProvider>
    );
}