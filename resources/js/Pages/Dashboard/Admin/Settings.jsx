import React, { useState, useEffect, useCallback } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DollarSign, Save, Palette, Sun, Moon, Monitor, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/components/theme-provider'; 

// --- Theme Color Utilities ---

// Define the default visual color key based on the mode ('black' or 'white' maps to HUE 0)
const getDefaultColorKey = (mode) => (mode === 'dark' ? 'white' : 'black');

// If no saved color is found, fallback to the mode-specific default key
const getSavedColor = (mode) => localStorage.getItem(`theme-color-${mode}`) || getDefaultColorKey(mode);

const getSystemColorMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Added 'black' and 'white' (both map to HUE 0, which is grayscale)
const themeHues = {
    'indigo': 270, 'blue': 250, 'cyan': 200, 'emerald': 150, 'amber': 50, 'rose': 350, 'purple': 300, 
    'black': 0, 
    'white': 0,
};

// Function to save color choice and apply HUE and CHROMA variables to the DOM instantly
const saveAndApplyColor = (modeKey, color) => {
    const hue = themeHues[color] || themeHues[getDefaultColorKey(modeKey)];
    const root = window.document.documentElement;
    
    // Determine if the selected color is meant to be achromatic (black/white)
    const isAchromatic = color === 'black' || color === 'white';
    
    // 1. Save color name to localStorage (ALWAYS)
    localStorage.setItem(`theme-color-${modeKey}`, color);
    
    // 2. Check if the picker mode (modeKey) matches the currently active visual mode
    const isDarkVisual = root.classList.contains('dark');
    const activeVisualMode = isDarkVisual ? 'dark' : 'light';

    if (modeKey === activeVisualMode) {
        // 3. ONLY Apply to the DOM if the picker matches the current mode
        
        // --- CHROMA and HUE ---
        root.style.setProperty('--primary-h', hue);
        root.style.setProperty('--sidebar-primary-h', hue);
        root.style.setProperty('--primary-c', isAchromatic ? 0 : 0.1);
        root.style.setProperty('--sidebar-primary-c', isAchromatic ? 0 : 0.1);
        
        // --- LIGHTNESS & FOREGROUND FIX for Dark Mode ---
        if (activeVisualMode === 'dark') {
            const isWhiteAccent = color === 'white';
            
            // 1. Set Lightness (L)
            if (isWhiteAccent) {
                root.style.setProperty('--primary-l-dark', 0.99);
                root.style.setProperty('--sidebar-primary-l-dark', 0.95);
            } else {
                // Otherwise, revert to the original lightness defaults defined in CSS
                root.style.setProperty('--primary-l-dark', 0.75);
                root.style.setProperty('--sidebar-primary-l-dark', 0.6);
            }
            
            // 2. Set Foreground based on Lightness of the accent color (Black text on Light/White accents)
            if (isWhiteAccent) {
                // Dark text on white background
                root.style.setProperty('--primary-foreground', 'oklch(0.205 0 0)'); 
            } else {
                // White text on colored/dark background (for all others)
                root.style.setProperty('--primary-foreground', 'oklch(0.985 0 0)'); 
            }
        } else {
            // Light mode: Text is always white for contrast against the dark L=0.205 primary background
            root.style.setProperty('--primary-foreground', 'oklch(0.985 0 0)'); 
        }
    }
};


