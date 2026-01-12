import { NextRequest, NextResponse } from "next/server";

// Mock timeline events
const mockTimeline = [
    { id: "t1", caseId: "case-1", type: "SYSTEM", event: "Case created", timestamp: "2024-01-15T10:00:00Z", userId: "user-1" },
    { id: "t2", caseId: "case-1", type: "DOCUMENT", event: "Employment Contract uploaded", timestamp: "2024-01-15T10:30:00Z", userId: "user-1", metadata: { documentId: "doc-1" } },
    { id: "t3", caseId: "case-1", type: "DOCUMENT", event: "Court Mandate uploaded", timestamp: "2024-01-15T11:00:00Z", userId: "user-1", metadata: { documentId: "doc-2" } },
    { id: "t4", caseId: "case-1", type: "STATUS", event: "Status changed to ACTIVE", timestamp: "2024-01-16T09:00:00Z", userId: "user-1", metadata: { from: "DRAFT", to: "ACTIVE" } },
    { id: "t5", caseId: "case-1", type: "MEETING", event: "Initial party meeting scheduled", timestamp: "2024-01-18T14:00:00Z", userId: "user-1", metadata: { meetingId: "meeting-1" } },
    { id: "t6", caseId: "case-1", type: "MEETING", event: "Meeting completed and transcribed", timestamp: "2024-01-20T11:00:00Z", userId: "user-1" },
    { id: "t7", caseId: "case-1", type: "CALCULATION", event: "EOSB calculation performed", timestamp: "2024-01-20T14:00:00Z", userId: "user-1", metadata: { total: 15750 } },
];

// GET /api/timeline - Get case timeline
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const caseId = searchParams.get("caseId");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "50");

        let filtered = mockTimeline;

        if (caseId) {
            filtered = filtered.filter((e) => e.caseId === caseId);
        }
        if (type) {
            filtered = filtered.filter((e) => e.type === type.toUpperCase());
        }

        // Sort by timestamp descending
        filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            events: filtered.slice(0, limit),
            total: filtered.length,
        });
    } catch (error) {
        console.error("Error fetching timeline:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/timeline - Add timeline event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newEvent = {
            id: `t-${Date.now()}`,
            caseId: body.caseId,
            type: body.type || "SYSTEM",
            event: body.event,
            timestamp: new Date().toISOString(),
            userId: body.userId || "system",
            metadata: body.metadata,
        };

        return NextResponse.json({ event: newEvent }, { status: 201 });
    } catch (error) {
        console.error("Error creating timeline event:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
