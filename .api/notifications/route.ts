import { NextRequest, NextResponse } from "next/server";

// Mock notifications
const mockNotifications = [
    { id: "n1", userId: "user-1", type: "DEADLINE", title: "Deadline approaching", message: "Case 1387/2024 - 2 days left", read: false, createdAt: "2024-01-20T08:00:00Z", href: "/cases/case-2" },
    { id: "n2", userId: "user-1", type: "PAYMENT", title: "Payment received", message: "500 OMR for Case 1356/2024", read: false, createdAt: "2024-01-19T14:00:00Z", href: "/cases/case-3/finance" },
    { id: "n3", userId: "user-1", type: "DOCUMENT", title: "OCR completed", message: "Salary Slips.pdf processed", read: true, createdAt: "2024-01-19T10:00:00Z", href: "/cases/case-1" },
    { id: "n4", userId: "user-1", type: "SYSTEM", title: "System update", message: "New calculation formula available", read: true, createdAt: "2024-01-18T09:00:00Z" },
];

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const limit = parseInt(searchParams.get("limit") || "20");

        let filtered = mockNotifications;

        if (unreadOnly) {
            filtered = filtered.filter((n) => !n.read);
        }

        return NextResponse.json({
            notifications: filtered.slice(0, limit),
            unreadCount: mockNotifications.filter((n) => !n.read).length,
            total: filtered.length,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, markAllRead } = body;

        // In production, update in database
        const updatedCount = markAllRead
            ? mockNotifications.filter((n) => !n.read).length
            : ids?.length || 0;

        return NextResponse.json({
            success: true,
            updatedCount,
        });
    } catch (error) {
        console.error("Error updating notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
