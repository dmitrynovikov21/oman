import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline";
    size?: "sm" | "md";
    className?: string;
}

const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    outline: "border text-foreground",
};

const sizes = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full font-medium",
            variants[variant],
            sizes[size],
            className
        )}>
            {children}
        </span>
    );
}

// Notification badge (red dot)
export function NotificationDot({ count }: { count?: number }) {
    if (!count) return null;
    return (
        <span className="absolute -top-1 -right-1 size-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
            {count > 9 ? "9+" : count}
        </span>
    );
}
