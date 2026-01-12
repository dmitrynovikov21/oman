import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/documents/batch-upload
 * 
 * Пакетная загрузка документов с авто-классификацией.
 * Mission 15: Intelligent Data Hub
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const caseId = formData.get("caseId") as string;
        const files = formData.getAll("files") as File[];

        if (!caseId) {
            return NextResponse.json(
                { error: "Case ID is required" },
                { status: 400 }
            );
        }

        if (files.length === 0) {
            return NextResponse.json(
                { error: "No files provided" },
                { status: 400 }
            );
        }

        // Verify case exists
        const caseExists = await prisma.case.findUnique({
            where: { id: caseId }
        });

        if (!caseExists) {
            return NextResponse.json(
                { error: "Case not found" },
                { status: 404 }
            );
        }

        const results = [];

        for (const file of files) {
            // Create document record
            const document = await prisma.document.create({
                data: {
                    caseId,
                    name: file.name,
                    originalName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    type: classifyByFilename(file.name),
                    ocrStatus: "PENDING",
                },
            });

            results.push({
                id: document.id,
                name: document.name,
                type: document.type,
                status: "uploaded",
            });

            // TODO: Trigger async OCR processing
            // await triggerOCRProcessing(document.id);
        }

        return NextResponse.json({
            success: true,
            uploaded: results.length,
            documents: results,
        });

    } catch (error) {
        console.error("Batch upload error:", error);
        return NextResponse.json(
            { error: "Failed to process upload" },
            { status: 500 }
        );
    }
}

/**
 * Simple filename-based classification
 */
function classifyByFilename(filename: string): string {
    const lower = filename.toLowerCase();

    if (lower.includes("contract") || lower.includes("عقد")) {
        return "CONTRACT";
    }
    if (lower.includes("court") || lower.includes("محكمة") || lower.includes("حكم")) {
        return "COURT";
    }
    if (lower.includes("salary") || lower.includes("راتب") || lower.includes("bank")) {
        return "FINANCIAL";
    }
    if (lower.includes("expert") || lower.includes("خبير") || lower.includes("تقرير")) {
        return "EXPERT_WORK";
    }

    return "OTHER";
}

/**
 * GET /api/documents/batch-upload
 * 
 * Get documents for a case with intelligence data
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const caseId = searchParams.get("caseId");

        if (!caseId) {
            return NextResponse.json(
                { error: "Case ID is required" },
                { status: 400 }
            );
        }

        const documents = await prisma.document.findMany({
            where: { caseId },
            orderBy: { createdAt: "desc" },
        });

        // Transform to DocumentItem format
        const items = documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            category: doc.type || "OTHER",
            status: {
                ocr: doc.ocrStatus === "DONE" ? "done" : doc.ocrStatus === "FAILED" ? "error" : "pending",
                ai_summary: doc.extractedText ? "done" : "pending",
                conflict: false, // TODO: Check from validation results
            },
            pageCount: 1, // TODO: Get from document metadata
            conflictCount: 0,
        }));

        return NextResponse.json({
            success: true,
            documents: items,
        });

    } catch (error) {
        console.error("Get documents error:", error);
        return NextResponse.json(
            { error: "Failed to get documents" },
            { status: 500 }
        );
    }
}
