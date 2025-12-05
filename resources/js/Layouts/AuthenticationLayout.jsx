// AuthenticationLayout.jsx (FIXED: Animation removed)

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { ShoppingBag } from "lucide-react";

export default function AuthenticationLayout({ children }) {
  return (
    // The main grid wrapper - Removed transition-colors duration-300
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background text-foreground">
        
        {/* LEFT COLUMN: Content (Login form, Register form, etc.) */}
        {/* Removed transition-colors duration-300 */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="mx-auto grid w-full max-w-[400px] gap-6">
            
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-10 lg:right-auto lg:left-4">
                <ModeToggle />
            </div>

            {children}
          </div>
        </div>

        {/* RIGHT COLUMN: Visual/Art Section (No changes needed here) */}
        <div className="relative hidden h-full flex-col bg-card p-10 text-card-foreground dark:border-l lg:flex">
          {/* Background Image / Pattern */}
          <div className="absolute inset-0 bg-card">
            {/* Abstract Pattern */}
            <svg className="absolute inset-0 h-full w-full stroke-muted-foreground/30" fill="none">
              <defs>
                <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 40L40 0H20L0 20M40 40V20L20 40" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-card via-card/80 to-primary/20" />
          </div>

          {/* Content over image */}
          <div className="relative z-20 flex items-center text-lg font-medium text-foreground">
            <ShoppingBag className="mr-2 h-6 w-6" />
            Nexus POS
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg leading-relaxed">
                &ldquo;Modernizing your retail operations starts here. The right POS system doesn't just record sales; it unlocks the full potential of your business through speed, accuracy, and insight.&rdquo;
              </p>
              <footer className="text-sm font-medium text-muted-foreground">System Administrator</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}