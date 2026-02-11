import { NextRequest, NextResponse } from "next/server";

// Mock meetings data
const mockMeetings = [
    {
        id: "meeting-1",
        caseId: "case-1",
        title: "Initial Party Meeting",
        scheduledAt: "2024-01-20T10:00:00Z",
        duration: 45,
        status: "TRANSCRIBED",
        location: "Court Building, Room 302",
        attendees: ["Ahmed Al-Badawi", "Gulf Construction Rep", "Legal Counsel"],
        recordingUrl: "/recordings/meeting-1.webm",
        transcript: [
            { timestamp: "00:00:15", speaker: "Expert", text: "بسم الله الرحمن الرحيم. نبدأ الجلسة..." },
            { timestamp: "00:01:30", speaker: "Plaintiff", text: "I was employed since January 2019..." },
            { timestamp: "00:03:45", speaker: "Defendant", text: "The termination was according to Article 40..." },
        ],
    },
    {
        id: "meeting-2",
        caseId: "case-1",
        title: "Document Review Session",
        scheduledAt: "2024-01-25T14:00:00Z",
        duration: 30,
        status: "PENDING",
        location: "Virtual - Zoom",
        attendees: ["Ahmed Al-Badawi", "Legal Counsel"],
        recordingUrl: null,
        transcript: null,
    },
];

// GET /api/meetings - List meetings
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const caseId = searchParams.get("caseId");
        const status = searchParams.get("status");

        let filtered = mockMeetings;

        if (caseId) {
            filtered = filtered.filter((m) => m.caseId === caseId);
        }
        if (status) {
            filtered = filtered.filter((m) => m.status === status.toUpperCase());
        }

        return NextResponse.json({
            meetings: filtered,
            total: filtered.length,
        });
    } catch (error) {
        console.error("Error fetching meetings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/meetings - Create meeting
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newMeeting = {
            id: `meeting-${Date.now()}`,
            caseId: body.caseId,
            title: body.title,
            scheduledAt: body.scheduledAt || new Date().toISOString(),
            duration: body.duration || 30,
            status: "PENDING",
            location: body.location || "TBD",
            attendees: body.attendees || [],
            recordingUrl: null,
            transcript: null,
        };

        return NextResponse.json({ meeting: newMeeting }, { status: 201 });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
