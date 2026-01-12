import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/analytics/stats
 * 
 * Returns real analytics data from database.
 * Replaces mock data for production use.
 */
export async function GET() {
    try {
        // Get date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Total cases
        const totalCases = await prisma.case.count();

        // Active cases (not CLOSED)
        const activeCases = await prisma.case.count({
            where: {
                status: {
                    not: "CLOSED"
                }
            }
        });

        // Completed this month
        const completedThisMonth = await prisma.case.count({
            where: {
                status: "CLOSED",
                updatedAt: {
                    gte: startOfMonth
                }
            }
        });

        // Calculate average completion days (from assignedDate to updatedAt for CLOSED)
        const completedCases = await prisma.case.findMany({
            where: {
                status: "CLOSED",
                assignedDate: { not: null }
            },
            select: {
                assignedDate: true,
                updatedAt: true
            }
        });

        let avgCompletionDays = 0;
        if (completedCases.length > 0) {
            const totalDays = completedCases.reduce((sum, c) => {
                if (c.assignedDate) {
                    const days = Math.ceil(
                        (c.updatedAt.getTime() - c.assignedDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return sum + days;
                }
                return sum;
            }, 0);
            avgCompletionDays = Math.round(totalDays / completedCases.length);
        }

        // Revenue calculation (sum of feeAmount for PAID cases)
        // Note: feeAmount field may not exist until migration
        let totalRevenue = 0;
        let pendingPayments = 0;

        try {
            const revenueData = await prisma.$queryRawUnsafe(`
                SELECT 
                    SUM(CASE WHEN paymentStatus = 'PAID' THEN feeAmount ELSE 0 END) as paid,
                    SUM(CASE WHEN paymentStatus != 'PAID' THEN feeAmount ELSE 0 END) as pending
                FROM Case 
                WHERE feeAmount IS NOT NULL
            `) as any[];

            if (revenueData.length > 0) {
                totalRevenue = revenueData[0].paid || 0;
                pendingPayments = revenueData[0].pending || 0;
            }
        } catch {
            // Fields may not exist yet, use defaults
            totalRevenue = 0;
            pendingPayments = 0;
        }

        // Monthly data for charts
        const monthlyData = await getMonthlyData();

        // Cases by type (based on status distribution)
        const casesByStatus = await prisma.case.groupBy({
            by: ['status'],
            _count: true
        });

        const casesByType = casesByStatus.map((s: { status: string; _count: number }) => ({
            type: s.status,
            count: s._count,
            percentage: totalCases > 0 ? Math.round((s._count / totalCases) * 100) : 0
        }));

        return NextResponse.json({
            stats: {
                totalCases,
                activeCases,
                completedThisMonth,
                avgCompletionDays,
                totalRevenue,
                pendingPayments,
            },
            monthlyData,
            casesByType,
            lastUpdated: now.toISOString()
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics data" },
            { status: 500 }
        );
    }
}

async function getMonthlyData() {
    const months: { month: string; cases: number; revenue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const count = await prisma.case.count({
            where: {
                createdAt: {
                    gte: date,
                    lt: nextMonth
                }
            }
        });

        months.push({
            month: date.toLocaleDateString('en', { month: 'short' }),
            cases: count,
            revenue: 0 // Will be populated when feeAmount is available
        });
    }

    return months;
}
