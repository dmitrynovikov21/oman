import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// API endpoint to generate reports using Python Document Factory
// POST /api/reports/generate

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.caseId || !body.caseNumber) {
            return NextResponse.json(
                { error: "Missing required fields: caseId, caseNumber" },
                { status: 400 }
            );
        }

        // Build report data from request
        const reportData = {
            case_number: body.caseNumber || "N/A",
            court_name: body.courtName || "المحكمة الابتدائية",
            wilaya: body.wilaya || "مسقط",
            plaintiff_name: body.plaintiffName || "غير محدد",
            defendant_name: body.defendantName || "غير محدد",
            gregorian_date: body.gregorianDate || new Date().toISOString().split('T')[0],
            hijri_date: body.hijriDate || "",
            assignment_date: body.assignmentDate || "",
            basic_salary: body.basicSalary || 0,
            gross_salary: body.grossSalary || 0,
            eosb: body.eosb || 0,
            notice_pay: body.noticePay || 0,
            leave_pay: body.leavePay || 0,
            total_due: body.totalDue || 0,
            years_of_service: body.yearsOfService || 0,
            months_of_service: body.monthsOfService || 0,
            expert_name: body.expertName || "طارق الخبير",
        };

        // Call Python script to generate document
        const pythonScript = path.join(process.cwd(), "backend", "generate_report_api.py");

        return new Promise<NextResponse>((resolve) => {
            const python = spawn("python", [pythonScript, JSON.stringify(reportData)]);

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
                        { error: "Report generation failed", details: stderr },
                        { status: 500 }
                    ));
                    return;
                }

                try {
                    const result = JSON.parse(stdout.trim());

                    if (result.success) {
                        // Return download URL
                        const docxFilename = path.basename(result.docx_path);
                        const downloadUrl = `/generated_reports/${docxFilename}`;

                        resolve(NextResponse.json({
                            success: true,
                            downloadUrl,
                            docxPath: result.docx_path,
                            pdfPath: result.pdf_path,
                            message: result.message
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
                        { error: "Failed to parse Python response" },
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

// GET endpoint to list available templates
export async function GET() {
    try {
        const templatesDir = path.join(process.cwd(), "backend", "templates");

        if (!fs.existsSync(templatesDir)) {
            return NextResponse.json({ templates: [] });
        }

        const files = fs.readdirSync(templatesDir)
            .filter(f => f.endsWith('.docx'))
            .map(f => ({
                name: f,
                displayName: f.replace('.docx', '').replace(/_/g, ' ')
            }));

        return NextResponse.json({ templates: files });
    } catch (error) {
        console.error("Error listing templates:", error);
        return NextResponse.json(
            { error: "Failed to list templates" },
            { status: 500 }
        );
    }
}
