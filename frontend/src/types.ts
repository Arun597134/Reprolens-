export interface Project {
  id: string;
  name: string;
  api_key: string;
  website_url: string;
  redaction_config: Record<string, any>;
  created_at: string;
}

export interface EventItem {
  id: string;
  session_id: string;
  timestamp_offset_ms: number;
  event_type: 'navigation' | 'click' | 'input' | 'network_request' | 'console_error' | 'js_exception' | 'dom_snapshot' | 'rage_click' | 'dead_click';
  payload: Record<string, any>;
  is_sanitized: boolean;
  created_at: string;
}

export type TelemetryEvent = EventItem;

export interface SessionSummary {
  id: string;
  project_id: string;
  session_token: string;
  user_agent: string;
  browser_name: string;
  os_name: string;
  viewport_w: number;
  viewport_h: number;
  url: string;
  started_at: string;
  duration_ms: number;
  error_count: number;
  status: 'active' | 'completed' | 'error';
}

export interface SessionDetail extends SessionSummary {
  events: EventItem[];
}

export interface BugReport {
  id: string;
  project_id: string;
  session_id?: string;
  title: string;
  status: 'open' | 'investigating' | 'reproduced' | 'regression_ready' | 'resolved' | 'closed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  error_message: string;
  error_type: string;
  stack_trace: string;
  url: string;
  component_context: string;
  created_at: string;
}

export interface FixRecommendation {
  title: string;
  file: string;
  diff: string;
  explanation?: string;
  file_path?: string;
  replacement?: string;
}

export interface Investigation {
  id: string;
  bug_id: string;
  status: string;
  summary: string;
  root_cause_analysis: string;
  observed_facts: string[];
  inferred_explanations: string[];
  unverified_hypotheses: string[];
  confidence_score: number;
  fix_recommendations: FixRecommendation[];
  evidence: Record<string, any>;
  ai_model_used: string;
  created_at: string;
}

export interface ReproductionStep {
  step: string;
  target?: string;
  selector?: string;
  text?: string;
  aria_label?: string;
  data_test_id?: string;
  locator_used?: string;
  x_pct?: number;
  y_pct?: number;
  screenshot_url?: string;
  action_ts_ms?: number;
  status: string;
}

export interface DualRealityPass {
  status: string;
  errors: string[];
  error_count: number;
  screenshot_url?: string;
  duration_ms: number;
  steps: ReproductionStep[];
  execution_logs: string;
}

export interface DualRealityReport {
  verified: boolean;
  verdict: string;
  error_delta: number;
  patch_code: string;
  reality_a: DualRealityPass;
  reality_b: DualRealityPass;
}

export interface VisionAuditAnomaly {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  description: string;
  location_hint?: string;
}

export interface VisionAuditResult {
  visual_verdict: string;
  summary: string;
  ui_anomalies: VisionAuditAnomaly[];
  accessibility_flags: string[];
  confidence_score: number;
  model_used: string;
  screenshot_url?: string;
  screenshot_bytes?: number;
}

export interface ChaosScenarioResult {
  id: string;
  label: string;
  description: string;
  status: string;
  error_count: number;
  errors: string[];
  duration_ms: number;
  screenshot_url?: string;
  failed: boolean;
  execution_logs?: string;
}

export interface ChaosMatrixReport {
  matrix_verdict: string;
  flaky_detected: boolean;
  failing_count: number;
  total_scenarios: number;
  trigger_summary: string;
  scenarios: ChaosScenarioResult[];
}

export interface Reproduction {
  id: string;
  bug_id: string;
  status: 'pending' | 'running' | 'reproduced' | 'inconclusive' | 'not_reproduced' | 'failed';
  reproduction_steps: ReproductionStep[];
  environment_config: {
    viewport_w: number;
    viewport_h: number;
    user_agent: string;
    browser: string;
    simulated_network: boolean;
    mocked_endpoints: string[];
    patch_injected?: boolean;
    dual_reality?: DualRealityReport;
    chaos_matrix?: ChaosMatrixReport;
  };
  screenshot_url?: string;
  execution_logs: string;
  duration_ms: number;
  exit_code: number;
  created_at: string;
}

export interface RegressionTest {
  id: string;
  bug_id: string;
  title: string;
  test_code: string;
  framework: string;
  status: 'draft' | 'approved' | 'passing' | 'failing';
  last_run_at?: string;
  execution_result: {
    status?: string;
    duration_ms?: number;
    stdout?: string;
    errors?: string[];
  };
  created_at: string;
}

