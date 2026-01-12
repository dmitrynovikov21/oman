"use client";

/**
 * OCR Validation UI Components
 * Module B: Visual indicators for validation status
 * 
 * Features:
 * - Red border for validation errors
 * - Blue icon for auto-corrections
 * - Low confidence warnings
 * - Skeleton loaders for OCR processing
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ValidationFieldProps {
    value: string;
    originalValue?: string;
    status: "valid" | "error" | "corrected" | "low_confidence";
    errorMessage?: string;
    correctionType?: string;
    confidence?: number;
    className?: string;
}

/**
 * Field wrapper that shows validation status visually
 */
export function ValidationField({
    value,
    originalValue,
    status,
    errorMessage,
    correctionType,
    confidence,
    className,
}: ValidationFieldProps) {
    const getBorderClass = () => {
        switch (status) {
            case "error":
                return "border-2 border-red-500 bg-red-50";
            case "corrected":
                return "border-2 border-blue-400 bg-blue-50";
            case "low_confidence":
                return "border-2 border-amber-400 bg-amber-50";
            default:
                return "border border-zinc-200";
        }
    };

    const getIcon = () => {
        switch (status) {
            case "error":
                return <Icons.warning className="h-4 w-4 text-red-500" />;
            case "corrected":
                return <Icons.check className="h-4 w-4 text-blue-500" />;
            case "low_confidence":
                return <Icons.warning className="h-4 w-4 text-amber-500" />;
            default:
                return null;
        }
    };

    const getTooltipContent = () => {
        switch (status) {
            case "error":
                return errorMessage || "Validation failed";
            case "corrected":
                return `Auto-corrected: "${originalValue}" → "${value}"`;
            case "low_confidence":
                return `Low confidence (${Math.round((confidence || 0) * 100)}%). Please verify.`;
            default:
                return null;
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                            getBorderClass(),
                            className
                        )}
                    >
                        <span className="flex-1 text-sm">{value}</span>
                        {getIcon()}
                    </div>
                </TooltipTrigger>
                {getTooltipContent() && (
                    <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{getTooltipContent()}</p>
                        {status === "corrected" && correctionType && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Correction type: {correctionType}
                            </p>
                        )}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Inline auto-correction badge
 */
export function AutoCorrectionBadge({
    originalValue,
    correctedValue,
}: {
    originalValue: string;
    correctedValue: string;
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        <Icons.edit className="h-3 w-3" />
                        Auto-corrected
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-sm">
                        <span className="line-through text-red-400">{originalValue}</span>
                        {" → "}
                        <span className="text-green-600 font-medium">{correctedValue}</span>
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Validation error alert
 */
export function ValidationErrorBanner({
    errors,
    onDismiss,
}: {
    errors: Array<{ field: string; message: string }>;
    onDismiss?: () => void;
}) {
    if (errors.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                    <Icons.warning className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-red-800">Validation Issues Found</h4>
                    <ul className="mt-2 space-y-1">
                        {errors.map((error, idx) => (
                            <li key={idx} className="text-sm text-red-700">
                                <span className="font-medium">{error.field}:</span> {error.message}
                            </li>
                        ))}
                    </ul>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="p-1 hover:bg-red-100 rounded-lg">
                        <Icons.close className="h-4 w-4 text-red-500" />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * OCR Processing skeleton loader
 */
export function OCRProcessingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-zinc-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
            </div>

            {/* Processing status */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div>
                        <p className="font-medium text-blue-800">Processing Document...</p>
                        <p className="text-sm text-blue-600">Running OCR with dual-model consensus</p>
                    </div>
                </div>
            </div>

            {/* Field skeletons */}
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-3 bg-zinc-200 rounded w-1/4" />
                        <div className="h-10 bg-zinc-100 rounded-xl" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="border rounded-2xl overflow-hidden">
                <div className="h-10 bg-zinc-100" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex border-t">
                        <div className="flex-1 h-12 bg-zinc-50 border-r" />
                        <div className="flex-1 h-12 bg-zinc-50 border-r" />
                        <div className="flex-1 h-12 bg-zinc-50" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Consensus conflict indicator
 */
export function ConflictIndicator({
    paddleValue,
    easyocrValue,
    onResolve,
}: {
    paddleValue: string;
    easyocrValue: string;
    onResolve: (value: string) => void;
}) {
    return (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                    <Icons.warning className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-red-800">OCR Conflict Detected</h4>
                    <p className="text-sm text-red-600 mt-1">
                        Two OCR engines returned different values. Please select the correct one:
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => onResolve(paddleValue)}
                            className="flex-1 px-3 py-2 bg-white border border-red-200 rounded-xl text-sm hover:bg-red-50 transition-colors"
                        >
                            <span className="block text-xs text-zinc-500 mb-1">PaddleOCR:</span>
                            <span className="font-medium">{paddleValue}</span>
                        </button>
                        <button
                            onClick={() => onResolve(easyocrValue)}
                            className="flex-1 px-3 py-2 bg-white border border-red-200 rounded-xl text-sm hover:bg-red-50 transition-colors"
                        >
                            <span className="block text-xs text-zinc-500 mb-1">EasyOCR:</span>
                            <span className="font-medium">{easyocrValue}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Validation summary card
 */
export function ValidationSummary({
    totalFields,
    correctedCount,
    errorCount,
    lowConfidenceCount,
}: {
    totalFields: number;
    correctedCount: number;
    errorCount: number;
    lowConfidenceCount: number;
}) {
    const successRate = totalFields > 0
        ? Math.round(((totalFields - errorCount) / totalFields) * 100)
        : 100;

    return (
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
            <h3 className="font-semibold text-zinc-900 mb-4">Validation Summary</h3>

            <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-zinc-900">{totalFields}</p>
                    <p className="text-xs text-zinc-500">Total Fields</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{correctedCount}</p>
                    <p className="text-xs text-zinc-500">Auto-corrected</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                    <p className="text-xs text-zinc-500">Errors</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{lowConfidenceCount}</p>
                    <p className="text-xs text-zinc-500">Low Confidence</p>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-zinc-600">Success Rate</span>
                    <span className={cn(
                        "font-medium",
                        successRate >= 90 ? "text-green-600" :
                            successRate >= 70 ? "text-amber-600" : "text-red-600"
                    )}>
                        {successRate}%
                    </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all",
                            successRate >= 90 ? "bg-green-500" :
                                successRate >= 70 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${successRate}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
