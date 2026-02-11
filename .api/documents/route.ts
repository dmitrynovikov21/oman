import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET /api/documents - List documents (REAL DB)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const caseId = searchParams.get("caseId");
        const type = searchParams.get("type");
        const status = searchParams.get("status");

        const where: any = {};
        if (caseId) where.caseId = caseId;
        if (type) where.type = type.toUpperCase();
        if (status) where.ocrStatus = status.toUpperCase();

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                case: { select: { id: true, caseNumber: true, year: true } },
            },
        });

        return NextResponse.json({ documents, total: documents.length });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/documents - Upload document with AUTO OCR
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const caseId = formData.get("caseId") as string;
        const type = formData.get("type") as string || "OTHER";
        const autoOcr = formData.get("autoOcr") !== "false"; // Default true

        if (!file) {
            return NextResponse.json({ error: "File is required" }, { status: 400 });
        }

        if (!caseId) {
            return NextResponse.json({ error: "Case ID is required" }, { status: 400 });
        }

        // Verify case exists
        const caseExists = await prisma.case.findUnique({ where: { id: caseId } });
        if (!caseExists) {
            return NextResponse.json({ error: "Case not found" }, { status: 404 });
        }

        // Create uploads directory if not exists
        const uploadsDir = join(process.cwd(), "public", "uploads", caseId);
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = join(uploadsDir, fileName);
        const relativeFilePath = `/uploads/${caseId}/${fileName}`;

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create document record in DB
        const document = await prisma.document.create({
            data: {
                caseId,
                name: file.name,
                originalName: file.name,
                filePath: relativeFilePath,
                fileSize: file.size,
                mimeType: file.type,
                type: type.toUpperCase(),
                ocrStatus: "PENDING",
            },
        });

        // AUTO OCR for PDF files - call /api/ocr endpoint
        let ocrResult: any = null;
        if (autoOcr && file.type === "application/pdf") {
            try {
                // Update status to PROCESSING
                await prisma.document.update({
                    where: { id: document.id },
                    data: { ocrStatus: "PROCESSING" },
                });

                // Call the /api/ocr endpoint internally (uses unpdf + Tesseract)
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                const ocrResponse = await fetch(`${baseUrl}/api/ocr`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ documentId: document.id }),
                });

                if (ocrResponse.ok) {
                    const ocrData = await ocrResponse.json();
                    if (ocrData.success) {
                        ocrResult = {
                            method: "unpdf+tesseract",
                            chars: ocrData.stats?.characters || 0,
                            pages: ocrData.stats?.pages || 1,
                            preview: ocrData.document?.extractedText?.substring(0, 300) || "",
                        };
                    } else {
                        ocrResult = { method: "failed", error: ocrData.error || "OCR failed" };
                    }
                } else {
                    // OCR API call failed
                    await prisma.document.update({
                        where: { id: document.id },
                        data: { ocrStatus: "FAILED" },
                    });
                    ocrResult = { method: "failed", error: "OCR API error" };
                }
            } catch (ocrError: any) {
                console.error("OCR processing error:", ocrError);
                await prisma.document.update({
                    where: { id: document.id },
                    data: { ocrStatus: "FAILED" },
                });
                ocrResult = { method: "failed", error: ocrError.message };
            }
        }

        // Fetch updated document
        const updatedDocument = await prisma.document.findUnique({
            where: { id: document.id },
        });

        return NextResponse.json({
            document: updatedDocument,
            ocr: ocrResult,
        }, { status: 201 });
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}
