"use client";

/**
 * Analytics Skeleton Loaders
 * Mission 14: Enterprise Analytics with loading states
 */

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton for stat cards
 */
export function StatCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(
            "bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm animate-pulse",
            className
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-zinc-200 rounded-2xl" />
                <div className="h-4 w-16 bg-zinc-200 rounded" />
            </div>
            <div className="h-8 w-24 bg-zinc-200 rounded mb-2" />
            <div className="h-4 w-32 bg-zinc-100 rounded" />
        </div>
    );
}

/**
 * Skeleton for chart cards
 */
export function ChartCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(
            "bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm animate-pulse",
            className
        )}>
            <div className="flex items-center justify-between mb-6">
                <div className="h-5 w-32 bg-zinc-200 rounded" />
                <div className="h-8 w-24 bg-zinc-100 rounded-xl" />
            </div>
            <div className="h-48 bg-zinc-100 rounded-2xl flex items-end justify-around px-4 pb-4">
                {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                    <div
                        key={i}
                        className="w-8 bg-zinc-200 rounded-t-lg"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3">
                <div className="h-4 w-24 bg-zinc-200 rounded" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-32 bg-zinc-200 rounded" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-20 bg-zinc-200 rounded" />
            </td>
            <td className="px-4 py-3">
                <div className="h-6 w-16 bg-zinc-100 rounded-full" />
            </td>
        </tr>
    );
}

/**
 * Full analytics page skeleton
 */
export function AnalyticsPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Revenue cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 animate-pulse">
                    <div className="h-4 w-24 bg-white/30 rounded mb-2" />
                    <div className="h-10 w-40 bg-white/30 rounded" />
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 animate-pulse">
                    <div className="h-4 w-24 bg-white/30 rounded mb-2" />
                    <div className="h-10 w-40 bg-white/30 rounded" />
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCardSkeleton />
                <ChartCardSkeleton />
            </div>
        </div>
    );
}

/**
 * KPI dashboard skeleton
 */
export function KPIDashboardSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm animate-pulse">
            <div className="h-6 w-40 bg-zinc-200 rounded mb-6" />

            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="text-center">
                        <div className="h-16 w-16 bg-zinc-200 rounded-2xl mx-auto mb-3" />
                        <div className="h-8 w-20 bg-zinc-200 rounded mx-auto mb-2" />
                        <div className="h-4 w-24 bg-zinc-100 rounded mx-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}
