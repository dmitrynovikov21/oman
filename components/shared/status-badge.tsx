import { cn } from "@/lib/utils";

type StatusType = "DRAFT" | "ACTIVE" | "REVIEW" | "COMPLETED" | "ARCHIVED" | "PENDING" | "PROCESSING" | "PROCESSED" | "PAID" | "OVERDUE" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";

interface StatusBadgeProps {
    status: StatusType | string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const statusStyles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
    COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
    ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    PROCESSING: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
    PROCESSED: "bg-green-100 text-green-700 border-green-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    OVERDUE: "bg-red-100 text-red-700 border-red-200",
    URGENT: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-green-100 text-green-700 border-green-200",
    TRANSCRIBED: "bg-purple-100 text-purple-700 border-purple-200",
    REVIEWED: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const sizeStyles = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
    const statusUpper = status.toUpperCase();
    const style = statusStyles[statusUpper] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border font-medium",
                style,
                sizeStyles[size],
                className
            )}
        >
            {status}
        </span>
    );
}

// Priority badge with dot indicator
export function PriorityBadge({ priority }: { priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW" }) {
    const colors = {
        URGENT: "bg-red-500",
        HIGH: "bg-orange-500",
        MEDIUM: "bg-yellow-500",
        LOW: "bg-green-500",
    };

    return (
        <div className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", colors[priority])} />
            <span className="text-xs font-medium">{priority}</span>
        </div>
    );
}

// Document type badge
export function DocumentTypeBadge({ type }: { type: string }) {
    const typeStyles: Record<string, string> = {
        MANDATE: "bg-purple-100 text-purple-700",
        CONTRACT: "bg-blue-100 text-blue-700",
        EVIDENCE: "bg-amber-100 text-amber-700",
        REPORT: "bg-green-100 text-green-700",
        CORRESPONDENCE: "bg-gray-100 text-gray-700",
    };

    return (
        <span
            className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                typeStyles[type.toUpperCase()] || "bg-gray-100 text-gray-700"
            )}
        >
            {type}
        </span>
    );
}
