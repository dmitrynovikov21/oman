"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number;
    max?: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    color?: "default" | "success" | "warning" | "danger";
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    size = "md",
    showLabel = false,
    color = "default",
    className,
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeStyles = {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
    };

    const colorStyles = {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-amber-500",
        danger: "bg-red-500",
    };

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeStyles[size])}>
                <div
                    className={cn("h-full rounded-full transition-all duration-300", colorStyles[color])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// Step progress indicator
interface StepProgressProps {
    steps: string[];
    currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
    return (
        <div className="flex items-center w-full">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "size-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                                index < currentStep
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : index === currentStep
                                        ? "border-primary text-primary"
                                        : "border-muted text-muted-foreground"
                            )}
                        >
                            {index < currentStep ? "✓" : index + 1}
                        </div>
                        <span
                            className={cn(
                                "text-xs mt-1",
                                index <= currentStep ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {step}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                "flex-1 h-0.5 mx-2",
                                index < currentStep ? "bg-primary" : "bg-muted"
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
