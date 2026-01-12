"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: "left" | "right";
    className?: string;
}

export function Dropdown({ trigger, children, align = "left", className }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative inline-block">
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            {isOpen && (
                <div className={cn(
                    "absolute z-50 mt-2 min-w-[180px] rounded-md border bg-popover p-1 shadow-lg",
                    align === "right" ? "right-0" : "left-0",
                    className
                )}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ children, onClick, disabled }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );
}

export function DropdownSeparator() {
    return <div className="my-1 h-px bg-border" />;
}
