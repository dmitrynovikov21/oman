"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

const shortcuts = [
    { keys: ["⌘", "K"], description: "Open Quick Search", category: "Navigation" },
    { keys: ["⌘", "N"], description: "Create New Case", category: "Navigation" },
    { keys: ["⌘", "S"], description: "Save Current Work", category: "General" },
    { keys: ["⌘", "⇧", "S"], description: "Save and Close", category: "General" },
    { keys: ["Esc"], description: "Close Modal / Cancel", category: "General" },
    { keys: ["⌘", "B"], description: "Toggle Sidebar", category: "Navigation" },
    { keys: ["⌘", "/"], description: "Show Keyboard Shortcuts", category: "Help" },
    { keys: ["⌘", "↵"], description: "Submit Form", category: "Forms" },
    { keys: ["Tab"], description: "Next Field", category: "Forms" },
    { keys: ["⇧", "Tab"], description: "Previous Field", category: "Forms" },
    { keys: ["↑", "↓"], description: "Navigate List Items", category: "Lists" },
    { keys: ["↵"], description: "Select Item", category: "Lists" },
    { keys: ["⌘", "C"], description: "Copy Selected", category: "Editing" },
    { keys: ["⌘", "V"], description: "Paste", category: "Editing" },
    { keys: ["⌘", "Z"], description: "Undo", category: "Editing" },
    { keys: ["⌘", "⇧", "Z"], description: "Redo", category: "Editing" },
];

export function ShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+/ or Ctrl+/ to open
            if ((e.metaKey || e.ctrlKey) && e.key === "/") {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background shadow-lg">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                        <Icons.close className="size-4" />
                    </Button>
                </div>

                <div className="max-h-96 overflow-y-auto p-4">
                    {categories.map((category) => (
                        <div key={category} className="mb-4 last:mb-0">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {shortcuts
                                    .filter((s) => s.category === category)
                                    .map((shortcut, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between py-1"
                                        >
                                            <span className="text-sm">{shortcut.description}</span>
                                            <div className="flex gap-1">
                                                {shortcut.keys.map((key, j) => (
                                                    <kbd
                                                        key={j}
                                                        className="px-2 py-1 text-xs bg-muted rounded border font-mono min-w-[24px] text-center"
                                                    >
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                        Press <kbd className="px-1 py-0.5 text-xs bg-background rounded border">⌘ /</kbd> to toggle this dialog
                    </p>
                </div>
            </div>
        </>
    );
}
