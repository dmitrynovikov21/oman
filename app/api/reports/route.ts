import { NextRequest, NextResponse } from "next/server";

// Report templates
const reportTemplates = [
    {
        id: "standard",
        name: "Standard EOSB Report",
        nameAr: "تقرير نهاية الخدمة القياسي",
        sections: ["header", "parties", "employment", "claims", "calculation", "opinion", "signature"],
        isDefault: true,
    },
    {
        id: "detailed",
        name: "Detailed Analysis Report",
        nameAr: "تقرير التحليل المفصل",
        sections: ["header", "parties", "employment", "documents", "claims", "calculation", "comparison", "timeline", "opinion", "signature"],
        isDefault: false,
    },
    {
        id: "summary",
        name: "Summary Report",
        nameAr: "تقرير ملخص",
        sections: ["header", "parties", "calculation", "opinion", "signature"],
        isDefault: false,
    },
];

// Mock reports
const mockReports = [
    {
        id: "report-1",
        caseId: "case-1",
        templateId: "standard",
        status: "DRAFT",
        version: 1,
        title: "Expert Report - Case 1409/2024",
        generatedAt: "2024-01-20T10:00:00Z",
        sections: {
            header: { courtName: "Primary Labor Court - Muscat", caseNumber: "1409/2024" },
            opinion: { text: "Based on the analysis, the plaintiff is entitled to..." },
        },
    },
];

// GET /api/reports - List reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const caseId = searchParams.get("caseId");
        const templates = searchParams.get("templates") === "true";

        if (templates) {
            return NextResponse.json({ templates: reportTemplates });
        }

        let filtered = mockReports;
        if (caseId) {
            filtered = filtered.filter((r) => r.caseId === caseId);
        }

        return NextResponse.json({ reports: filtered, total: filtered.length });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/reports - Generate report
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const template = reportTemplates.find((t) => t.id === body.templateId) || reportTemplates[0];

        const newReport = {
            id: `report-${Date.now()}`,
            caseId: body.caseId,
            templateId: template.id,
            status: "GENERATING",
            version: 1,
            title: `Expert Report - Case ${body.caseNumber || "Unknown"}`,
            generatedAt: new Date().toISOString(),
            sections: {},
        };

        // In production, trigger async report generation
        return NextResponse.json({ report: newReport }, { status: 201 });
    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
