import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/analytics - Dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month"; // week, month, year, all

        // Calculate date range
        const now = new Date();
        let startDate: Date | undefined;

        switch (period) {
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "month":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "year":
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = undefined;
        }

        const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

        // Parallel queries for performance
        const [
            totalCases,
            casesByStatus,
            totalDocuments,
            documentsWithOcr,
            totalCalculations,
            recentCases,
        ] = await Promise.all([
            // Total cases
            prisma.case.count({ where: dateFilter }),

            // Cases grouped by status
            prisma.case.groupBy({
                by: ["status"],
                _count: { status: true },
                where: dateFilter,
            }),

            // Total documents
            prisma.document.count({ where: dateFilter }),

            // Documents with successful OCR
            prisma.document.count({
                where: {
                    ...dateFilter,
                    ocrStatus: "DONE",
                },
            }),

            // Total calculations
            prisma.calculation.count({ where: dateFilter }),

            // Recent cases (last 5)
            prisma.case.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    caseNumber: true,
                    year: true,
                    status: true,
                    plaintiffName: true,
                    createdAt: true,
                },
            }),
        ]);

        // Format status breakdown
        const statusBreakdown = casesByStatus.reduce((acc: any, item: any) => {
            acc[item.status] = item._count.status;
            return acc;
        }, {});

        // Calculate OCR success rate
        const ocrSuccessRate = totalDocuments > 0
            ? Math.round((documentsWithOcr / totalDocuments) * 100)
            : 0;

        return NextResponse.json({
            period,
            summary: {
                totalCases,
                totalDocuments,
                totalCalculations,
                ocrSuccessRate,
            },
            casesByStatus: statusBreakdown,
            recentCases,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
