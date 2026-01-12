"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
    name: string;
    src?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getColorFromName(name: string): string {
    const colors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-amber-500",
        "bg-yellow-500",
        "bg-lime-500",
        "bg-green-500",
        "bg-emerald-500",
        "bg-teal-500",
        "bg-cyan-500",
        "bg-sky-500",
        "bg-blue-500",
        "bg-indigo-500",
        "bg-violet-500",
        "bg-purple-500",
        "bg-fuchsia-500",
        "bg-pink-500",
    ];

    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

const sizeClasses = {
    sm: "size-6 text-xs",
    md: "size-8 text-sm",
    lg: "size-10 text-base",
    xl: "size-14 text-lg",
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={cn("rounded-full object-cover", sizeClasses[size], className)}
            />
        );
    }

    return (
        <div
            className={cn(
                "rounded-full flex items-center justify-center text-white font-medium",
                sizeClasses[size],
                getColorFromName(name),
                className
            )}
        >
            {getInitials(name)}
        </div>
    );
}

// Avatar group for multiple users
interface AvatarGroupProps {
    users: { name: string; src?: string }[];
    max?: number;
    size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ users, max = 4, size = "md" }: AvatarGroupProps) {
    const visible = users.slice(0, max);
    const remaining = users.length - max;

    return (
        <div className="flex -space-x-2">
            {visible.map((user, i) => (
                <Avatar
                    key={i}
                    name={user.name}
                    src={user.src}
                    size={size}
                    className="border-2 border-background"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        "rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium border-2 border-background",
                        sizeClasses[size]
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}
