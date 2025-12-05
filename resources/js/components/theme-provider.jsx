import React, { createContext, useContext, useEffect, useState } from "react";

// Types derived from your example
const Theme = {
    DARK: "dark",
    LIGHT: "light",
    SYSTEM: "system",
};

const storageKey = "theme-mode"; // Renamed for simplicity

const initialState = {
    theme: Theme.SYSTEM,
    setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
    children,
    defaultTheme = Theme.SYSTEM,
    // Note: We use the default storageKey defined above
    ...props
}) {
    // 1. Initialize state from localStorage
    const [theme, setThemeState] = useState(
        () => (localStorage.getItem(storageKey)) || defaultTheme
    );

    // 2. Effect to apply the theme class to the document root
    useEffect(() => {
        const root = window.document.documentElement;

        // Clear existing theme classes
        root.classList.remove("light", "dark");

        let currentTheme = theme;
        if (theme === Theme.SYSTEM) {
            currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? Theme.DARK
                : Theme.LIGHT;
        }

        // Apply the determined theme class
        root.classList.add(currentTheme);
        
        // OPTIONAL: Since we are using custom color logic in Settings.jsx, 
        // you may need to call a color re-initialization function here 
        // if moving all theme logic into this provider.
        
    }, [theme]);
    
    // 3. Setter function that updates state and localStorage
    const value = {
        theme,
        setTheme: (newTheme) => {
            localStorage.setItem(storageKey, newTheme);
            setThemeState(newTheme);
        },
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

// 4. Custom Hook to consume the context
export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};