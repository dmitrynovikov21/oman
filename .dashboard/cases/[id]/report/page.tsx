"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";
import { CalculationResult } from "@/lib/labor-law";

// Report Sections
const reportSections = [
    { id: "intro", name: "Introduction & Case Summary", required: true, enabled: true },
    { id: "parties", name: "Parties Information", required: true, enabled: true },
    { id: "facts", name: "Statement of Facts", required: false, enabled: true },
    { id: "calculation", name: "Expert Calculation Table", required: true, enabled: true },
    { id: "opinion", name: "Expert Opinion & Conclusion", required: true, enabled: true },
];

export default function ReportPage() {
    const params = useParams();
    const caseId = params.id as string;

    // State
    const [sections, setSections] = useState(reportSections);
    const [expertOpinion, setExpertOpinion] = useState("");
    const [caseData, setCaseData] = useState<any>(null);
    const [calculationData, setCalculationData] = useState<CalculationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);

    // Fetch Data
    useEffect(() => {
        async function loadData() {
            try {
                const [caseRes, calcRes] = await Promise.all([
                    fetch(`/api/cases/${caseId}`),
                    fetch(`/api/cases/${caseId}/calculations`)
                ]);

                if (caseRes.ok) {
                    const data = await caseRes.json();
                    setCaseData(data);
                }

                if (calcRes.ok) {
                    const data = await calcRes.json();
                    if (data.calculation && data.calculation.detailsJson) {
                        const saved = JSON.parse(data.calculation.detailsJson);
                        if (saved.results) {
                            setCalculationData(saved.results);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading report data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [caseId]);

    // Toggle section
    const toggleSection = (id: string) => {
        setSections(prev =>
            prev.map(s => (s.id === id && !s.required ? { ...s, enabled: !s.enabled } : s))
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGenerateDocx = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseId,
                    caseNumber: caseData?.caseNumber || 'N/A',
                    courtName: caseData?.courtName || '',
                    plaintiffName: caseData?.plaintiffName || '',
                    defendantName: caseData?.defendantName || '',
                    basicSalary: calculationData?.eosb ? 750 : 0,
                    grossSalary: 1150,
                    eosb: calculationData?.eosb || 0,
                    noticePay: calculationData?.noticePay || 0,
                    leavePay: calculationData?.leavePay || 0,
                    totalDue: calculationData?.totalDue || 0,
                    yearsOfService: calculationData?.yearsOfService || 0,
                    monthsOfService: calculationData?.monthsOfService || 0,
                })
            });

            const result = await response.json();

            if (result.success && result.downloadUrl) {
                // Open download link
                window.open(result.downloadUrl, '_blank');
            } else {
                alert('Failed to generate report: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading case data...</div>;

    // Report Content Component (Rendered for Preview and Print)
    const ReportContent = () => (
        <div className="bg-white text-black p-12 w-[210mm] min-h-[297mm] mx-auto shadow-2xl shadow-zinc-900/5 font-serif print:shadow-none print:w-full" dir="rtl">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-8">
                <h1 className="text-2xl font-bold mb-2">تقرير خبرة حسابية</h1>
                <h2 className="text-xl">لدى {caseData?.courtName || "المكمة المختصة"}</h2>
                <div className="mt-4 flex justify-between text-sm">
                    <p>رقم الدعوى: {caseData?.caseNumber}</p>
                    <p>التاريخ: {format(new Date(), "yyyy/MM/dd")}</p>
                </div>
            </div>

            {/* Intro */}
            {sections.find(s => s.id === "intro")?.enabled && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">1. مقدمة</h3>
                    <p className="leading-relaxed mb-4">
                        بناءً على المأمورية الصادرة من عدالة المحكمة الموقرة في الدعوى رقم {caseData?.caseNumber}،
                        نقدم تقريرنا هذا بشأن احتساب المستحقات العمالية.
                    </p>
                </div>
            )}

            {/* Parties */}
            {sections.find(s => s.id === "parties")?.enabled && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">2. أطراف الدعوى</h3>
                    <table className="w-full border-collapse border border-gray-400 mb-4">
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 p-2 font-bold bg-gray-100 w-1/4">المدعي</td>
                                <td className="border border-gray-400 p-2">{caseData?.plaintiffName}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 p-2 font-bold bg-gray-100">المدعى عليه</td>
                                <td className="border border-gray-400 p-2">{caseData?.defendantName}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Facts - Placeholder */}
            {sections.find(s => s.id === "facts")?.enabled && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">3. وقائع الدعوى</h3>
                    <p className="leading-relaxed text-gray-500 italic">
                        [يتم تعبئة وقائع الدعوى هنا وتاريخ التعيين والراتب...]
                    </p>
                </div>
            )}

            {/* Calculation */}
            {sections.find(s => s.id === "calculation")?.enabled && calculationData && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">4. الحسابات والنتائج</h3>
                    <table className="w-full border-collapse border border-gray-400 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-400 p-2 text-right">البيان</th>
                                <th className="border border-gray-400 p-2 text-center w-32">القيمة (ر.ع)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 p-2">مكافأة نهاية الخدمة ({calculationData.yearsOfService} سنة)</td>
                                <td className="border border-gray-400 p-2 text-center font-bold">{calculationData.eosb.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 p-2">بدل الإجازات</td>
                                <td className="border border-gray-400 p-2 text-center font-bold">{calculationData.leavePay.toLocaleString()}</td>
                            </tr>
                            {(calculationData as any).noticePay > 0 && (
                                <tr>
                                    <td className="border border-gray-400 p-2">بدل الإشعار (Notice Pay)</td>
                                    <td className="border border-gray-400 p-2 text-center font-bold">{(calculationData as any).noticePay.toLocaleString()}</td>
                                </tr>
                            )}
                            {calculationData.unfairDismissalPay > 0 && (
                                <tr>
                                    <td className="border border-gray-400 p-2">تعويض الفصل التعسفي</td>
                                    <td className="border border-gray-400 p-2 text-center font-bold">{calculationData.unfairDismissalPay.toLocaleString()}</td>
                                </tr>
                            )}
                            <tr className="bg-gray-200 font-bold">
                                <td className="border border-gray-400 p-2">الإجمالي المستحق</td>
                                <td className="border border-gray-400 p-2 text-center">{calculationData.totalDue.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Opinion */}
            {sections.find(s => s.id === "opinion")?.enabled && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">5. الرأي الفني (الخلاصة)</h3>
                    <p className="leading-relaxed whitespace-pre-wrap mb-4">
                        {expertOpinion || "بناءً على ما تقدم، نرى استحقاق المدعي للمبالغ الموضحة في الجدول أعلاه..."}
                    </p>
                    <div className="mt-12 flex justify-end">
                        <div className="text-center w-64">
                            <p className="font-bold mb-16">الخبير الحسابي</p>
                            <p className="border-t border-black pt-2">التوقيع / الختم</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-100 print:bg-white print:block">
            {/* Sidebar - Report Structure */}
            <div className="w-[280px] flex-shrink-0 bg-zinc-50 border-r border-zinc-200 flex flex-col print:hidden">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-zinc-100">
                    <Link href={`/cases/${caseId}`} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1">
                        <Icons.chevronLeft className="size-4" />
                        Back to Case
                    </Link>
                </div>

                {/* Report Structure */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-3 mb-4">Report Structure</h4>
                    <div className="px-2 space-y-1">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                onClick={() => !section.required && toggleSection(section.id)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${section.enabled
                                        ? 'bg-white shadow-sm text-zinc-900 font-medium'
                                        : 'text-zinc-500 hover:bg-zinc-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icons.gripVertical className="size-3 text-zinc-300 hover:text-zinc-500" />
                                    <span>{section.name}</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={section.enabled}
                                    onChange={() => toggleSection(section.id)}
                                    disabled={section.required}
                                    className="rounded border-zinc-300"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Expert Opinion */}
                    <div className="mt-8">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-3 mb-4">Expert Opinion</h4>
                        <div className="px-2">
                            <textarea
                                value={expertOpinion}
                                onChange={(e) => setExpertOpinion(e.target.value)}
                                placeholder="Enter your expert conclusion..."
                                className="w-full h-32 p-3 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-950 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Area - Paper Preview */}
            <div className="flex-1 overflow-y-auto py-8 px-12 print:p-0 print:overflow-visible">
                <div ref={printRef} className="transition-transform">
                    <ReportContent />
                </div>
            </div>

            {/* Floating Toolbar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 backdrop-blur text-white rounded-full px-6 py-3 shadow-xl flex gap-6 items-center print:hidden">
                <button
                    onClick={handlePrint}
                    className="hover:text-zinc-300 transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <Icons.printer className="size-4" />
                    Print
                </button>
                <div className="w-px h-4 bg-zinc-700" />
                <button
                    onClick={handleGenerateDocx}
                    disabled={isGenerating}
                    className="hover:text-zinc-300 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {isGenerating ? (
                        <Icons.spinner className="size-4 animate-spin" />
                    ) : (
                        <Icons.fileText className="size-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Export DOCX'}
                </button>
            </div>


            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    div[ref="printRef"], div[ref="printRef"] * {
                        visibility: visible;
                    }
                    div[ref="printRef"] {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    /* Hide scrollbars, headers, sidebars */
                    nav, header, aside {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
