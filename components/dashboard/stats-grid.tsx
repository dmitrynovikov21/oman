"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";

interface DashboardStats {
    summary: {
        totalCases: number;
        totalDocuments: number;
        totalCalculations: number;
        ocrSuccessRate: number;
    };
    casesByStatus: Record<string, number>;
    recentCases: Array<{
        id: string;
        caseNumber: string;
        year: number;
        status: string;
        plaintiffName: string;
        createdAt: string;
    }>;
}

// KPI Card Component
function KPICard({
    title,
    value,
    description,
    icon: Icon,
    loading = false,
    delay = 0,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    loading?: boolean;
    delay?: number;
}) {
    return (
        <Card
            className="bg-white rounded-3xl shadow-sm border border-zinc-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                    {title}
                </CardTitle>
                <Icon className="size-5 text-zinc-400 transition-transform group-hover:scale-110" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-8 w-16 skeleton" />
                ) : (
                    <div className="text-4xl font-light text-zinc-900 animate-scale-in">{value}</div>
                )}
                <p className="text-xs text-zinc-500 mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}

export function DashboardStatsGrid() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/analytics?period=month");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const activeCases = stats?.casesByStatus?.["ACTIVE"] || 0;
    const reviewCases = stats?.casesByStatus?.["UNDER_REVIEW"] || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <KPICard
                title="Active Cases"
                value={loading ? "-" : stats?.summary.totalCases || 0}
                description="Total in system"
                icon={Icons.fileText}
                loading={loading}
                delay={0}
            />
            <KPICard
                title="Documents"
                value={loading ? "-" : stats?.summary.totalDocuments || 0}
                description="Uploaded files"
                icon={Icons.add}
                loading={loading}
                delay={75}
            />
            <KPICard
                title="OCR Success Rate"
                value={loading ? "-" : `${stats?.summary.ocrSuccessRate || 0}%`}
                description="Text extraction"
                icon={Icons.check}
                loading={loading}
                delay={150}
            />
            <KPICard
                title="Calculations"
                value={loading ? "-" : stats?.summary.totalCalculations || 0}
                description="EOSB/Leave computed"
                icon={Icons.settings}
                loading={loading}
                delay={225}
            />
        </div>
    );
}
