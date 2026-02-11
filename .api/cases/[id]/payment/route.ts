import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// API endpoint to update payment status on a case
// PATCH /api/cases/[id]/payment

interface PaymentUpdateRequest {
    paymentStatus: "UNPAID" | "PAID";
    feeAmount?: number;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;
        const body: PaymentUpdateRequest = await request.json();

        if (!body.paymentStatus) {
            return NextResponse.json(
                { error: "paymentStatus is required" },
                { status: 400 }
            );
        }

        // Update case payment status
        const updatedCase = await prisma.case.update({
            where: { id: caseId },
            data: {
                paymentStatus: body.paymentStatus,
                ...(body.feeAmount !== undefined && { feeAmount: body.feeAmount }),
            },
        });

        return NextResponse.json({
            success: true,
            case: {
                id: updatedCase.id,
                paymentStatus: updatedCase.paymentStatus,
                feeAmount: updatedCase.feeAmount,
            },
        });
    } catch (error) {
        console.error("Payment update error:", error);
        return NextResponse.json(
            { error: "Failed to update payment status" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;

        const caseData = await prisma.case.findUnique({
            where: { id: caseId },
            select: {
                id: true,
                caseNumber: true,
                paymentStatus: true,
                feeAmount: true,
            },
        });

        if (!caseData) {
            return NextResponse.json(
                { error: "Case not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(caseData);
    } catch (error) {
        console.error("Payment fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment status" },
            { status: 500 }
        );
    }
}
