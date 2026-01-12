import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/cases - List all cases (REAL DB)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: any = {};

        if (status) {
            where.status = status.toUpperCase();
        }

        if (search) {
            where.OR = [
                { caseNumber: { contains: search } },
                { plaintiffName: { contains: search } },
                { defendantName: { contains: search } },
            ];
        }

        const [cases, total] = await Promise.all([
            prisma.case.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    documents: { select: { id: true, name: true, type: true, ocrStatus: true } },
                    _count: { select: { documents: true, meetings: true, calculations: true } },
                },
            }),
            prisma.case.count({ where }),
        ]);

        return NextResponse.json({
            cases,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching cases:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/cases - Create new case (REAL DB)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.caseNumber || !body.year) {
            return NextResponse.json(
                { error: "Case number and year are required" },
                { status: 400 }
            );
        }

        const newCase = await prisma.case.create({
            data: {
                caseNumber: body.caseNumber,
                year: body.year,
                courtName: body.courtName || null,
                status: body.status || "DRAFT",
                plaintiffName: body.plaintiffName || null,
                defendantName: body.defendantName || null,
                assignedDate: body.assignedDate ? new Date(body.assignedDate) : null,
                deadlineDate: body.deadlineDate ? new Date(body.deadlineDate) : null,
            },
        });

        return NextResponse.json({ case: newCase }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating case:", error);

        // Handle unique constraint violation
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Case with this number and year already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
