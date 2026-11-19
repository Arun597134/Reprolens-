import {
  PlatformStats, Project, SessionSummary, SessionDetail,
  BugReport, Investigation, Reproduction, RegressionTest, SystemSettings, VisionAuditResult,
  GitHubRepoFilesResponse, GitHubPatchPreview, GitHubPRRecord, GitHubDiscoveredRepo, CIWorkflowSpecResponse,
  PerformanceRadarData, AutoShieldData
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
  createProject: (data: { name: string; website_url: string; redaction_config?: Record<string, any> }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: { name?: string; website_url?: string; project_mode?: 'own_repo' | 'external_monitor'; github_repo?: string; github_branch?: string }) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
  getPerformanceRadar: (id: string) => request<PerformanceRadarData>(`/bugs/${id}/performance-radar`),
  updateBug: (id: string, data: Partial<BugReport>) =>
    request<BugReport>(`/bugs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Investigations
  getInvestigation: (bugId: string) => request<Investigation>(`/investigations/bug/${bugId}`),
  triggerInvestigation: (data: { bug_id: string; use_external_llm?: boolean; ai_provider?: string }) =>
    request<Investigation>('/investigations/trigger', { method: 'POST', body: JSON.stringify(data) }),
  runVisionAudit: (data: { bug_id: string; reproduction_id?: string }) =>
    request<{ bug_id: string; investigation_id: string; vision_audit: VisionAuditResult }>('/investigations/vision-audit', { method: 'POST', body: JSON.stringify(data) }),

  // Reproductions
  getReproductions: (bugId: string) => request<Reproduction[]>(`/reproductions/bug/${bugId}`),
  triggerReproduction: (data: { bug_id: string; target_url?: string; simulate_network?: boolean; mock_failed_requests?: boolean }) =>
    request<Reproduction>('/reproductions/trigger', { method: 'POST', body: JSON.stringify(data) }),
  verifyFixDualReality: (data: { bug_id: string; target_url?: string; simulate_network?: boolean; mock_failed_requests?: boolean; custom_patch_js?: string }) =>
    request<Reproduction>('/reproductions/verify-fix', { method: 'POST', body: JSON.stringify(data) }),
  runChaosMatrix: (data: { bug_id: string; target_url?: string; mock_failed_requests?: boolean }) =>
    request<Reproduction>('/reproductions/chaos-matrix', { method: 'POST', body: JSON.stringify(data) }),

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
  updateSettings: (data: Partial<SystemSettings> & {
    gemini_api_key?: string;
    openai_api_key?: string;
    github_token?: string;
    default_github_repo?: string;
    default_github_branch?: string;
    slack_webhook_url?: string;
    discord_webhook_url?: string;
  }) => request<{ status: string }>('/settings', { method: 'POST', body: JSON.stringify(data) }),

  // Alert Notifications & Webhooks
  testAlertWebhook: (data: { platform: string; webhook_url: string }) =>
    request<{ success: boolean; status_code?: number }>('/alerts/test', { method: 'POST', body: JSON.stringify(data) }),
  getCIWorkflowSpec: () => request<CIWorkflowSpecResponse>('/github/workflow-spec'),

  // GitHub Auto-Fix PR
  discoverGitHubRepos: (username?: string) =>
    request<{ repos: GitHubDiscoveredRepo[]; source?: string }>(
      `/github/discover-repos${username ? `?username=${encodeURIComponent(username)}` : ''}`
    ),
  listGitHubRepoFiles: (data: { bug_id: string; owner_repo?: string; branch?: string }) =>
    request<GitHubRepoFilesResponse>('/github/list-files', { method: 'POST', body: JSON.stringify(data) }),
  previewGitHubPatch: (data: { bug_id: string; owner_repo: string; branch: string; file_path: string }) =>
    request<GitHubPatchPreview>('/github/preview-patch', { method: 'POST', body: JSON.stringify(data) }),
  createGitHubPR: (data: {
    bug_id: string;
    owner_repo: string;
    branch: string;
    file_path: string;
    patched_content: string;
    commit_message?: string;
    pr_title?: string;
    pr_body?: string;
    include_regression_test?: boolean;
  }) => request<GitHubPRRecord>('/github/create-pr', { method: 'POST', body: JSON.stringify(data) }),

  createAutoPullRequest: async (bugId: string): Promise<GitHubPRRecord> => {
    const filesRes = await request<GitHubRepoFilesResponse>('/github/list-files', {
      method: 'POST',
      body: JSON.stringify({ bug_id: bugId })
    });
    const targetFile = filesRes.candidate_files?.[0] || 'src/App.tsx';
    const preview = await request<GitHubPatchPreview>('/github/preview-patch', {
      method: 'POST',
      body: JSON.stringify({
        bug_id: bugId,
        owner_repo: filesRes.owner_repo,
        branch: filesRes.branch,
        file_path: targetFile
      })
    });
    return request<GitHubPRRecord>('/github/create-pr', {
      method: 'POST',
      body: JSON.stringify({
        bug_id: bugId,
        owner_repo: filesRes.owner_repo,
        branch: filesRes.branch,
        file_path: targetFile,
        patched_content: preview.patched_content,
        include_regression_test: true
      })
    });
  },

  // Autonomous Self-Healing Pipeline
  runAutoHeal: (data: { bug_id: string; auto_pr?: boolean; notify?: boolean }) =>
    request<{
      success: boolean;
      bug_id: string;
      total_duration_ms: number;
      stages: Record<string, any>;
      logs: string[];
      pr_url?: string;
      pr_number?: number;
      dual_reality_verdict?: string;
    }>('/auto-heal/run', { method: 'POST', body: JSON.stringify(data) }),

  getAutoHealStatus: (bugId: string) =>
    request<{
      has_run: boolean;
      executed_at?: string;
      total_duration_ms?: number;
      stages?: Record<string, any>;
      logs?: string[];
      pr_url?: string;
    }>(`/auto-heal/status/${bugId}`),

  toggleProjectAutoHeal: (projectId: string, enabled: boolean) =>
    request<{ project_id: string; auto_heal_enabled: boolean }>('/auto-heal/toggle-project', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, enabled })
    }),

  // Autonomous Auto-Shield Runtime Protection
  getAutoShield: (bugId: string) =>
    request<AutoShieldData>(`/bugs/${bugId}/auto-shield`),

  toggleAutoShield: (bugId: string, arm: boolean, ttlHours: number = 24) =>
    request<AutoShieldData>(`/bugs/${bugId}/auto-shield/toggle`, {
      method: 'POST',
      body: JSON.stringify({ arm, ttl_hours: ttlHours })
    }),

  simulateAutoShieldHit: (bugId: string, region: string = 'us-east-1') =>
    request<AutoShieldData>(`/bugs/${bugId}/auto-shield/simulate-hit`, {
      method: 'POST',
      body: JSON.stringify({ visitor_region: region })
    })
};
