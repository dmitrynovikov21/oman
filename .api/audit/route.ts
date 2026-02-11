import { NextRequest, NextResponse } from "next/server";

// Mock audit log
const mockAuditLog = [
    { id: "a1", action: "CREATE", entity: "Case", entityId: "case-1", userId: "user-1", timestamp: "2024-01-15T10:00:00Z", changes: { caseNumber: "1409/2024" } },
    { id: "a2", action: "UPLOAD", entity: "Document", entityId: "doc-1", userId: "user-1", timestamp: "2024-01-15T10:30:00Z", changes: { name: "Employment Contract.pdf" } },
    { id: "a3", action: "UPDATE", entity: "Case", entityId: "case-1", userId: "user-1", timestamp: "2024-01-16T09:00:00Z", changes: { status: { from: "DRAFT", to: "ACTIVE" } } },
    { id: "a4", action: "CREATE", entity: "Calculation", entityId: "calc-1", userId: "user-1", timestamp: "2024-01-20T14:00:00Z", changes: { total: 15750 } },
    { id: "a5", action: "VIEW", entity: "Case", entityId: "case-1", userId: "user-2", timestamp: "2024-01-20T15:00:00Z", ipAddress: "192.168.1.100" },
];

// GET /api/audit - Get audit log
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityId = searchParams.get("entityId");
        const entity = searchParams.get("entity");
        const action = searchParams.get("action");
        const userId = searchParams.get("userId");
        const limit = parseInt(searchParams.get("limit") || "100");

        let filtered = mockAuditLog;

        if (entityId) filtered = filtered.filter((e) => e.entityId === entityId);
        if (entity) filtered = filtered.filter((e) => e.entity === entity);
        if (action) filtered = filtered.filter((e) => e.action === action.toUpperCase());
        if (userId) filtered = filtered.filter((e) => e.userId === userId);

        filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            logs: filtered.slice(0, limit),
            total: filtered.length,
        });
    } catch (error) {
        console.error("Error fetching audit log:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/audit - Create audit entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newEntry = {
            id: `a-${Date.now()}`,
            action: body.action,
            entity: body.entity,
            entityId: body.entityId,
            userId: body.userId || "system",
            timestamp: new Date().toISOString(),
            changes: body.changes,
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        };

        return NextResponse.json({ entry: newEntry }, { status: 201 });
    } catch (error) {
        console.error("Error creating audit entry:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
