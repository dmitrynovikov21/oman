"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}

export function Tooltip({ content, children, position = "top", delay = 300 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const show = () => {
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const hide = () => {
        if (timeoutId) clearTimeout(timeoutId);
        setIsVisible(false);
    };

    const positions = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
            {children}
            {isVisible && (
                <div className={cn(
                    "absolute z-50 px-2 py-1 text-xs bg-popover border rounded shadow-lg whitespace-nowrap",
                    positions[position]
                )}>
                    {content}
                </div>
            )}
        </div>
    );
}
