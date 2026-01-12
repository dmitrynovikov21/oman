// Date formatting utilities for ExpertOS

/**
 * Format date to display format (e.g., "15 Jan 2024")
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format date to Arabic display format
 */
export function formatDateAr(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("ar-OM", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/**
 * Format date to ISO format (YYYY-MM-DD)
 */
export function formatDateISO(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (Math.abs(diffDays) >= 1) {
        return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    }
    if (Math.abs(diffHours) >= 1) {
        return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
    }
    if (Math.abs(diffMinutes) >= 1) {
        return diffMinutes > 0 ? `in ${diffMinutes} min` : `${Math.abs(diffMinutes)} min ago`;
    }
    return "just now";
}

/**
 * Get days until deadline
 */
export function getDaysUntil(date: string | Date): number {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: string | Date): boolean {
    return getDaysUntil(date) < 0;
}

/**
 * Calculate service period between two dates
 */
export function calculateServicePeriod(
    startDate: string | Date,
    endDate: string | Date
): { years: number; months: number; days: number; totalYears: number } {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        days += 30;
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalYears = years + months / 12 + days / 365;

    return { years, months, days, totalYears: Math.round(totalYears * 100) / 100 };
}

/**
 * Format duration in minutes to HH:MM:SS
 */
export function formatDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
}
