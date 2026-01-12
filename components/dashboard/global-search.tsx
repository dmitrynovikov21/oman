"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Icons } from "@/components/shared/icons";

interface SearchResult {
    cases: Array<{
        id: string;
        caseNumber: string;
        year: number;
        plaintiffName: string;
        status: string;
    }>;
    documents: Array<{
        id: string;
        name: string;
        caseId: string;
        caseNumber: string;
        snippet: string | null;
    }>;
    total: number;
}

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounced search
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults(null);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                setOpen(true);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [query, performSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        function handleKeydown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        }
        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    }, []);

    return (
        <div className="relative w-full max-w-md" ref={dropdownRef}>
            <div className="relative">
                <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search documentation..."
                    className="h-9 w-full rounded-md border border-input bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && results && setOpen(true)}
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    ⌘K
                </kbd>
            </div>

            {/* Search Results Dropdown */}
            {open && results && (results.total > 0 || loading) && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                        </div>
                    ) : (
                        <>
                            {/* Cases Section */}
                            {results.cases.length > 0 && (
                                <div className="p-2">
                                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                                        Cases
                                    </p>
                                    {results.cases.map((c) => (
                                        <Link
                                            key={c.id}
                                            href={`/cases/${c.id}`}
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <p className="font-medium text-sm">
                                                {c.caseNumber}/{c.year}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {c.plaintiffName} • {c.status}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Documents Section */}
                            {results.documents.length > 0 && (
                                <div className="p-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                                        Documents
                                    </p>
                                    {results.documents.map((d) => (
                                        <Link
                                            key={d.id}
                                            href={`/cases/${d.caseId}`}
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <p className="font-medium text-sm">{d.name}</p>
                                            {d.snippet && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {d.snippet}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {results.total === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No results found
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