// --- Color Picker Subcomponent (Updated to include reset button logic) ---
const ColorPicker = ({ mode, activeColor, onColorChange, onClear }) => {
    
    const getSwatchClasses = (color) => {
        // Use general light backgrounds for swatches, except for white
        if (color === 'white') return `bg-gray-100 border border-border/50`;
        if (color === 'black') return `bg-gray-700`;
        return `bg-${color}-200`; 
    };
    
    const getDotStyle = (color) => {
        const hexMap = {
            'indigo': '#4f46e5', 'blue': '#3b82f6', 'cyan': '#06b6d4', 'emerald': '#10b981', 
            'amber': '#f59e0b', 'rose': '#f43f5e', 'purple': '#a855f7', 
            'black': '#171717', // Visual black
            'white': '#ffffff', // Visual white
        };
        return { 
            backgroundColor: hexMap[color] || '#4f46e5',
            // Add a border for the white swatch so it's visible on a white background
            border: color === 'white' ? '1px solid #d1d5db' : 'none'
        };
    };

    // Determine the current mode's default key for the clear button check
    const defaultKey = getDefaultColorKey(mode);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
                <Label className="font-semibold text-foreground flex items-center gap-1">
                    {mode === 'light' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-primary" />}
                    Accent Color in <span className="font-bold capitalize">{mode} Mode</span>
                </Label>
                {/* Clear button appears if the current color is not the mode's default key */}
                {activeColor !== defaultKey && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClear}
                        className="text-sm text-muted-foreground hover:text-red-500"
                        aria-label={`Clear ${mode} color to default`}
                    >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>
            
            <div className="flex flex-wrap gap-3">
                {Object.keys(themeHues).map(color => (
                    <button
                        key={color}
                        onClick={() => onColorChange(mode, color)}
                        className={`w-10 h-10 rounded-full border-2 border-transparent transition-all 
                            ${activeColor === color ? 'ring-4 ring-offset-2 ring-primary' : 'hover:ring-2 hover:ring-offset-2 hover:ring-muted-foreground/50'} 
                            ${getSwatchClasses(color)}`}
                        aria-label={`Select ${color} for ${mode} mode`}
                    >
                        <div 
                            className={`w-full h-full rounded-full flex items-center justify-center`}
                            style={getDotStyle(color)}
                        >
                            {/* Ensure checkmark is visible against black or other dark colors */}
                            {activeColor === color && <Save className={`h-4 w-4 ${color === 'white' ? 'text-gray-900' : 'text-white'}`} />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Inlined ModeToggle Component Logic ---
const ModeToggle = () => {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
// --- End Inlined ModeToggle ---


export default function Settings({ targets }) {
    const { flash, auth } = usePage().props;
    const userRole = auth?.user?.role;
    const isAdmin = userRole === 'admin';
    
    const { theme: contextThemeMode } = useTheme();

    // Local color states
    const [lightColor, setLightColor] = useState(getSavedColor('light'));
    const [darkColor, setDarkColor] = useState(getSavedColor('dark'));
    
    // Derived state for visual feedback
    const [currentThemeIsDark, setCurrentThemeIsDark] = useState(window.document.documentElement.classList.contains('dark'));

    // Effect to keep local component state updated with DOM changes and update color picker state
    useEffect(() => {
        const updateState = () => {
            const isDarkEffective = window.document.documentElement.classList.contains('dark');
            setCurrentThemeIsDark(isDarkEffective);
            setLightColor(getSavedColor('light'));
            setDarkColor(getSavedColor('dark'));
            
            // Re-apply chroma/hue/lightness to guarantee it matches the saved state on theme switch
            const savedColor = getSavedColor(isDarkEffective ? 'dark' : 'light');
            
            const root = window.document.documentElement;
            const hue = themeHues[savedColor] || themeHues[getDefaultColorKey(isDarkEffective ? 'dark' : 'light')];
            const isAchromatic = savedColor === 'black' || savedColor === 'white';
            
            root.style.setProperty('--primary-h', hue);
            root.style.setProperty('--sidebar-primary-h', hue);
            root.style.setProperty('--primary-c', isAchromatic ? 0 : 0.1);
            root.style.setProperty('--sidebar-primary-c', isAchromatic ? 0 : 0.1);

            if (isDarkEffective) {
                const isWhiteAccent = savedColor === 'white';
                 if (isWhiteAccent) {
                    root.style.setProperty('--primary-l-dark', 0.99);
                    root.style.setProperty('--sidebar-primary-l-dark', 0.95);
                    root.style.setProperty('--primary-foreground', 'oklch(0.205 0 0)'); // FIX: Set dark text
                 } else {
                    root.style.setProperty('--primary-l-dark', 0.75);
                    root.style.setProperty('--sidebar-primary-l-dark', 0.6);
                    root.style.setProperty('--primary-foreground', 'oklch(0.985 0 0)'); // FIX: Set white text
                 }
            } else {
                // Light mode: Text is always white for contrast against the dark L=0.205 primary background
                root.style.setProperty('--primary-foreground', 'oklch(0.985 0 0)'); 
            }
        };
        
        // Rerun whenever theme mode changes (Context update)
        updateState();

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", updateState);
        return () => mediaQuery.removeEventListener("change", updateState);
    }, [contextThemeMode]);


    // Handle Color Change (Delegated from ColorPicker)
    const handleColorChange = (modeKey, color) => {
        if (modeKey === 'light') {
            setLightColor(color);
        } else {
            setDarkColor(color);
        }
        
        // Save and apply colors to the DOM and storage
        saveAndApplyColor(modeKey, color);
    };

    // --- Handle Clear Color ---
    const handleClearColor = (modeKey) => {
        // Use the mode-specific default visual color key ('black' or 'white')
        const defaultColor = getDefaultColorKey(modeKey);
        
        // 1. Reset local state to default
        if (modeKey === 'light') {
            setLightColor(defaultColor);
        } else {
            setDarkColor(defaultColor);
        }

        // 2. Remove custom preference from localStorage (to force default fallback)
        localStorage.removeItem(`theme-color-${modeKey}`);

        // 3. Immediately re-apply the default HUE (0) and Chroma (0) to the DOM
        const isDarkEffective = window.document.documentElement.classList.contains('dark');
        const effectiveMode = isDarkEffective ? 'dark' : 'light';

        if (effectiveMode === modeKey) {
            const root = window.document.documentElement;
            const hue = themeHues[defaultColor]; 
            
            root.style.setProperty('--primary-h', hue); // H=0
            root.style.setProperty('--sidebar-primary-h', hue); // H=0
            root.style.setProperty('--primary-c', 0); // C=0
            root.style.setProperty('--sidebar-primary-c', 0); // C=0
            
            if (modeKey === 'dark') {
                 // For dark mode default ('white'), set the lightness high
                 root.style.setProperty('--primary-l-dark', 0.99);
                 root.style.setProperty('--sidebar-primary-l-dark', 0.95);
                 root.style.setProperty('--primary-foreground', 'oklch(0.205 0 0)'); // FIX: Set dark foreground text for white button
            } else {
                // Light mode default ('black') relies on the L=0.205 in the CSS file, set foreground white
                root.style.setProperty('--primary-foreground', 'oklch(0.985 0 0)');
            }
        }
    };
    // --- END Handle Clear Color ---


    // Sales Targets Form State and Logic
    const { data, setData, post, processing, errors } = useForm(targets || {});

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) { console.error("Access Denied."); return; }
        post('/admin/settings', { 
            preserveScroll: true,
            onSuccess: (page) => {
                const message = page.props.flash?.success || "Targets saved successfully!";
                typeof Toast !== 'undefined' ? (window.Toast || Toast).fire({ icon: "success", title: message }) : console.log("Success: " + message);
            },
            onError: (errors) => {
                let errorMessage = "An unknown error occurred.";
                const firstError = Object.values(errors)[0];
                if (firstError) { errorMessage = firstError; }
                typeof Toast !== 'undefined' ? (window.Toast || Toast).fire({ icon: "error", title: errorMessage }) : console.error("Validation Errors:", errors);
            },
        });
    };

    const targetFields = [
        { key: 'Daily', label: 'Daily Sales Target (₱)' },
        { key: 'Week', label: 'Weekly Sales Target (₱)' },
        { key: 'Month', label: 'Monthly Sales Target (₱)' },
        { key: 'Year', label: 'Yearly Sales Target (₱)' },
    ];
    
    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                {/* Header (Now includes the ModeToggle dropdown) */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                        <p className="text-muted-foreground">
                            Manage system configurations and personalize your UI.
                        </p>
                    </div>
                    {/* PLACEMENT: Add the ModeToggle here */}
                    <ModeToggle />
                </div>

                {/* --- Setting Cards Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                    {/* 🎨 UI Color Customization Card */}
                    <Card className="shadow-lg h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                Accent Color Palette
                            </CardTitle>
                            <CardDescription>
                                Customize the accent color for Light and Dark modes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* --- Color Palette Selection for Light Mode --- */}
                            <div className="border-t pt-4">
                                <ColorPicker 
                                    mode="light" 
                                    activeColor={lightColor} 
                                    onClear={() => handleClearColor('light')} // Pass clear handler
                                    onColorChange={handleColorChange} 
                                />
                            </div>

                            {/* --- Color Palette Selection for Dark Mode --- */}
                            <div className="border-t pt-4">
                                <ColorPicker 
                                    mode="dark" 
                                    activeColor={darkColor} 
                                    onClear={() => handleClearColor('dark')} // Pass clear handler
                                    onColorChange={handleColorChange} 
                                />
                            </div>
                            
                            <p className="text-xs text-muted-foreground pt-2">
                                The **System** mode uses the color set for the corresponding Light or Dark scheme.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Sales Targets Card (Admin Only) */}
                    {isAdmin && (
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-primary" /> 
                                    Sales Performance Targets
                                </CardTitle>
                                <CardDescription>
                                    Set the revenue goals for each reporting period on the dashboard.
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {targetFields.map(({ key, label }) => (
                                        <div key={key} className="grid w-full items-center gap-1.5">
                                            <Label htmlFor={key} className="font-semibold text-foreground">
                                                {label}
                                            </Label>
                                            <Input
                                                id={key}
                                                type="number"
                                                min="0"
                                                placeholder="Enter target amount"
                                                value={data[key] || ''}
                                                onChange={(e) => setData(key, e.target.value)}
                                                className={errors[key] ? 'border-red-500' : ''}
                                            />
                                            {errors[key] && <p className="text-sm text-red-500 mt-1">{errors[key]}</p>}
                                        </div>
                                    ))}

                                    <div className="pt-4">
                                        <Button 
                                            type="submit" 
                                            disabled={processing} 
                                            className="shadow-md shadow-primary/20"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {processing ? 'Saving...' : 'Save Targets'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

// Helper Component for Segmented Theme Buttons (Moved to global scope for clarity)
const ThemeModeButton = ({ mode, icon: Icon, label }) => {
    const { theme: contextThemeMode, setTheme: setContextThemeMode } = useTheme();
    const isActive = contextThemeMode === mode;
    return (
        <Button
            variant={isActive ? "default" : "outline"}
            onClick={() => setContextThemeMode(mode)}
            className={`flex-1 transition-colors ${isActive ? 'shadow-md' : 'border-border'}`}
        >
            <Icon className="h-4 w-4 mr-2" />
            {label}
        </Button>
    );
};