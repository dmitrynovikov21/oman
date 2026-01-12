"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
    badge?: number;
    disabled?: boolean;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: "default" | "pills" | "underline";
    className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = "default", className }: TabsProps) {
    return (
        <div className={cn("flex gap-1", variant === "pills" && "bg-muted rounded-lg p-1", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        variant === "pills" && "rounded-md",
                        variant === "underline" && "border-b-2 border-transparent",
                        activeTab === tab.id
                            ? variant === "pills" ? "bg-background shadow text-foreground" : "border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        tab.disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {tab.label}
                    {tab.badge !== undefined && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-muted">{tab.badge}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
