import axios from 'axios';
import type { Case } from './modules/cases/types';

// Use relative path for production (proxied by Nginx)
// For local dev, Vite proxy or CORS handles it.
// If VITE_API_URL is set, use it, otherwise default to /api
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

export const casesApi = {
  async getCases(): Promise<Case[]> {
    const { data } = await api.get('/cases');
    return data;
  },

  async getCase(id: string): Promise<Case> {
    const { data } = await api.get(`/cases/${id}`);
    return data;
  },

  async createCase(kase: Partial<Case>): Promise<Case> {
    const { data } = await api.post('/cases', kase);
    return data;
  },

  async updateCase(id: string, updates: any): Promise<Case> {
    // Map frontend field to backend field if necessary
    const payload = { ...updates };
    if (updates.manualMeetingNotes !== undefined) {
        payload.meetingNotes = updates.manualMeetingNotes;
        delete payload.manualMeetingNotes;
    }
    
    const { data } = await api.patch(`/cases/${id}`, payload);
    return data;
  },

  async uploadDocument(caseId: string, file: File, category: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    await api.post(`/cases/${caseId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async generateReport(caseId: string): Promise<void> {
    await api.post(`/cases/${caseId}/report`);
  },
};
