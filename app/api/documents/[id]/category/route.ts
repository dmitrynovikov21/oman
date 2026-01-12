import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/documents/[id]/category
 * 
 * Изменить категорию документа (Drag & Drop)
 * Mission 15: User Override
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const documentId = params.id;
        const body = await request.json();
        const { category } = body;

        // Validate category
        const validCategories = [
            "COURT",
            "PLAINTIFF_EVIDENCE",
            "DEFENDANT_EVIDENCE",
            "FINANCIAL",
            "EXPERT_WORK",
            "CONTRACT",
            "OTHER",
        ];

        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { error: "Invalid category" },
                { status: 400 }
            );
        }

        // Update document
        const updated = await prisma.document.update({
            where: { id: documentId },
            data: { type: category },
        });

        return NextResponse.json({
            success: true,
            document: {
                id: updated.id,
                name: updated.name,
                category: updated.type,
            },
        });

    } catch (error) {
        console.error("Update category error:", error);

        // Handle not found
        if ((error as any).code === "P2025") {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/documents/[id]/category
 * 
 * Get document details with category
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const document = await prisma.document.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                name: true,
                type: true,
                ocrStatus: true,
                extractedText: true,
            },
        });

        if (!document) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            document: {
                ...document,
                category: document.type,
            },
        });

    } catch (error) {
        console.error("Get document error:", error);
        return NextResponse.json(
            { error: "Failed to get document" },
            { status: 500 }
        );
    }
}
