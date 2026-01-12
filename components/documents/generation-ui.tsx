"use client";

/**
 * Document Generation UI Components
 * Module C: Progress indicators and status for document generation
 * 
 * Features:
 * - Progress bar for document generation
 * - Stage indicators (Template → Fill → Convert → Done)
 * - Download buttons with format selection
 */

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

interface GenerationStage {
    id: string;
    label: string;
    labelAr: string;
    icon: React.ReactNode;
}

const GENERATION_STAGES: GenerationStage[] = [
    { id: "loading", label: "Loading Template", labelAr: "تحميل القالب", icon: <Icons.fileText className="h-4 w-4" /> },
    { id: "filling", label: "Filling Data", labelAr: "ملء البيانات", icon: <Icons.edit className="h-4 w-4" /> },
    { id: "converting", label: "Converting to PDF", labelAr: "التحويل إلى PDF", icon: <Icons.refresh className="h-4 w-4 animate-spin" /> },
    { id: "done", label: "Complete", labelAr: "مكتمل", icon: <Icons.check className="h-4 w-4" /> },
];

interface DocumentGenerationProgressProps {
    currentStage: "loading" | "filling" | "converting" | "done" | "error";
    progress: number; // 0-100
    errorMessage?: string;
    className?: string;
}

/**
 * Progress bar with stages for document generation
 */
export function DocumentGenerationProgress({
    currentStage,
    progress,
    errorMessage,
    className,
}: DocumentGenerationProgressProps) {
    const currentIndex = GENERATION_STAGES.findIndex(s => s.id === currentStage);

    return (
        <div className={cn("bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900">Generating Document</h3>
                <span className="text-sm text-zinc-500">{progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-6">
                <div
                    className={cn(
                        "h-full transition-all duration-500",
                        currentStage === "error" ? "bg-red-500" : "bg-blue-500"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Stage indicators */}
            <div className="flex justify-between">
                {GENERATION_STAGES.map((stage, index) => (
                    <div key={stage.id} className="flex flex-col items-center">
                        <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-colors",
                            index < currentIndex ? "bg-blue-500 text-white" :
                                index === currentIndex && currentStage !== "error" ? "bg-blue-100 text-blue-600" :
                                    currentStage === "error" && index === currentIndex ? "bg-red-100 text-red-600" :
                                        "bg-zinc-100 text-zinc-400"
                        )}>
                            {stage.icon}
                        </div>
                        <span className={cn(
                            "text-xs text-center",
                            index <= currentIndex ? "text-zinc-700" : "text-zinc-400"
                        )}>
                            {stage.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Error message */}
            {currentStage === "error" && errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
            )}
        </div>
    );
}

interface DocumentDownloadCardProps {
    docxPath?: string;
    pdfPath?: string;
    filename: string;
    onDownload: (format: "docx" | "pdf") => void;
    isLoading?: boolean;
}

/**
 * Download card with format selection
 */
export function DocumentDownloadCard({
    docxPath,
    pdfPath,
    filename,
    onDownload,
    isLoading,
}: DocumentDownloadCardProps) {
    return (
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-2xl">
                    <Icons.check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-zinc-900">Document Ready</h3>
                    <p className="text-sm text-zinc-500">{filename}</p>
                </div>
            </div>

            <div className="flex gap-3">
                {docxPath && (
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => onDownload("docx")}
                        disabled={isLoading}
                    >
                        <Icons.fileText className="h-4 w-4 mr-2" />
                        Download DOCX
                    </Button>
                )}
                {pdfPath && (
                    <Button
                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
                        onClick={() => onDownload("pdf")}
                        disabled={isLoading}
                    >
                        <Icons.fileText className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                )}
            </div>

            {!pdfPath && docxPath && (
                <p className="text-xs text-amber-600 mt-3 text-center">
                    PDF not available (LibreOffice not installed)
                </p>
            )}
        </div>
    );
}

/**
 * Full document generation flow component
 */
export function DocumentGenerationFlow({
    caseId,
    templateName = "eosb_report_template.docx",
    onComplete,
    onError,
}: {
    caseId: string;
    templateName?: string;
    onComplete?: (paths: { docx?: string; pdf?: string }) => void;
    onError?: (error: string) => void;
}) {
    const [stage, setStage] = useState<"loading" | "filling" | "converting" | "done" | "error">("loading");
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ docxPath?: string; pdfPath?: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        generateDocument();
    }, [caseId]);

    const generateDocument = async () => {
        try {
            // Stage 1: Loading
            setStage("loading");
            setProgress(10);
            await new Promise(r => setTimeout(r, 500));

            // Stage 2: Filling
            setStage("filling");
            setProgress(30);

            const response = await fetch(`/api/reports/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId, templateName }),
            });

            setProgress(60);

            if (!response.ok) {
                throw new Error("Failed to generate document");
            }

            // Stage 3: Converting
            setStage("converting");
            setProgress(80);
            await new Promise(r => setTimeout(r, 500));

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Generation failed");
            }

            // Stage 4: Done
            setStage("done");
            setProgress(100);
            setResult({ docxPath: data.docx_path, pdfPath: data.pdf_path });
            onComplete?.({ docx: data.docx_path, pdf: data.pdf_path });

        } catch (error) {
            setStage("error");
            setErrorMessage(error instanceof Error ? error.message : "Unknown error");
            onError?.(errorMessage);
        }
    };

    const handleDownload = (format: "docx" | "pdf") => {
        const path = format === "docx" ? result?.docxPath : result?.pdfPath;
        if (path) {
            window.open(path, "_blank");
        }
    };

    return (
        <div className="space-y-4">
            {stage !== "done" && (
                <DocumentGenerationProgress
                    currentStage={stage}
                    progress={progress}
                    errorMessage={errorMessage}
                />
            )}

            {stage === "done" && result && (
                <DocumentDownloadCard
                    docxPath={result.docxPath}
                    pdfPath={result.pdfPath}
                    filename={`report_${caseId}`}
                    onDownload={handleDownload}
                />
            )}
        </div>
    );
}

/**
 * Skeleton loader for document preview
 */
export function DocumentPreviewSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm animate-pulse">
            <div className="aspect-[8.5/11] bg-zinc-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 bg-zinc-200 rounded-2xl mx-auto mb-3" />
                    <div className="h-4 w-24 bg-zinc-200 rounded mx-auto" />
                </div>
            </div>
        </div>
    );
}
