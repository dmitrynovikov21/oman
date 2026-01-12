"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface DocumentViewerProps {
    document: {
        id: string;
        name: string;
        type: string;
        url?: string;
    };
    onClose: () => void;
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
    const [zoom, setZoom] = useState(100);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages] = useState(5); // Mock total pages

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-background/95 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <Icons.chevronLeft className="size-4 mr-1" />
                        Back
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <p className="font-medium text-sm">{document.name}</p>
                        <p className="text-xs text-muted-foreground">{document.type}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setZoom(Math.max(50, zoom - 25))}
                        >
                            <span className="text-lg">-</span>
                        </Button>
                        <span className="text-sm w-12 text-center">{zoom}%</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setZoom(Math.min(200, zoom + 25))}
                        >
                            <span className="text-lg">+</span>
                        </Button>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            <Icons.chevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm w-16 text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <Icons.arrowRight className="size-4" />
                        </Button>
                    </div>

                    {/* Actions */}
                    <Button variant="outline" size="sm">
                        <Icons.copy className="size-4 mr-2" />
                        Copy Text
                    </Button>
                    <Button variant="outline" size="sm">
                        <Icons.arrowUpRight className="size-4 mr-2" />
                        Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <Icons.close className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Document Content */}
            <div className="absolute inset-0 top-14 bottom-14 overflow-auto flex items-center justify-center p-8">
                <div
                    className="bg-white shadow-2xl rounded-lg overflow-hidden"
                    style={{
                        width: `${(8.5 * 96 * zoom) / 100}px`,
                        minHeight: `${(11 * 96 * zoom) / 100}px`,
                    }}
                >
                    {/* Mock PDF Content */}
                    <div className="p-8 text-gray-800">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">بسم الله الرحمن الرحيم</h2>
                            <p className="text-lg font-semibold">محكمة العمل الابتدائية - مسقط</p>
                            <p className="text-sm text-gray-600">Primary Labor Court - Muscat</p>
                        </div>

                        <div className="border-t border-b py-4 my-4 text-center">
                            <p className="text-lg font-bold">تقرير الخبير الحسابي</p>
                            <p className="text-sm">Expert Accountant Report</p>
                            <p className="text-sm mt-2">Case No: 1409/2024</p>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="font-semibold">المدعي (Plaintiff):</p>
                                <p>أحمد سالم البدوي - Ahmed Salem Al-Badawi</p>
                            </div>
                            <div>
                                <p className="font-semibold">المدعى عليه (Defendant):</p>
                                <p>شركة الخليج للمقاولات ذ.م.م - Gulf Construction LLC</p>
                            </div>
                            <div className="pt-4">
                                <p className="font-semibold">ملخص النتائج (Summary of Findings):</p>
                                <p className="mt-2 leading-relaxed">
                                    Based on the documents reviewed and calculations performed in accordance
                                    with Oman Labor Law, the expert has determined the following entitlements...
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-xs text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-background/95 border-t flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                        OCR Status: <span className="text-green-600 font-medium">Processed</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Extracted: <span className="font-medium">2,450 characters</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Icons.fileText className="size-4 mr-2" />
                        View OCR Text
                    </Button>
                    <Button size="sm">
                        <Icons.add className="size-4 mr-2" />
                        Extract to Case
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Thumbnail component for document grid
export function DocumentThumbnail({
    document,
    onClick,
}: {
    document: { id: string; name: string; type: string; size: string };
    onClick: () => void;
}) {
    const typeColors: Record<string, string> = {
        MANDATE: "bg-purple-100 text-purple-700 border-purple-200",
        CONTRACT: "bg-blue-100 text-blue-700 border-blue-200",
        EVIDENCE: "bg-amber-100 text-amber-700 border-amber-200",
        REPORT: "bg-green-100 text-green-700 border-green-200",
    };

    return (
        <div
            onClick={onClick}
            className="group relative p-4 rounded-lg border bg-card hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer"
        >
            {/* Thumbnail Preview */}
            <div className="aspect-[3/4] bg-muted rounded mb-3 flex items-center justify-center overflow-hidden">
                <Icons.fileText className="size-12 text-muted-foreground/50 group-hover:scale-110 transition-transform" />
            </div>

            {/* Document Info */}
            <div>
                <p className="font-medium text-sm truncate">{document.name}</p>
                <div className="flex items-center justify-between mt-1">
                    <span
                        className={`text-xs px-2 py-0.5 rounded border ${typeColors[document.type] || "bg-gray-100 text-gray-700"
                            }`}
                    >
                        {document.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{document.size}</span>
                </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="secondary">
                    <Icons.arrowUpRight className="size-4 mr-2" />
                    View
                </Button>
            </div>
        </div>
    );
}
