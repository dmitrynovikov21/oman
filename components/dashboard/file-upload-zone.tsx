"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";

interface UploadedFile {
    name: string;
    size: number;
    status: "pending" | "uploading" | "ocr" | "done" | "error";
    documentId?: string;
}

interface OcrResult {
    method: string;
    chars?: number;
    pages?: number;
    preview?: string;
    fullText?: string;
    error?: string;
}

interface UploadResult {
    document: any;
    ocr: OcrResult | null;
}

interface FileUploadZoneProps {
    caseId?: string;
    onUploadComplete?: (documents: any[]) => void;
}

export function FileUploadZone({ caseId, onUploadComplete }: FileUploadZoneProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
    const [loadingFullText, setLoadingFullText] = useState<string | null>(null);

    // Use Ref to store actual File objects to avoid re-render issues
    const pendingFilesRef = useRef<File[]>([]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles: File[]) => {
        const validFiles = newFiles.filter(file => {
            const ext = file.name.split(".").pop()?.toLowerCase();
            return ["pdf", "zip", "jpg", "jpeg", "png"].includes(ext || "");
        });

        // Add to ref
        pendingFilesRef.current = [...pendingFilesRef.current, ...validFiles];

        // Add to display state
        setFiles(prev => [
            ...prev,
            ...validFiles.map(f => ({
                name: f.name,
                size: f.size,
                status: "pending" as const,
            })),
        ]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        // Remove from ref
        const current = pendingFilesRef.current;
        if (current[index]) {
            current.splice(index, 1);
            pendingFilesRef.current = [...current]; // Trigger update if needed? No, ref doesn't trigger
        }
    };

    const handleUpload = async () => {
        const pendingFiles = pendingFilesRef.current;

        if (pendingFiles.length === 0) {
            setError("No files to upload");
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResults([]);

        // Update file statuses to uploading
        setFiles(prev => prev.map(f => ({ ...f, status: "uploading" as const })));

        const results: UploadResult[] = [];

        try {
            // If no caseId, create a new case first
            let targetCaseId = caseId;
            if (!targetCaseId) {
                const caseResponse = await fetch("/api/cases", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        caseNumber: `NEW-${Date.now()}`,
                        year: new Date().getFullYear(),
                        status: "RECEIVED",
                    }),
                });

                if (caseResponse.ok) {
                    const caseData = await caseResponse.json();
                    targetCaseId = caseData.case?.id;
                }

                if (!targetCaseId) {
                    throw new Error("Could not create case for documents");
                }
            }

            for (let i = 0; i < pendingFiles.length; i++) {
                const file = pendingFiles[i];

                // Update current file to OCR status if PDF
                if (file.type === "application/pdf") {
                    setFiles(prev => prev.map((f, idx) =>
                        idx === i ? { ...f, status: "ocr" as const } : f
                    ));
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("caseId", targetCaseId);
                formData.append("type", "EVIDENCE");

                const response = await fetch("/api/documents", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Upload failed");
                }

                results.push(data);

                // Update file status
                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? {
                        ...f,
                        status: "done" as const,
                        documentId: data.document?.id,
                    } : f
                ));
            }

            setUploadResults(results);

            // Notify parent
            if (onUploadComplete) {
                onUploadComplete(results.map(r => r.document));
            }

            // Clear pending files
            pendingFilesRef.current = [];

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Upload failed");
            setFiles(prev => prev.map(f => ({ ...f, status: "error" as const })));
        } finally {
            setIsUploading(false);
        }
    };

    const clearAll = () => {
        setFiles([]);
        setUploadResults([]);
        setError(null);
        setEditingDocId(null);
        setEditedTexts({});
        pendingFilesRef.current = [];
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <Card
                className={cn(
                    "border-2 border-dashed transition-colors cursor-pointer rounded-3xl",
                    isDragging
                        ? "border-zinc-400 bg-zinc-100/50"
                        : "border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className={cn(
                        "rounded-full p-4 mb-4 transition-colors",
                        isDragging ? "bg-zinc-200" : "bg-zinc-100"
                    )}>
                        <Icons.upload className={cn(
                            "size-8",
                            isDragging ? "text-zinc-600" : "text-zinc-400"
                        )} />
                    </div>

                    <h3 className="text-lg font-semibold mb-1">
                        {isDragging ? "Drop files here" : "Upload Case Documents"}
                    </h3>

                    <p className="text-sm text-zinc-400 text-center mb-4">
                        Drag and drop PDF files - OCR will extract text automatically
                    </p>

                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Icons.add className="mr-2 size-4" />
                        Select Files
                    </Button>
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".pdf,.zip,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <p className="text-xs text-zinc-400 mt-4">
                        Supported: PDF (with OCR), ZIP, JPEG, PNG (max 50MB)
                    </p>
                </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Selected Files ({files.length})</h4>
                            <Button variant="ghost" size="sm" onClick={clearAll}>
                                Clear All
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icons.fileText className="size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {file.status === "uploading" && (
                                            <span className="flex items-center gap-1 text-xs text-blue-600">
                                                <Icons.spinner className="size-4 animate-spin" />
                                                Uploading...
                                            </span>
                                        )}
                                        {file.status === "ocr" && (
                                            <span className="flex items-center gap-1 text-xs text-purple-600">
                                                <Icons.spinner className="size-4 animate-spin" />
                                                OCR Processing...
                                            </span>
                                        )}
                                        {file.status === "done" && (
                                            <Icons.check className="size-4 text-green-600" />
                                        )}
                                        {file.status === "error" && (
                                            <Icons.warning className="size-4 text-red-600" />
                                        )}
                                        {file.status === "pending" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(index)}
                                            >
                                                <Icons.close className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upload Button */}
                        {files.some(f => f.status === "pending") && (
                            <Button
                                className="w-full mt-4"
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Icons.spinner className="mr-2 size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Icons.upload className="mr-2 size-4" />
                                        Upload & Extract Text ({files.filter(f => f.status === "pending").length} files)
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* OCR Results */}
            {uploadResults.length > 0 && (
                <Card className="border-zinc-200 bg-zinc-50">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <Icons.check className="size-5 text-emerald-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-zinc-900">Upload & OCR Complete</h4>
                                <p className="text-sm text-zinc-600 mb-3">
                                    {uploadResults.length} file(s) processed successfully
                                </p>

                                {/* OCR Summary */}
                                <div className="space-y-2">
                                    {uploadResults.map((result, idx) => (
                                        result.ocr && (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-lg bg-white/80 border border-zinc-200"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-zinc-800">
                                                        {result.document?.name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full",
                                                        result.ocr.method === "easyocr"
                                                            ? "bg-zinc-100 text-zinc-700"
                                                            : result.ocr.method === "pdf-parse"
                                                                ? "bg-zinc-100 text-zinc-600"
                                                                : "bg-zinc-200 text-zinc-500"
                                                    )}>
                                                        {result.ocr.method === "easyocr" && "🔍 OCR"}
                                                        {result.ocr.method === "pdf-parse" && "📄 Text PDF"}
                                                        {result.ocr.method === "failed" && "❌ Failed"}
                                                    </span>
                                                </div>

                                                {result.ocr.chars && (
                                                    <p className="text-xs text-zinc-600 mb-2">
                                                        Extracted: {result.ocr.chars.toLocaleString()} characters
                                                        {result.ocr.pages && ` • ${result.ocr.pages} pages`}
                                                    </p>
                                                )}

                                                {(result.ocr.preview || result.document?.extractedText) && (
                                                    <div className="space-y-2">
                                                        <Button
                                                            variant={editingDocId === result.document?.id ? "default" : "outline"}
                                                            size="sm"
                                                            className="text-xs h-8"
                                                            disabled={loadingFullText === result.document?.id}
                                                            onClick={async () => {
                                                                const docId = result.document?.id;
                                                                if (editingDocId === docId) {
                                                                    setEditingDocId(null);
                                                                } else {
                                                                    // Load full text if not already loaded
                                                                    if (!editedTexts[docId]) {
                                                                        setLoadingFullText(docId);
                                                                        try {
                                                                            const res = await fetch(`/api/ocr?documentId=${docId}`);
                                                                            const data = await res.json();
                                                                            if (data.document?.extractedText) {
                                                                                setEditedTexts(prev => ({
                                                                                    ...prev,
                                                                                    [docId]: data.document.extractedText
                                                                                }));
                                                                            }
                                                                        } finally {
                                                                            setLoadingFullText(null);
                                                                        }
                                                                    }
                                                                    setEditingDocId(docId);
                                                                }
                                                            }}
                                                        >
                                                            {loadingFullText === result.document?.id ? (
                                                                <>
                                                                    <Icons.spinner className="mr-1 size-3 animate-spin" />
                                                                    Loading...
                                                                </>
                                                            ) : editingDocId === result.document?.id ? (
                                                                <>
                                                                    <Icons.check className="mr-1 size-3" />
                                                                    Close Editor
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Icons.fileText className="mr-1 size-3" />
                                                                    View & Edit Full Text
                                                                </>
                                                            )}
                                                        </Button>

                                                        {editingDocId === result.document?.id && (
                                                            <div className="mt-3">
                                                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                                                    Extracted Text (editable) - {(editedTexts[result.document?.id] || '').length.toLocaleString()} chars
                                                                </label>
                                                                <textarea
                                                                    className="w-full h-96 p-4 text-sm border rounded-lg bg-white font-mono resize-y focus:ring-2 focus:ring-primary focus:border-primary"
                                                                    dir="auto"
                                                                    value={editedTexts[result.document?.id] || result.ocr.preview || ''}
                                                                    onChange={(e) => setEditedTexts(prev => ({
                                                                        ...prev,
                                                                        [result.document?.id]: e.target.value
                                                                    }))}
                                                                    placeholder="OCR text will appear here..."
                                                                />
                                                                <div className="flex justify-end gap-2 mt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(editedTexts[result.document?.id] || '');
                                                                        }}
                                                                    >
                                                                        <Icons.copy className="mr-1 size-3" />
                                                                        Copy All
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={async () => {
                                                                            // Save edited text back to database
                                                                            await fetch('/api/ocr', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    documentId: result.document?.id,
                                                                                    extractedText: editedTexts[result.document?.id],
                                                                                }),
                                                                            });
                                                                            setEditingDocId(null);
                                                                        }}
                                                                    >
                                                                        <Icons.check className="mr-1 size-3" />
                                                                        Save Changes
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {result.ocr.error && (
                                                    <p className="text-xs text-red-600">
                                                        {result.ocr.error}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <Card className="border-zinc-300 bg-zinc-50">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <Icons.warning className="size-5 text-zinc-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-zinc-900">Upload Failed</h4>
                                <p className="text-sm text-zinc-600">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
