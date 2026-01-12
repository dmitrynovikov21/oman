"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="size-9 px-0"
        >
            <Icons.sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Icons.moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

// Theme selector with options
export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("light")}
                className="h-7 px-3"
            >
                <Icons.sun className="size-4 mr-1" />
                Light
            </Button>
            <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="h-7 px-3"
            >
                <Icons.moon className="size-4 mr-1" />
                Dark
            </Button>
            <Button
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("system")}
                className="h-7 px-3"
            >
                <Icons.laptop className="size-4 mr-1" />
                System
            </Button>
        </div>
    );
}
