"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentItem {
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    mimeType: string;
    ocrStatus: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
    extractedText: string;
    createdAt: string;
    fileSize: number;
}

interface ExtractedAnchor {
    field: string;
    value: string;
    maskedValue: string;
    source: string;
    confidence: number;
}

// Simple anchor extraction from text
function extractAnchors(text: string): ExtractedAnchor[] {
    const anchors: ExtractedAnchor[] = [];

    // Civil ID pattern
    const civilIdMatch = text.match(/\b\d{8}\b/);
    if (civilIdMatch) {
        anchors.push({
            field: "Civil ID",
            value: civilIdMatch[0],
            maskedValue: "[CIVIL_ID_1]",
            source: "regex",
            confidence: 0.95
        });
    }

    // Date pattern
    const dateMatch = text.match(/\b\d{4}[/-]\d{2}[/-]\d{2}\b/);
    if (dateMatch) {
        anchors.push({
            field: "Date",
            value: dateMatch[0],
            maskedValue: dateMatch[0], // Dates not masked
            source: "regex",
            confidence: 0.95
        });
    }

    // Amount pattern
    const amountMatch = text.match(/\b\d{1,3}(?:,\d{3})*\.\d{3}\b/);
    if (amountMatch) {
        anchors.push({
            field: "Amount (OMR)",
            value: amountMatch[0],
            maskedValue: "[AMOUNT_1]",
            source: "regex",
            confidence: 0.90
        });
    }

    // Case number pattern
    const caseMatch = text.match(/\b\d{1,5}\/\d{4}\b/);
    if (caseMatch) {
        anchors.push({
            field: "Case Number",
            value: caseMatch[0],
            maskedValue: caseMatch[0], // Case numbers not masked
            source: "regex",
            confidence: 0.95
        });
    }

    return anchors;
}

