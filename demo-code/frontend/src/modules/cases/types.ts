export type CaseStatus = 'New' | 'Processing' | 'Ready';

export type DocumentType = 'pdf' | 'docx' | 'image' | 'audio';

export type DocumentCategory = 'court' | 'plaintiff' | 'defendant' | 'meeting_notes';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  status: 'uploaded' | 'ocr_pending' | 'ocr_done' | 'parsed' | 'processing';
  extractedText?: string;
}

export interface ExtractedData {
  caseNumber: string;
  appointmentDate: string;
  court: string;
  plaintiff: string;
  defendant: string;
  disputeSubject: string;
  expertAssignment: string;
}

export interface AnalysisData {
  summary: string[];
  claims: Array<{
    id: string;
    description: string;
    claimedAmount: string;
    defendantPosition: string;
    conflictLevel: 'aligned' | 'partial' | 'strong';
  }>;
  financialSummary: {
    unpaidSalary: string;
    unusedLeave: string;
    endOfService: string;
  };
}

export interface ReportDraft {
  htmlContent: string; // The raw HTML from AI
  arabicSections?: { id: string; title: string; body: string }[];
}

export interface Case {
  id: string;
  caseNumber: string;
  court: string;
  plaintiff: string;
  defendant: string;
  status: CaseStatus;
  updatedAt: string;
  documents: DocumentItem[];
  
  // These might be empty if coming from backend initially
  extractedData?: ExtractedData;
  analysis?: AnalysisData;
  
  report?: ReportDraft;
  
  // Legacy string notes, can be kept for manual input
  manualMeetingNotes?: string; 
}
