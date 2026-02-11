import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/search - Global search across cases and documents
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";
        const type = searchParams.get("type"); // "cases", "documents", or null for all
        const limit = parseInt(searchParams.get("limit") || "20");

        if (!query || query.length < 2) {
            return NextResponse.json({
                results: [],
                message: "Query must be at least 2 characters"
            });
        }

        const results: any = { cases: [], documents: [], total: 0 };

        // Search Cases
        if (!type || type === "cases") {
            const cases = await prisma.case.findMany({
                where: {
                    OR: [
                        { caseNumber: { contains: query } },
                        { plaintiffName: { contains: query } },
                        { defendantName: { contains: query } },
                        { courtName: { contains: query } },
                    ],
                },
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    caseNumber: true,
                    year: true,
                    plaintiffName: true,
                    defendantName: true,
                    status: true,
                    courtName: true,
                },
            });
            results.cases = cases;
        }

        // Search Documents (including extracted OCR text)
        if (!type || type === "documents") {
            const documents = await prisma.document.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { originalName: { contains: query } },
                        { extractedText: { contains: query } },
                    ],
                },
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    ocrStatus: true,
                    caseId: true,
                    case: {
                        select: { caseNumber: true, year: true }
                    },
                    // Include snippet of matched text for context
                    extractedText: true,
                },
            });

            // Create text snippets around the match
            results.documents = documents.map((doc: any) => {
                let snippet: string | null = null;
                if (doc.extractedText) {
                    const lowerText = doc.extractedText.toLowerCase();
                    const lowerQuery = query.toLowerCase();
                    const matchIndex = lowerText.indexOf(lowerQuery);
                    if (matchIndex !== -1) {
                        const start = Math.max(0, matchIndex - 50);
                        const end = Math.min(doc.extractedText.length, matchIndex + query.length + 50);
                        snippet = (start > 0 ? "..." : "") +
                            doc.extractedText.substring(start, end) +
                            (end < doc.extractedText.length ? "..." : "");
                    }
                }
                return {
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    ocrStatus: doc.ocrStatus,
                    caseId: doc.caseId,
                    caseNumber: doc.case?.caseNumber,
                    caseYear: doc.case?.year,
                    snippet,
                };
            });
        }

        results.total = results.cases.length + results.documents.length;

        return NextResponse.json(results);
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
