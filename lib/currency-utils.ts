// Currency and number formatting utilities for ExpertOS

/**
 * Format amount in OMR (Omani Rial)
 */
export function formatOMR(amount: number): string {
    return new Intl.NumberFormat("en-OM", {
        style: "currency",
        currency: "OMR",
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(amount);
}

/**
 * Format amount with OMR symbol
 */
export function formatOMRShort(amount: number): string {
    return `${amount.toLocaleString("en-OM", { minimumFractionDigits: 0 })} OMR`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompact(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Parse OMR string to number
 */
export function parseOMR(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
}

/**
 * Calculate percentage change
 */
export function calculateChange(current: number, previous: number): { value: number; positive: boolean } {
    if (previous === 0) return { value: 0, positive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), positive: change >= 0 };
}

/**
 * Round to specific decimal places
 */
export function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
