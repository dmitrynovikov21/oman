import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg"
        const filename = `${uuidv4()}.${ext}`

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), "public", "uploads")
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // Directory might already exist
        }

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)

        // Return public URL
        const url = `/uploads/${filename}`

        return NextResponse.json({
            success: true,
            url,
            filename
        })
    } catch (error: any) {
        console.error("Upload error:", error)
        return NextResponse.json({
            error: error.message || "Failed to upload file"
        }, { status: 500 })
    }
}
