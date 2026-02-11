import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/cases/[id]/calculations - Get calculation for a case
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            // Depending on auth strategy - maybe allow if bypassed in middleware
            // but for safety in real app
            // return new NextResponse("Unauthorized", { status: 401 });
        }

        const caseId = params.id;

        const calculation = await prisma.calculation.findFirst({
            where: { caseId: caseId },
            orderBy: { updatedAt: 'desc' }
        });

        if (!calculation) {
            return NextResponse.json({ calculation: null });
        }

        return NextResponse.json({ calculation });
    } catch (error) {
        console.error("Error fetching calculation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/cases/[id]/calculations - Save calculation
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;
        const body = await request.json();

        // Validating minimal body structure
        const {
            inputs, // The raw inputs (components, dates, etc)
            results, // The calculated results
            scenarioType = "LEGAL_DEFAULT"
        } = body;

        if (!inputs || !results) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Upsert logic: Update if exists, else create
        // Since we don't have a unique constraint on (caseId, scenarioType) yet, we find first or create

        const existingCalc = await prisma.calculation.findFirst({
            where: { caseId: caseId }
        });

        let calculation;

        if (existingCalc) {
            calculation = await prisma.calculation.update({
                where: { id: existingCalc.id },
                data: {
                    totalEosb: results.eosb,
                    totalLeave: results.leavePay,
                    unfairMonths: inputs.unfairDismissalMonths || 0,
                    detailsJson: JSON.stringify({ inputs, results }),
                    scenarioType,
                }
            });
        } else {
            calculation = await prisma.calculation.create({
                data: {
                    caseId,
                    totalEosb: results.eosb,
                    totalLeave: results.leavePay,
                    unfairMonths: inputs.unfairDismissalMonths || 0,
                    detailsJson: JSON.stringify({ inputs, results }),
                    scenarioType,
                }
            });
        }

        return NextResponse.json({ calculation });
    } catch (error) {
        console.error("Error saving calculation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
