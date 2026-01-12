// Case status workflow definitions

export type CaseStatus = "DRAFT" | "ACTIVE" | "REVIEW" | "SUBMITTED" | "COMPLETED" | "ARCHIVED";

export interface StatusTransition {
    from: CaseStatus;
    to: CaseStatus;
    label: string;
    requiresConfirmation: boolean;
}

// Allowed status transitions
export const STATUS_TRANSITIONS: StatusTransition[] = [
    { from: "DRAFT", to: "ACTIVE", label: "Activate Case", requiresConfirmation: false },
    { from: "ACTIVE", to: "REVIEW", label: "Submit for Review", requiresConfirmation: true },
    { from: "REVIEW", to: "ACTIVE", label: "Return to Active", requiresConfirmation: false },
    { from: "REVIEW", to: "SUBMITTED", label: "Submit to Court", requiresConfirmation: true },
    { from: "SUBMITTED", to: "COMPLETED", label: "Mark Complete", requiresConfirmation: true },
    { from: "COMPLETED", to: "ARCHIVED", label: "Archive Case", requiresConfirmation: true },
];

// Get available transitions for a status
export function getAvailableTransitions(currentStatus: CaseStatus): StatusTransition[] {
    return STATUS_TRANSITIONS.filter((t) => t.from === currentStatus);
}

// Check if transition is valid
export function canTransitionTo(from: CaseStatus, to: CaseStatus): boolean {
    return STATUS_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

// Status metadata
export const STATUS_METADATA: Record<CaseStatus, { label: string; color: string; description: string }> = {
    DRAFT: {
        label: "Draft",
        color: "gray",
        description: "Case is being prepared, not yet active",
    },
    ACTIVE: {
        label: "Active",
        color: "green",
        description: "Case is actively being worked on",
    },
    REVIEW: {
        label: "Under Review",
        color: "yellow",
        description: "Report is ready for internal review",
    },
    SUBMITTED: {
        label: "Submitted",
        color: "blue",
        description: "Report has been submitted to court",
    },
    COMPLETED: {
        label: "Completed",
        color: "purple",
        description: "Case has been concluded",
    },
    ARCHIVED: {
        label: "Archived",
        color: "gray",
        description: "Case has been archived for records",
    },
};

// Document types
export const DOCUMENT_TYPES = {
    MANDATE: { label: "Court Mandate", labelAr: "قرار المحكمة" },
    CONTRACT: { label: "Employment Contract", labelAr: "عقد العمل" },
    PAYSLIP: { label: "Pay Slip", labelAr: "كشف الراتب" },
    EVIDENCE: { label: "Evidence", labelAr: "دليل" },
    CORRESPONDENCE: { label: "Correspondence", labelAr: "مراسلات" },
    REPORT: { label: "Expert Report", labelAr: "تقرير الخبير" },
    ID: { label: "ID Document", labelAr: "وثيقة الهوية" },
};

// Meeting types
export const MEETING_TYPES = {
    INITIAL: { label: "Initial Meeting", labelAr: "الاجتماع الأولي" },
    FOLLOWUP: { label: "Follow-up Meeting", labelAr: "اجتماع متابعة" },
    DOCUMENT_REVIEW: { label: "Document Review", labelAr: "مراجعة الوثائق" },
    FINAL: { label: "Final Meeting", labelAr: "الاجتماع النهائي" },
};
