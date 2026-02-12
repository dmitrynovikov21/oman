import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getModel } from "@/lib/chat/gemini";

interface ChatRequest {
    sessionId: string;
    message: string;
    lang?: string;
}

const MAX_HISTORY = 20;
const MAX_MESSAGES_PER_SESSION = 60;

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ChatRequest;
        const { sessionId, message, lang = "en" } = body;

        if (!sessionId || !message?.trim()) {
            return NextResponse.json(
                { error: "sessionId and message are required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "AI service is not configured" },
                { status: 503 }
            );
        }

        // 1. Find or create session
        let session = await prisma.chatSession.findUnique({
            where: { sessionId },
            include: { messages: { orderBy: { createdAt: "asc" } } },
        });

        if (!session) {
            session = await prisma.chatSession.create({
                data: { sessionId, lang },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });
        }

        // 2. Rate limit check
        if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
            return NextResponse.json(
                {
                    reply:
                        lang === "ar"
                            ? "لقد وصلت إلى الحد الأقصى للرسائل في هذه الجلسة. يرجى تحديث الصفحة لبدء محادثة جديدة."
                            : "You've reached the message limit for this session. Please refresh to start a new conversation.",
                },
                { status: 200 }
            );
        }

        // 3. Save user message
        await prisma.chatMessage.create({
            data: {
                chatSessionId: session.id,
                role: "user",
                content: message.trim(),
            },
        });

        // 4. Build history for Gemini
        const recentMessages = session.messages.slice(-MAX_HISTORY);
        const history = recentMessages.map((msg) => ({
            role: msg.role === "user" ? ("user" as const) : ("model" as const),
            parts: [{ text: msg.content }],
        }));

        // 5. Call Gemini
        const model = getModel();
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message.trim());
        const response = result.response;

        let replyText = "";
        let functionCallResult: { name: string; response: { success: boolean; message: string } } | null = null;

        // 6. Check for function calls
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0];

            if (fc.name === "submit_lead") {
                const args = fc.args as Record<string, string>;

                // Save lead to DB
                await prisma.chatLead.create({
                    data: {
                        sessionId,
                        name: args.name || "Unknown",
                        email: args.email || "",
                        company: args.company || null,
                        message: args.message || null,
                    },
                });

                functionCallResult = {
                    name: fc.name,
                    response: { success: true, message: "Lead saved successfully" },
                };

                // Send function response back to Gemini
                const followUp = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: fc.name,
                            response: { success: true, message: "Lead saved. The team will contact them within 24 hours." },
                        },
                    },
                ]);

                replyText = followUp.response.text() || "";
            }
        } else {
            replyText = response.text() || "";
        }

        // 7. Save assistant message
        if (replyText) {
            await prisma.chatMessage.create({
                data: {
                    chatSessionId: session.id,
                    role: "assistant",
                    content: replyText,
                },
            });
        }

        return NextResponse.json({
            reply: replyText,
            functionCall: functionCallResult,
        });
    } catch (error) {
        console.error("[Chat API Error]", error);
        return NextResponse.json(
            { error: "Failed to process message" },
            { status: 500 }
        );
    }
}
