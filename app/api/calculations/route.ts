import { NextRequest, NextResponse } from "next/server";

// Types
interface SalaryComponent {
    name: string;
    amount: number;
    isGrossPart: boolean;
}

interface CalculationInput {
    caseId: string;
    salaryComponents: SalaryComponent[];
    startDate: string;
    endDate: string;
    article40: boolean;
    unusedLeaveDays: number;
    unfairDismissalMonths: number;
}

// Calculate EOSB according to Oman Labor Law
function calculateEOSB(
    basicSalary: number,
    yearsOfService: number,
    article40: boolean
): number {
    if (article40) return 0; // Article 40 termination = no EOSB

    let eosb = 0;
    const dailyRate = basicSalary / 30;

    if (yearsOfService <= 3) {
        // First 3 years: 15 days per year
        eosb = dailyRate * 15 * yearsOfService;
    } else {
        // First 3 years: 15 days per year
        eosb = dailyRate * 15 * 3;
        // After 3 years: 30 days per year
        eosb += dailyRate * 30 * (yearsOfService - 3);
    }

    return Math.round(eosb * 1000) / 1000; // Round to 3 decimal places
}

// Calculate leave entitlement
function calculateLeaveEntitlement(
    grossSalary: number,
    unusedDays: number
): number {
    const dailyRate = grossSalary / 30;
    return Math.round(dailyRate * unusedDays * 1000) / 1000;
}

// Calculate service period
function calculateServicePeriod(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    // Round to nearest 0.5 year if months >= 6
    const totalYears = years + (months >= 6 ? 0.5 : 0);

    return { years, months, totalYears };
}

// POST /api/calculations - Calculate EOSB and entitlements
export async function POST(request: NextRequest) {
    try {
        // In production, add auth check here

        const body: CalculationInput = await request.json();

        // Validate required fields
        if (!body.salaryComponents || !body.startDate || !body.endDate) {
            return NextResponse.json(
                { error: "Missing required fields: salaryComponents, startDate, endDate" },
                { status: 400 }
            );
        }

        // Calculate salary totals
        const basicSalary = body.salaryComponents
            .filter((c) => c.name.toLowerCase().includes("basic"))
            .reduce((sum, c) => sum + c.amount, 0);

        const grossSalary = body.salaryComponents
            .filter((c) => c.isGrossPart)
            .reduce((sum, c) => sum + c.amount, 0);

        const totalSalary = body.salaryComponents.reduce((sum, c) => sum + c.amount, 0);

        // Calculate service period
        const servicePeriod = calculateServicePeriod(body.startDate, body.endDate);

        // Calculate EOSB
        const eosb = calculateEOSB(basicSalary, servicePeriod.totalYears, body.article40);

        // Calculate leave entitlement
        const leaveEntitlement = calculateLeaveEntitlement(grossSalary, body.unusedLeaveDays || 0);

        // Calculate unfair dismissal compensation
        const unfairDismissal = body.article40
            ? 0
            : basicSalary * (body.unfairDismissalMonths || 0);

        // Total due
        const totalDue = eosb + leaveEntitlement + unfairDismissal;

        // Build response
        const result = {
            input: {
                salaryComponents: body.salaryComponents,
                basicSalary,
                grossSalary,
                totalSalary,
                servicePeriod,
                article40: body.article40,
                unusedLeaveDays: body.unusedLeaveDays || 0,
                unfairDismissalMonths: body.unfairDismissalMonths || 0,
            },
            calculations: {
                eosb,
                leaveEntitlement,
                unfairDismissal,
                totalDue,
            },
            breakdown: {
                eosbFormula: body.article40
                    ? "Article 40 applied - EOSB forfeited"
                    : servicePeriod.totalYears <= 3
                        ? `(${basicSalary} ÷ 30) × 15 × ${servicePeriod.totalYears} = ${eosb} OMR`
                        : `(${basicSalary} ÷ 30) × 15 × 3 + (${basicSalary} ÷ 30) × 30 × ${servicePeriod.totalYears - 3} = ${eosb} OMR`,
                leaveFormula: `(${grossSalary} ÷ 30) × ${body.unusedLeaveDays || 0} = ${leaveEntitlement} OMR`,
                unfairDismissalFormula: body.article40
                    ? "Article 40 applied - no compensation"
                    : `${basicSalary} × ${body.unfairDismissalMonths || 0} = ${unfairDismissal} OMR`,
            },
            meta: {
                calculatedAt: new Date().toISOString(),
                lawReference: "Oman Labor Law (Royal Decree 35/2003)",
                caseId: body.caseId,
            },
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error calculating:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
