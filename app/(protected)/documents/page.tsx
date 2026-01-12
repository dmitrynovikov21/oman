'use client';

import { DashboardHeader } from "@/components/dashboard/header";
import { DocumentsTabLayout } from "@/components/documents/intelligence-ui";

// Демо-данные для разработки (TODO: заменить на API)
const DEMO_DOCUMENTS = [
    {
        id: "doc1",
        name: "عقد العمل - محمد العماني.pdf",
        category: "CONTRACT" as const,
        status: { ocr: "done" as const, ai_summary: "done" as const, conflict: false },
        pageCount: 4,
        conflictCount: 0,
    },
    {
        id: "doc2",
        name: "كشف راتب بنك مسقط.pdf",
        category: "FINANCIAL" as const,
        status: { ocr: "done" as const, ai_summary: "pending" as const, conflict: false },
        pageCount: 1,
        conflictCount: 0,
    },
    {
        id: "doc3",
        name: "حكم المحكمة الابتدائية.pdf",
        category: "COURT" as const,
        status: { ocr: "done" as const, ai_summary: "done" as const, conflict: true },
        pageCount: 12,
        conflictCount: 2,
    },
    {
        id: "doc4",
        name: "تقرير الخبير المحاسبي.docx",
        category: "EXPERT_WORK" as const,
        status: { ocr: "done" as const, ai_summary: "done" as const, conflict: false },
        pageCount: 8,
        conflictCount: 0,
    },
    {
        id: "doc5",
        name: "شهادة شاهد.pdf",
        category: "PLAINTIFF_EVIDENCE" as const,
        status: { ocr: "pending" as const, ai_summary: "pending" as const, conflict: false },
        pageCount: 2,
        conflictCount: 0,
    },
];

export default function DocumentsPage() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <DashboardHeader
                heading="Документы"
                text="Intelligent Document Hub с авто-классификацией"
            />

            <div className="container py-6">
                <DocumentsTabLayout
                    documents={DEMO_DOCUMENTS}
                    onDocumentClick={(doc) => {
                        console.log("Document clicked:", doc);
                        // TODO: Navigate to document detail
                    }}
                />
            </div>
        </div>
    );
}