export interface PlatformStats {
  total_sessions: number;
  total_errors: number;
  unresolved_bugs: number;
  reproduced_count: number;
  reproduction_success_rate: number;
  regression_tests_passing: number;
  mttr_hours_saved: number;
  recent_bugs: BugReport[];
}

export interface SystemSettings {
  has_gemini_key: boolean;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
  has_github_token?: boolean;
  gemini_api_key?: string;
  openai_api_key?: string;
  anthropic_api_key?: string;
  github_token?: string;
  default_github_repo?: string;
  default_github_branch?: string;
  has_slack_webhook?: boolean;
  has_discord_webhook?: boolean;
  slack_webhook_url?: string;
  discord_webhook_url?: string;
  mask_passwords: boolean;
  mask_emails: boolean;
  mask_credit_cards: boolean;
  filter_query_params: boolean;
  default_reproduction_timeout_s: number;
}

export interface CIWorkflowSpecResponse {
  filename: string;
  yaml_content: string;
}

export interface GitHubRepoFilesResponse {
  owner_repo: string;
  branch: string;
  default_branch: string;
  candidate_files: string[];
  total_blobs: number;
}

export interface GitHubPatchPreview {
  owner_repo: string;
  branch: string;
  file_path: string;
  file_sha: string;
  original_content: string;
  patched_content: string;
  unified_diff: string;
  commit_message: string;
  explanation: string;
  model_used: string;
}

export interface GitHubPRRecord {
  owner_repo: string;
  branch: string;
  base_branch: string;
  pr_number: number;
  pr_url: string;
  commit_sha: string;
  files_changed: string[];
  created_at?: string;
}

export interface GitHubDiscoveredRepo {
  full_name: string;
  name: string;
  default_branch: string;
  homepage: string;
  html_url: string;
  private: boolean;
}

export interface AutoHealStage {
  status: 'pending' | 'in_progress' | 'success' | 'warning' | 'failing' | 'skipped';
  title: string;
  duration_ms?: number;
  summary?: string;
  root_cause?: string;
  verdict?: string;
  crashes_before?: number;
  crashes_after?: number;
  screenshot_url?: string;
  test_id?: string;
  test_status?: string;
  pr_url?: string;
  pr_number?: number;
  target_file?: string;
  channels?: string[];
  reason?: string;
}

export interface AutoHealPipelineResult {
  success: boolean;
  bug_id: string;
  total_duration_ms: number;
  stages: Record<string, AutoHealStage>;
  logs: string[];
  pr_url?: string;
  pr_number?: number;
  dual_reality_verdict?: string;
}

export interface AutoHealStatus {
  has_run: boolean;
  executed_at?: string;
  total_duration_ms?: number;
  stages?: Record<string, AutoHealStage>;
  logs?: string[];
  pr_url?: string;
}

export interface PerformanceMemorySample {
  timestamp_offset_ms: number;
  heap_used_mb: number;
  heap_total_mb: number;
}

export interface PerformanceFPSSample {
  timestamp_offset_ms: number;
  fps: number;
}

export interface PerformanceLongTask {
  timestamp_offset_ms: number;
  duration_ms: number;
  culprit: string;
}

export interface PerformanceRadarData {
  bug_id: string;
  current_heap_mb: number;
  peak_heap_mb: number;
  heap_limit_mb: number;
  memory_leak_risk: 'LOW' | 'MODERATE' | 'CRITICAL';
  leak_velocity_mb_per_min: number;
  avg_fps: number;
  fps_dips_count: number;
  memory_samples: PerformanceMemorySample[];
  fps_samples: PerformanceFPSSample[];
  long_tasks: PerformanceLongTask[];
  ai_diagnostic: string;
}

export interface AutoShieldLogEntry {
  id: string;
  timestamp_iso: string;
  visitor_ip_masked: string;
  route: string;
  action_taken: string;
  mitigation_latency_ms: number;
  status: string;
}

export interface AutoShieldData {
  bug_id: string;
  is_armed: boolean;
  status: 'ARMED' | 'DISARMED' | 'EXPIRED';
  target_component: string;
  target_file: string;
  target_line: number;
  error_signature: string;
  injected_hook_code: string;
  service_worker_code: string;
  edge_middleware_code: string;
  crashes_prevented: number;
  visitors_shielded: number;
  revenue_saved_usd: number;
  latency_overhead_ms: number;
  armed_at?: string;
  expires_at?: string;
  recent_mitigations: AutoShieldLogEntry[];
  ai_immunity_summary: string;
}
