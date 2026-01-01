import { ref, computed } from 'vue';
import type { Case, DocumentCategory, CaseStatus } from './types';
import { casesApi } from '../../api';

const casesState = ref<Case[]>([]);
const currentCase = ref<Case | null>(null);

export function useCasesStore() {
  const cases = computed(() => casesState.value);

  async function loadCases() {
    try {
      const data = await casesApi.getCases();
      casesState.value = data.map(transformBackendCase);
    } catch (e) {
      console.error('Failed to load cases', e);
    }
  }

  async function loadCase(id: string) {
    try {
      const data = await casesApi.getCase(id);
      currentCase.value = transformBackendCase(data);
      const idx = casesState.value.findIndex(c => c.id === id);
      if (idx !== -1) {
        casesState.value[idx] = currentCase.value;
      }
    } catch (e) {
      console.error('Failed to load case', e);
    }
  }

  async function addCase(newCase: Partial<Case>) {
    try {
      const created = await casesApi.createCase(newCase);
      const transformed = transformBackendCase(created);
      casesState.value = [transformed, ...casesState.value];
    } catch (e) {
      console.error('Failed to create case', e);
    }
  }

  async function addDocument(
    caseId: string,
    file: File,
    category: DocumentCategory
  ) {
    try {
      const categoryMap: Record<DocumentCategory, string> = {
        court: 'COURT_APPOINTMENT',
        plaintiff: 'PLAINTIFF',
        defendant: 'DEFENDANT',
        meeting_notes: 'MEETING_NOTES',
      };

      await casesApi.uploadDocument(caseId, file, categoryMap[category]);
      await loadCase(caseId);
    } catch (e) {
      console.error('Failed to upload document', e);
    }
  }

  async function generateReport(caseId: string) {
     try {
         await casesApi.generateReport(caseId);
         await loadCase(caseId);
     } catch(e) {
         console.error('Failed to generate report', e);
     }
  }

  async function updateMeetingNotes(caseId: string, notes: string) {
    // Optimistic update
    if (currentCase.value && currentCase.value.id === caseId) {
        currentCase.value.manualMeetingNotes = notes;
    }
    const idx = casesState.value.findIndex(c => c.id === caseId);
    if (idx !== -1 && casesState.value[idx]) {
        casesState.value[idx]!.manualMeetingNotes = notes;
    }

    // Send to backend
    try {
        await casesApi.updateCase(caseId, { manualMeetingNotes: notes } as any); 
    } catch (e) {
        console.error('Failed to save meeting notes', e);
    }
  }

  function getCaseById(id: string) {
    return computed(() => {
        if (currentCase.value && currentCase.value.id === id) return currentCase.value;
        return casesState.value.find((c) => c.id === id) ?? null;
    });
  }

  function transformBackendCase(backendData: any): Case {
      let status: CaseStatus = 'New';
      if (backendData.status === 'in_progress') status = 'Processing'; 
      if (backendData.status === 'completed') status = 'Ready';
      
      if (backendData.aiReport) status = 'Ready';

      return {
          id: backendData.id,
          caseNumber: backendData.caseNumber,
          court: backendData.court,
          plaintiff: backendData.plaintiff,
          defendant: backendData.defendant,
          status: status,
          updatedAt: backendData.updatedAt,
          documents: (backendData.documents || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              type: d.mimeType.startsWith('audio') ? 'audio' : 'pdf', 
              category: mapBackendCategory(d.category),
              status: d.status === 'COMPLETED' ? 'parsed' : 'processing',
              extractedText: d.extractedText
          })),
          manualMeetingNotes: backendData.meetingNotes,
          report: backendData.aiReport ? { htmlContent: backendData.aiReport } : undefined,
          extractedData: undefined,
          analysis: undefined
      };
  }

  function mapBackendCategory(cat: string): DocumentCategory {
      switch(cat) {
          case 'COURT_APPOINTMENT': return 'court';
          case 'PLAINTIFF': return 'plaintiff';
          case 'DEFENDANT': return 'defendant';
          case 'MEETING_NOTES': return 'meeting_notes';
          default: return 'court';
      }
  }

  return {
    cases,
    currentCase,
    loadCases,
    loadCase,
    addCase,
    addDocument,
    generateReport,
    updateMeetingNotes,
    getCaseById,
  };
}
