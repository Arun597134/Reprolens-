import {
  PlatformStats, Project, SessionSummary, SessionDetail,
  BugReport, Investigation, Reproduction, RegressionTest, SystemSettings
} from './types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => request<PlatformStats>('/stats'),

  // Projects
  getProjects: () => request<Project[]>('/projects'),
  createProject: (data: { name: string; website_url: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request<{ status: string }>(`/projects/${id}`, { method: 'DELETE' }),

  // Sessions
  getSessions: (params?: { has_errors?: boolean; project_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.has_errors !== undefined) query.set('has_errors', String(params.has_errors));
    if (params?.project_id) query.set('project_id', params.project_id);
    return request<SessionSummary[]>(`/sessions?${query.toString()}`);
  },
  getSessionDetail: (id: string) => request<SessionDetail>(`/sessions/${id}`),

  // Bugs
  getBugs: (params?: { status?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    return request<BugReport[]>(`/bugs?${query.toString()}`);
  },
  getBugDetail: (id: string) => request<BugReport>(`/bugs/${id}`),
  updateBug: (id: string, data: Partial<BugReport>) =>
    request<BugReport>(`/bugs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Investigations
  getInvestigation: (bugId: string) => request<Investigation>(`/investigations/bug/${bugId}`),
  triggerInvestigation: (data: { bug_id: string; use_external_llm?: boolean; ai_provider?: string }) =>
    request<Investigation>('/investigations/trigger', { method: 'POST', body: JSON.stringify(data) }),

  // Reproductions
  getReproductions: (bugId: string) => request<Reproduction[]>(`/reproductions/bug/${bugId}`),
  triggerReproduction: (data: { bug_id: string; target_url?: string; simulate_network?: boolean; mock_failed_requests?: boolean }) =>
    request<Reproduction>('/reproductions/trigger', { method: 'POST', body: JSON.stringify(data) }),

  // Regression Tests
  getRegressionTests: (bugId: string) => request<RegressionTest[]>(`/regression-tests/bug/${bugId}`),
  generateRegressionTest: (bugId: string) =>
    request<RegressionTest>('/regression-tests/generate', { method: 'POST', body: JSON.stringify({ bug_id: bugId }) }),
  runRegressionTest: (testId: string) =>
    request<RegressionTest>('/regression-tests/run', { method: 'POST', body: JSON.stringify({ test_id: testId }) }),
  approveRegressionTest: (testId: string) =>
    request<RegressionTest>(`/regression-tests/${testId}/approve`, { method: 'POST' }),
  getCiWorkflow: async (testId: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/regression-tests/${testId}/ci-workflow`);
    return res.text();
  },

  // Settings
  getSettings: () => request<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings> & { gemini_api_key?: string; openai_api_key?: string }) =>
    request<{ status: string }>('/settings', { method: 'POST', body: JSON.stringify(data) })
};
