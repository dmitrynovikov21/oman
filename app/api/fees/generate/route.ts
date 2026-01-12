import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// API endpoint to generate fee request letters
// POST /api/fees/generate

interface FeeRequestInput {
    caseId: string;
    caseNumber: string;
    courtName: string;
    plaintiffName: string;
    defendantName: string;
    agreedAmount: number;
    requestedAmount?: number;  // User can adjust
    bankName?: string;
    bankNameAr?: string;
    accountNumber?: string;
    iban?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: FeeRequestInput = await request.json();

        // Validate required fields
        if (!body.caseNumber || !body.agreedAmount) {
            return NextResponse.json(
                { error: "Missing required fields: caseNumber, agreedAmount" },
                { status: 400 }
            );
        }

        // Build data for Python script
        const feeData = {
            case_number: body.caseNumber,
            court_name: body.courtName || "",
            plaintiff_name: body.plaintiffName || "",
            defendant_name: body.defendantName || "",
            agreed_amount: body.agreedAmount,
            requested_amount: body.requestedAmount || body.agreedAmount,
            bank_name: body.bankName || "Bank Muscat",
            bank_name_ar: body.bankNameAr || "بنك مسقط",
            account_number: body.accountNumber || "",
            iban: body.iban || "",
        };

        // Call Python script
        const pythonScript = path.join(process.cwd(), "backend", "fee_request_api.py");

        return new Promise<NextResponse>((resolve) => {
            const python = spawn("python", [pythonScript, JSON.stringify(feeData)]);

            let stdout = "";
            let stderr = "";

            python.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            python.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            python.on("close", (code) => {
                if (code !== 0) {
                    console.error("Python error:", stderr);
                    resolve(NextResponse.json(
                        { error: "Fee request generation failed", details: stderr },
                        { status: 500 }
                    ));
                    return;
                }

                try {
                    const result = JSON.parse(stdout.trim());

                    if (result.success) {
                        resolve(NextResponse.json({
                            success: true,
                            downloadUrl: result.download_url,
                            docxPath: result.docx_path,
                            hijriDate: result.hijri_date,
                            gregorianDate: result.gregorian_date,
                            amount: result.amount
                        }));
                    } else {
                        resolve(NextResponse.json(
                            { error: result.error || "Unknown error" },
                            { status: 500 }
                        ));
                    }
                } catch (parseError) {
                    console.error("Parse error:", parseError, "stdout:", stdout);
                    resolve(NextResponse.json(
                        { error: "Failed to parse response" },
                        { status: 500 }
                    ));
                }
            });

            python.on("error", (err) => {
                console.error("Spawn error:", err);
                resolve(NextResponse.json(
                    { error: "Failed to start Python process" },
                    { status: 500 }
                ));
            });
        });

    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
