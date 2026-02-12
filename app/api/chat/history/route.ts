import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.nextUrl.searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json(
                { error: "sessionId is required" },
                { status: 400 }
            );
        }

        const session = await prisma.chatSession.findUnique({
            where: { sessionId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        role: true,
                        content: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!session) {
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json({ messages: session.messages });
    } catch (error) {
        console.error("[Chat History Error]", error);
        return NextResponse.json(
            { error: "Failed to load history" },
            { status: 500 }
        );
    }
}
