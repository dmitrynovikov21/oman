import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/cases/[id] - Get single case
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;

        const caseData = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                documents: true,
                meetings: true,
                calculations: true,
            },
        });

        if (!caseData) {
            return NextResponse.json({ error: "Case not found" }, { status: 404 });
        }

        return NextResponse.json({ case: caseData });
    } catch (error) {
        console.error("Error fetching case:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/cases/[id] - Update case
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;
        const body = await request.json();

        // Update in database
        const updatedCase = await prisma.case.update({
            where: { id: caseId },
            data: {
                ...body,
                assignedDate: body.assignedDate ? new Date(body.assignedDate) : undefined,
                deadlineDate: body.deadlineDate ? new Date(body.deadlineDate) : undefined,
            },
        });

        return NextResponse.json({ case: updatedCase });
    } catch (error) {
        console.error("Error updating case:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/cases/[id] - Delete case
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;

        // Delete in database (Prisma will handle cascade if configured, or we delete related first)
        // For now assuming cascade delete or simple delete
        await prisma.case.delete({
            where: { id: caseId },
        });

        return NextResponse.json({
            success: true,
            message: `Case ${caseId} deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting case:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
