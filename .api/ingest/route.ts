import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Configuration
const UPLOAD_DIR = join(process.cwd(), "data", "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/png",
];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files provided" },
                { status: 400 }
            );
        }

        // Generate case ID
        const caseId = uuidv4();
        const caseDir = join(UPLOAD_DIR, caseId);

        // Create directory
        await mkdir(caseDir, { recursive: true });

        const savedFiles: string[] = [];

        for (const file of files) {
            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                continue;
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds 50MB limit` },
                    { status: 413 }
                );
            }

            // Save file
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filePath = join(caseDir, file.name);
            await writeFile(filePath, buffer);
            savedFiles.push(file.name);
        }

        if (savedFiles.length === 0) {
            return NextResponse.json(
                { error: "No valid files uploaded. Allowed: PDF, ZIP, JPEG, PNG" },
                { status: 400 }
            );
        }

        // Return success response
        // In production, this would trigger a background OCR job
        return NextResponse.json({
            case_id: caseId,
            status: "PROCESSING",
            message: `Case created. ${savedFiles.length} file(s) queued for processing.`,
            files_received: savedFiles.length,
            files: savedFiles,
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to process upload" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Use POST to upload files",
        allowed_types: ALLOWED_TYPES,
        max_size_mb: 50,
    });
}
