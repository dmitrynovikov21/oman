import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { constructMetadata } from "@/lib/utils";
import { DocumentsPageClient } from "./documents-client";

export async function generateMetadata({ params }: { params: { id: string } }) {
    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        select: { caseNumber: true }
    });

    if (!caseData) return constructMetadata({ title: "Case Not Found" });

    return constructMetadata({
        title: `Documents - Case ${caseData.caseNumber}`,
        description: "Case documents with Privacy Mirror and extracted data",
    });
}

export default async function CaseDocumentsPage({
    params
}: {
    params: { id: string }
}) {
    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        include: {
            documents: {
                orderBy: { createdAt: 'desc' }
            },
        }
    });

    if (!caseData) {
        notFound();
    }

    // Transform documents for client component
    const documents = caseData.documents.map(doc => ({
        id: doc.id,
        name: doc.name || doc.originalName || "Unnamed",
        type: doc.type || "OTHER",
        fileUrl: doc.filePath ? `/${doc.filePath}` : "",
        mimeType: doc.mimeType || "",
        ocrStatus: (doc.ocrStatus || "PENDING") as "PENDING" | "PROCESSING" | "DONE" | "FAILED",
        extractedText: doc.extractedText || "",
        createdAt: doc.createdAt.toISOString(),
        fileSize: doc.fileSize || 0,
    }));

    return (
        <DocumentsPageClient
            caseId={params.id}
            caseNumber={caseData.caseNumber}
            documents={documents}
        />
    );
}
