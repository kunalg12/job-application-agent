import axios from 'axios';
import { Job, Application, UserProfile, AppSettings, DashboardMetrics } from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Jobs
  getJobs: async (params?: { search?: string; remote_only?: boolean; min_score?: number }) => {
    const res = await client.get<Job[]>('/jobs', { params });
    return res.data;
  },
  triggerScan: async () => {
    const res = await client.post<{ message: string; status: string }>('/jobs/scan');
    return res.data;
  },
  importJob: async (data: { title: string; company: string; location?: string; description: string; url?: string; recruiter_email?: string }) => {
    const res = await client.post<Job>('/jobs/import', data);
    return res.data;
  },

  // Applications
  getApplications: async () => {
    const res = await client.get<Application[]>('/applications');
    return res.data;
  },
  stageJob: async (jobId: string) => {
    const res = await client.post<Application>(`/applications/stage/${jobId}`);
    return res.data;
  },
  sendEmail: async (appId: string, payload?: { to_email?: string; subject?: string; body?: string }) => {
    const res = await client.post<{ message: string; status: string }>(`/applications/${appId}/email`, payload);
    return res.data;
  },
  autofillApplication: async (appId: string, headless: boolean = false) => {
    const res = await client.post(`/applications/${appId}/autofill?headless=${headless}`);
    return res.data;
  },
  updateApplication: async (appId: string, payload: Partial<Application>) => {
    const res = await client.patch<Application>(`/applications/${appId}`, payload);
    return res.data;
  },

  // Profile
  getProfile: async () => {
    const res = await client.get<UserProfile>('/profile');
    return res.data;
  },
  updateProfile: async (profile: UserProfile) => {
    const res = await client.put<UserProfile>('/profile', profile);
    return res.data;
  },
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post<UserProfile>('/profile/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Settings & Metrics
  getSettings: async () => {
    const res = await client.get<AppSettings>('/settings');
    return res.data;
  },
  updateSettings: async (settings: AppSettings) => {
    const res = await client.put<AppSettings>('/settings', settings);
    return res.data;
  },
  testEmail: async (testRecipient: string) => {
    const res = await client.post<{ message: string; status: string }>('/settings/test-email', {
      test_recipient: testRecipient,
    });
    return res.data;
  },
  getMetrics: async () => {
    const res = await client.get<DashboardMetrics>('/settings/metrics');
    return res.data;
  },
};