export function DocumentsPageClient({
    caseId,
    caseNumber,
    documents,
}: {
    caseId: string;
    caseNumber: string;
    documents: DocumentItem[];
}) {
    const [isPrivate, setIsPrivate] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(
        documents.length > 0 ? documents[0] : null
    );

    const selectedAnchors = selectedDoc?.extractedText
        ? extractAnchors(selectedDoc.extractedText)
        : [];

    const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
        DONE: { icon: "✓", color: "text-green-600 bg-green-100", label: "OCR Done" },
        PENDING: { icon: "○", color: "text-amber-500 bg-amber-100", label: "Pending" },
        PROCESSING: { icon: "◐", color: "text-blue-500 bg-blue-100", label: "Processing" },
        FAILED: { icon: "✗", color: "text-red-500 bg-red-100", label: "Failed" },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/cases/${caseId}`}>
                        <Button variant="ghost" size="sm">
                            <Icons.chevronLeft className="mr-1 size-4" />
                            Case {caseNumber}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Documents</h1>
                        <p className="text-muted-foreground">
                            {documents.length} файлов в деле
                        </p>
                    </div>
                </div>

                {/* Privacy Mirror Toggle */}
                <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors",
                    isPrivate
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-zinc-200"
                )}>
                    <div className={cn(
                        "p-2 rounded-xl",
                        isPrivate ? "bg-blue-100" : "bg-zinc-100"
                    )}>
                        <Icons.eye className={cn(
                            "h-4 w-4",
                            isPrivate ? "text-blue-600" : "text-zinc-500"
                        )} />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Privacy Mirror</p>
                        <p className="text-xs text-zinc-500">
                            {isPrivate ? "PII скрыты" : "Реальные данные"}
                        </p>
                    </div>
                    <Switch
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                    />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                <Link href={`/cases/${caseId}`}>
                    <Button variant="ghost" size="sm" className="px-4">Overview</Button>
                </Link>
                <Link href={`/cases/${caseId}/calculation`}>
                    <Button variant="ghost" size="sm" className="px-4">Calculation</Button>
                </Link>
                <Link href={`/cases/${caseId}/documents`}>
                    <Button variant="secondary" size="sm" className="px-4">Documents</Button>
                </Link>
                <Link href={`/cases/${caseId}/meetings`}>
                    <Button variant="ghost" size="sm" className="px-4">Meetings</Button>
                </Link>
                <Link href={`/cases/${caseId}/report`}>
                    <Button variant="ghost" size="sm" className="px-4">Report</Button>
                </Link>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Document List */}
                <div className="col-span-4 space-y-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Файлы ({documents.length})</h3>
                        <Button size="sm">
                            <Icons.upload className="h-4 w-4 mr-2" />
                            Upload
                        </Button>
                    </div>

                    {documents.map((doc) => {
                        const status = statusConfig[doc.ocrStatus];
                        const isSelected = selectedDoc?.id === doc.id;

                        return (
                            <button
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border transition-all",
                                    isSelected
                                        ? "bg-zinc-900 text-white border-zinc-900"
                                        : "bg-white border-zinc-200 hover:border-zinc-300"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg mt-0.5",
                                        isSelected ? "bg-white/10" : "bg-zinc-100"
                                    )}>
                                        <Icons.fileText className={cn(
                                            "h-5 w-5",
                                            isSelected ? "text-white" : "text-zinc-500"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {isPrivate ? `[DOC_${doc.id.slice(-4)}]` : doc.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-xs",
                                                    isSelected ? "bg-white/20 text-white" : status.color
                                                )}
                                            >
                                                {status.icon} {status.label}
                                            </Badge>
                                            <span className={cn(
                                                "text-xs",
                                                isSelected ? "text-white/60" : "text-zinc-400"
                                            )}>
                                                {Math.round(doc.fileSize / 1024)} KB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {documents.length === 0 && (
                        <div className="text-center py-12 text-zinc-400">
                            <Icons.folder className="h-12 w-12 mx-auto mb-3" />
                            <p>Нет загруженных документов</p>
                        </div>
                    )}
                </div>

                {/* Document Preview */}
                <div className="col-span-8 space-y-4">
                    {selectedDoc ? (
                        <>
                            {/* Preview Card */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            {isPrivate ? `[DOC_${selectedDoc.id.slice(-4)}]` : selectedDoc.name}
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Badge className={statusConfig[selectedDoc.ocrStatus].color}>
                                                {statusConfig[selectedDoc.ocrStatus].label}
                                            </Badge>
                                            {selectedDoc.fileUrl && (
                                                <a
                                                    href={selectedDoc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button size="sm" variant="outline">
                                                        <Icons.arrowUpRight className="h-4 w-4 mr-1" />
                                                        Open
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video bg-zinc-100 rounded-xl flex items-center justify-center">
                                        {selectedDoc.mimeType?.startsWith("image/") ? (
                                            <img
                                                src={selectedDoc.fileUrl}
                                                alt={selectedDoc.name}
                                                className="max-h-full rounded-lg"
                                            />
                                        ) : selectedDoc.mimeType === "application/pdf" ? (
                                            <iframe
                                                src={selectedDoc.fileUrl}
                                                className="w-full h-full rounded-lg"
                                                title={selectedDoc.name}
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <Icons.fileText className="h-16 w-16 text-zinc-300 mx-auto mb-3" />
                                                <p className="text-zinc-500">Preview not available</p>
                                                <p className="text-sm text-zinc-400">{selectedDoc.mimeType}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Extracted Data Card */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Icons.sparkles className="h-4 w-4 text-blue-500" />
                                        Извлечённые данные
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedAnchors.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedAnchors.map((anchor, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {anchor.source.toUpperCase()}
                                                        </Badge>
                                                        <span className="text-sm font-medium">
                                                            {anchor.field}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "font-mono text-sm px-2 py-1 rounded",
                                                        isPrivate && anchor.maskedValue !== anchor.value
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-zinc-100 text-zinc-700"
                                                    )}>
                                                        {isPrivate ? anchor.maskedValue : anchor.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-zinc-400">
                                            <p className="text-sm">
                                                {selectedDoc.ocrStatus === "DONE"
                                                    ? "Нет извлечённых данных из этого документа"
                                                    : "OCR ещё не выполнен для этого документа"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* OCR Text (if available) */}
                            {selectedDoc.extractedText && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">OCR Текст</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-zinc-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                                            <pre className="text-sm text-zinc-600 whitespace-pre-wrap font-mono">
                                                {isPrivate
                                                    ? selectedDoc.extractedText
                                                        .replace(/\b\d{8}\b/g, "[CIVIL_ID]")
                                                        .replace(/\b\d{1,3}(?:,\d{3})*\.\d{3}\b/g, "[AMOUNT]")
                                                    : selectedDoc.extractedText
                                                }
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-96 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <div className="text-center">
                                <Icons.fileText className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                                <p className="text-zinc-500">Выберите документ для просмотра</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
