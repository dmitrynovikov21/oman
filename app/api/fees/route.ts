import { NextRequest, NextResponse } from "next/server";

// Mock fee items
const mockFees = [
    { id: "f1", caseId: "case-1", type: "REPORT", description: "Expert Report Fee", amount: 500, status: "PAID", dueDate: "2024-02-01", paidAt: "2024-01-25T10:00:00Z" },
    { id: "f2", caseId: "case-1", type: "COURT", description: "Court Appearance Fee", amount: 200, status: "PENDING", dueDate: "2024-02-15", paidAt: null },
    { id: "f3", caseId: "case-1", type: "DOCUMENT", description: "Document Review Fee", amount: 150, status: "PENDING", dueDate: "2024-02-10", paidAt: null },
    { id: "f4", caseId: "case-2", type: "REPORT", description: "Expert Report Fee", amount: 450, status: "OVERDUE", dueDate: "2024-01-15", paidAt: null },
];

// GET /api/fees - Get fees
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const caseId = searchParams.get("caseId");
        const status = searchParams.get("status");

        let filtered = mockFees;

        if (caseId) filtered = filtered.filter((f) => f.caseId === caseId);
        if (status) filtered = filtered.filter((f) => f.status === status.toUpperCase());

        const summary = {
            total: filtered.reduce((sum, f) => sum + f.amount, 0),
            paid: filtered.filter((f) => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0),
            pending: filtered.filter((f) => f.status === "PENDING").reduce((sum, f) => sum + f.amount, 0),
            overdue: filtered.filter((f) => f.status === "OVERDUE").reduce((sum, f) => sum + f.amount, 0),
        };

        return NextResponse.json({ fees: filtered, summary });
    } catch (error) {
        console.error("Error fetching fees:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/fees - Create fee
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newFee = {
            id: `f-${Date.now()}`,
            caseId: body.caseId,
            type: body.type || "OTHER",
            description: body.description,
            amount: body.amount,
            status: "PENDING",
            dueDate: body.dueDate,
            paidAt: null,
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ fee: newFee }, { status: 201 });
    } catch (error) {
        console.error("Error creating fee:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/fees - Update fee status
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();

        const updatedFee = {
            id: body.id,
            status: body.status,
            paidAt: body.status === "PAID" ? new Date().toISOString() : null,
        };

        return NextResponse.json({ fee: updatedFee });
    } catch (error) {
        console.error("Error updating fee:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
