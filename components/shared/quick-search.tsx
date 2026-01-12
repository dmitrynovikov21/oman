"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface SearchResult {
    id: string;
    type: "case" | "document" | "meeting" | "action";
    title: string;
    subtitle: string;
    href: string;
}

const mockResults: SearchResult[] = [
    { id: "1", type: "case", title: "Case 1409/2024", subtitle: "Ahmed Al-Badawi vs Gulf Construction", href: "/cases/case-1" },
    { id: "2", type: "case", title: "Case 1387/2024", subtitle: "Mohammed Hassan vs Oman Trading", href: "/cases/case-2" },
    { id: "3", type: "document", title: "Employment Contract.pdf", subtitle: "Case 1409/2024", href: "/cases/case-1" },
    { id: "4", type: "document", title: "Court Mandate.pdf", subtitle: "Case 1409/2024", href: "/cases/case-1" },
    { id: "5", type: "meeting", title: "Initial Party Meeting", subtitle: "Case 1409/2024 - Jan 20", href: "/cases/case-1/meetings" },
    { id: "6", type: "action", title: "Create New Case", subtitle: "Start a new case wizard", href: "/cases/new" },
    { id: "7", type: "action", title: "Go to Dashboard", subtitle: "View overview", href: "/dashboard" },
    { id: "8", type: "action", title: "Open Settings", subtitle: "Manage your profile", href: "/dashboard/settings" },
];

function getTypeIcon(type: SearchResult["type"]) {
    switch (type) {
        case "case":
            return <Icons.fileText className="size-4" />;
        case "document":
            return <Icons.fileText className="size-4" />;
        case "meeting":
            return <Icons.messages className="size-4" />;
        case "action":
            return <Icons.arrowRight className="size-4" />;
    }
}

function getTypeColor(type: SearchResult["type"]) {
    switch (type) {
        case "case":
            return "bg-blue-100 text-blue-600";
        case "document":
            return "bg-amber-100 text-amber-600";
        case "meeting":
            return "bg-purple-100 text-purple-600";
        case "action":
            return "bg-green-100 text-green-600";
    }
}

export function QuickSearch() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredResults = query.length > 0
        ? mockResults.filter(
            (r) =>
                r.title.toLowerCase().includes(query.toLowerCase()) ||
                r.subtitle.toLowerCase().includes(query.toLowerCase())
        )
        : mockResults.filter((r) => r.type === "action");

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            // Escape to close
            if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Navigation within results
    const handleKeyNavigation = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredResults.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredResults.length - 1
                );
            } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
                e.preventDefault();
                router.push(filteredResults[selectedIndex].href);
                setIsOpen(false);
                setQuery("");
            }
        },
        [filteredResults, selectedIndex, router]
    );

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                className="w-64 justify-start text-muted-foreground"
                onClick={() => setIsOpen(true)}
            >
                <Icons.search className="mr-2 size-4" />
                Search...
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                }}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border bg-background shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center border-b px-4">
                    <Icons.search className="size-4 text-muted-foreground" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search cases, documents, or actions..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyNavigation}
                        className="flex-1 bg-transparent py-4 px-3 text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto p-2">
                    {filteredResults.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No results found for &quot;{query}&quot;
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {query.length === 0 && (
                                <p className="px-2 py-1 text-xs text-muted-foreground">
                                    Quick Actions
                                </p>
                            )}
                            {filteredResults.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => {
                                        router.push(result.href);
                                        setIsOpen(false);
                                        setQuery("");
                                    }}
                                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${index === selectedIndex
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                        }`}
                                >
                                    <div
                                        className={`p-1.5 rounded ${index === selectedIndex
                                            ? "bg-primary-foreground/20"
                                            : getTypeColor(result.type)
                                            }`}
                                    >
                                        {getTypeIcon(result.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{result.title}</p>
                                        <p
                                            className={`text-xs truncate ${index === selectedIndex
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            {result.subtitle}
                                        </p>
                                    </div>
                                    <Icons.arrowRight
                                        className={`size-4 shrink-0 ${index === selectedIndex
                                            ? "text-primary-foreground/70"
                                            : "text-muted-foreground"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
                    <span>↑↓ to navigate</span>
                    <span>•</span>
                    <span>↵ to select</span>
                    <span>•</span>
                    <span>esc to close</span>
                </div>
            </div>
        </>
    );
}
