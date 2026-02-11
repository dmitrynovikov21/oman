import { NextRequest, NextResponse } from "next/server";

// Dashboard statistics
const mockStats = {
    overview: {
        totalCases: 156,
        activeCases: 12,
        pendingReview: 5,
        completedThisMonth: 8,
        totalRevenue: 45600,
        pendingPayments: 3200,
        avgCompletionDays: 18,
        documentsProcessed: 342,
    },
    trends: {
        casesThisMonth: [
            { date: "2024-01-01", count: 2 },
            { date: "2024-01-08", count: 5 },
            { date: "2024-01-15", count: 3 },
            { date: "2024-01-22", count: 4 },
        ],
        revenueThisMonth: [
            { date: "2024-01-01", amount: 1200 },
            { date: "2024-01-08", amount: 2500 },
            { date: "2024-01-15", amount: 1800 },
            { date: "2024-01-22", amount: 2100 },
        ],
    },
    distribution: {
        byStatus: [
            { status: "ACTIVE", count: 12 },
            { status: "DRAFT", count: 5 },
            { status: "REVIEW", count: 3 },
            { status: "COMPLETED", count: 130 },
            { status: "ARCHIVED", count: 6 },
        ],
        byCourt: [
            { court: "Primary Labor Court - Muscat", count: 89 },
            { court: "Seeb Court", count: 34 },
            { court: "Sohar Court", count: 18 },
            { court: "Salalah Court", count: 15 },
        ],
        byType: [
            { type: "Labor Disputes", count: 89 },
            { type: "Salary Claims", count: 42 },
            { type: "Unfair Dismissal", count: 18 },
            { type: "Other", count: 7 },
        ],
    },
    performance: {
        avgProcessingTime: 4.5, // hours per document
        ocrAccuracy: 98.2,
        reportGenerationTime: 2.3, // minutes
        userSatisfaction: 4.8, // out of 5
    },
};

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const section = searchParams.get("section");
        const period = searchParams.get("period") || "month";

        if (section) {
            const data = mockStats[section as keyof typeof mockStats];
            if (!data) {
                return NextResponse.json({ error: "Invalid section" }, { status: 400 });
            }
            return NextResponse.json({ [section]: data });
        }

        return NextResponse.json({
            stats: mockStats,
            period,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
