import {
  Job,
  JobWeights,
  CandidateSummary,
  CandidateDetail,
  DashboardStats,
  AnalyticsData,
  User,
  RecruiterNoteItem,
} from './types';

const TOKEN_KEY = 'tp_auth_token';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.detail) {
        errDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(errDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (full_name: string, email: string, password: string, company: string) =>
    apiFetch<{ access_token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, company }),
    }),

  getMe: () => apiFetch<User>('/api/auth/me'),

  // Dashboard & Demo
  getDashboardStats: () => apiFetch<DashboardStats>('/api/dashboard/stats'),

  resetDemoData: () =>
    apiFetch<{ message: string; primary_job_id: number }>('/api/demo/reset', {
      method: 'POST',
    }),

  // Jobs
  listJobs: () => apiFetch<Job[]>('/api/jobs'),

  getJob: (jobId: number) => apiFetch<Job>(`/api/jobs/${jobId}`),

  extractRequirements: (description: string, title?: string) =>
    apiFetch<{
      title: string;
      department: string;
      location: string;
      min_experience_years: number;
      education_level: string;
      required_skills: string[];
      preferred_skills: string[];
      requirements: {
        category: string;
        requirement_text: string;
        importance_weight: number;
        is_mandatory: boolean;
      }[];
    }>('/api/jobs/extract-requirements', {
      method: 'POST',
      body: JSON.stringify({ description, title: title || '' }),
    }),

  createJob: (payload: {
    title: string;
    department: string;
    location: string;
    min_experience_years: number;
    education_level: string;
    employment_type: string;
    description: string;
    required_skills: string[];
    preferred_skills: string[];
    weights: JobWeights;
  }) =>
    apiFetch<Job>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateJobWeights: (jobId: number, weights: JobWeights) =>
    apiFetch<Job>(`/api/jobs/${jobId}/weights`, {
      method: 'PUT',
      body: JSON.stringify(weights),
    }),

  deleteJob: (jobId: number) =>
    apiFetch<{ message: string }>(`/api/jobs/${jobId}`, {
      method: 'DELETE',
    }),

  // Resume Upload & Demo Loader
  uploadResumes: (jobId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiFetch<{
      job_id: number;
      processed_count: number;
      error_count: number;
      processed_candidates: CandidateSummary[];
      errors: { filename: string; error_code: string; message: string }[];
    }>(`/api/jobs/${jobId}/resumes`, {
      method: 'POST',
      body: formData,
    });
  },

  loadDemoResumesIntoJob: (jobId: number) =>
    apiFetch<{ message: string; added_count: number; skipped_count: number }>(
      `/api/jobs/${jobId}/load-demo-resumes`,
      { method: 'POST' }
    ),

  // Candidates
  getJobCandidates: (
    jobId: number,
    params: {
      search?: string;
      min_score?: number;
      max_score?: number;
      skill?: string;
      min_experience?: number;
      education?: string;
      location?: string;
      certification?: string;
      status_filter?: string;
      recommendation?: string;
      sort_by?: string;
    } = {}
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.set(k, String(v));
      }
    });
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<{
      job: Job;
      total: number;
      candidates: CandidateSummary[];
    }>(`/api/jobs/${jobId}/candidates${queryStr}`);
  },

  getCandidateDetail: (candidateId: number) =>
    apiFetch<CandidateDetail>(`/api/candidates/${candidateId}`),

  addCandidateNote: (
    candidateId: number,
    payload: {
      note_text: string;
      author_name?: string;
      decision_status?: string;
      rating?: number;
    }
  ) =>
    apiFetch<RecruiterNoteItem>(`/api/candidates/${candidateId}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCandidateDecision: (candidateId: number, recruiter_decision: string) =>
    apiFetch<{ candidate_id: number; recruiter_decision: string }>(
      `/api/candidates/${candidateId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ recruiter_decision }),
      }
    ),

  deleteCandidate: (candidateId: number) =>
    apiFetch<{ message: string }>(`/api/candidates/${candidateId}`, {
      method: 'DELETE',
    }),

  // Analytics
  getJobAnalytics: (jobId: number) =>
    apiFetch<AnalyticsData>(`/api/jobs/${jobId}/analytics`),

  // Export URL helper
  getExportUrl: (jobId: number, format: 'csv' | 'excel' | 'pdf') =>
    `/api/jobs/${jobId}/export?format=${format}`,

  getResumeDownloadUrl: (candidateId: number) =>
    `/api/candidates/${candidateId}/resume/download`,
};
