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
  event_type: 'navigation' | 'click' | 'input' | 'network_request' | 'console_error' | 'js_exception' | 'dom_snapshot';
  payload: Record<string, any>;
  is_sanitized: boolean;
  created_at: string;
}

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
  status: string;
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
  mask_passwords: boolean;
  mask_emails: boolean;
  mask_credit_cards: boolean;
  filter_query_params: boolean;
  default_reproduction_timeout_s: number;
}
