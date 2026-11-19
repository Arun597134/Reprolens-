from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

# Ingestion Schemas
class EventIngestItem(BaseModel):
    timestamp_offset_ms: int = 0
    event_type: str # click, input, navigation, network_request, console_error, js_exception, dom_snapshot
    payload: dict[str, Any] = Field(default_factory=dict)
    is_sanitized: bool = True

class SessionIngestRequest(BaseModel):
    api_key: str
    session_token: str
    user_agent: str = ""
    browser_name: str = "Chrome"
    os_name: str = "Windows"
    viewport_w: int = 1920
    viewport_h: int = 1080
    device_pixel_ratio: float = 1.0
    url: str = ""
    duration_ms: int = 0
    source: str = "extension"
    events: list[EventIngestItem] = Field(default_factory=list)

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    website_url: str
    redaction_config: Optional[dict[str, Any]] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[str] = None
    project_mode: Optional[str] = None  # 'own_repo' | 'external_monitor'
    github_repo: Optional[str] = None
    github_branch: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    api_key: str
    website_url: str
    redaction_config: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Event Schemas
class EventResponse(BaseModel):
    id: str
    session_id: str
    timestamp_offset_ms: int
    event_type: str
    payload: dict[str, Any]
    is_sanitized: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Session Schemas
class SessionSummary(BaseModel):
    id: str
    project_id: str
    session_token: str
    user_agent: str
    browser_name: str
    os_name: str
    viewport_w: int
    viewport_h: int
    url: str
    started_at: datetime
    duration_ms: int
    error_count: int
    status: str

    class Config:
        from_attributes = True

class SessionDetail(SessionSummary):
    events: list[EventResponse] = Field(default_factory=list)

# Bug Report Schemas
class BugReportCreate(BaseModel):
    project_id: str
    session_id: Optional[str] = None
    title: str
    severity: str = "high"
    error_message: str = ""
    error_type: str = "JavaScriptError"
    stack_trace: str = ""
    url: str = ""
    component_context: str = ""

class BugReportUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    title: Optional[str] = None

class BugReportResponse(BaseModel):
    id: str
    project_id: str
    session_id: Optional[str]
    title: str
    status: str
    severity: str
    error_message: str
    error_type: str
    stack_trace: str
    url: str
    component_context: str
    created_at: datetime

    class Config:
        from_attributes = True

# Performance & Memory Radar Schemas
class PerformanceMemorySample(BaseModel):
    timestamp_offset_ms: int
    heap_used_mb: float
    heap_total_mb: float

class PerformanceFPSSample(BaseModel):
    timestamp_offset_ms: int
    fps: float

class PerformanceLongTask(BaseModel):
    timestamp_offset_ms: int
    duration_ms: float
    culprit: str

class PerformanceRadarResponse(BaseModel):
    bug_id: str
    current_heap_mb: float
    peak_heap_mb: float
    heap_limit_mb: float
    memory_leak_risk: str  # "LOW" | "MODERATE" | "CRITICAL"
    leak_velocity_mb_per_min: float
    avg_fps: float
    fps_dips_count: int
    memory_samples: list[PerformanceMemorySample]
    fps_samples: list[PerformanceFPSSample]
    long_tasks: list[PerformanceLongTask]
    ai_diagnostic: str

# Investigation Schemas
class InvestigationTriggerRequest(BaseModel):
    bug_id: str
    use_external_llm: bool = False
    ai_provider: Optional[str] = None # gemini, openai, anthropic, or heuristic

class InvestigationResponse(BaseModel):
    id: str
    bug_id: str
    status: str
    summary: str
    root_cause_analysis: str
    observed_facts: list[str]
    inferred_explanations: list[str]
    unverified_hypotheses: list[str]
    confidence_score: float
    fix_recommendations: list[dict[str, Any]]
    evidence: dict[str, Any]
    ai_model_used: str
    created_at: datetime

    class Config:
        from_attributes = True

# Reproduction Schemas
class ReproductionTriggerRequest(BaseModel):
    bug_id: str
    target_url: Optional[str] = None
    simulate_network: bool = True
    network_latency_ms: int = 150
    mock_failed_requests: bool = True

class DualRealityVerifyRequest(BaseModel):
    bug_id: str
    target_url: Optional[str] = None
    simulate_network: bool = True
    mock_failed_requests: bool = True
    custom_patch_js: Optional[str] = None

class ChaosMatrixRequest(BaseModel):
    bug_id: str
    target_url: Optional[str] = None
    mock_failed_requests: bool = True

class VisionAuditRequest(BaseModel):
    bug_id: str
    reproduction_id: Optional[str] = None

class ReproductionResponse(BaseModel):
    id: str
    bug_id: str
    status: str
    reproduction_steps: list[dict[str, Any]]
    environment_config: dict[str, Any]
    screenshot_url: Optional[str]
    execution_logs: str
    duration_ms: int
    exit_code: int
    created_at: datetime

    class Config:
        from_attributes = True

# Regression Test Schemas
class RegressionTestGenerateRequest(BaseModel):
    bug_id: str

class RegressionTestRunRequest(BaseModel):
    test_id: str

class RegressionTestResponse(BaseModel):
    id: str
    bug_id: str
    title: str
    test_code: str
    framework: str
    status: str
    last_run_at: Optional[datetime]
    execution_result: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Stats & Overview
class PlatformStats(BaseModel):
    total_sessions: int
    total_errors: int
    unresolved_bugs: int
    reproduced_count: int
    reproduction_success_rate: float
    regression_tests_passing: int
    mttr_hours_saved: float
    recent_bugs: list[BugReportResponse]


# GitHub Auto-Fix PR Schemas
class GitHubListFilesRequest(BaseModel):
    bug_id: str
    owner_repo: Optional[str] = None
    branch: Optional[str] = None

class GitHubPreviewPatchRequest(BaseModel):
    bug_id: str
    owner_repo: str
    branch: str = "main"
    file_path: str

class GitHubCreatePRRequest(BaseModel):
    bug_id: str
    owner_repo: str
    branch: str = "main"
    file_path: str
    patched_content: str
    commit_message: Optional[str] = None
    pr_title: Optional[str] = None
    pr_body: Optional[str] = None
    include_regression_test: bool = True

# Auto-Shield Schemas (Autonomous Self-Healing Runtime Protection)
class AutoShieldLogEntry(BaseModel):
    id: str
    timestamp_iso: str
    visitor_ip_masked: str
    route: str
    action_taken: str
    mitigation_latency_ms: float
    status: str

class AutoShieldResponse(BaseModel):
    bug_id: str
    is_armed: bool
    status: str  # "ARMED" | "DISARMED" | "EXPIRED"
    target_component: str
    target_file: str
    target_line: int
    error_signature: str
    injected_hook_code: str
    service_worker_code: str
    edge_middleware_code: str
    crashes_prevented: int
    visitors_shielded: int
    revenue_saved_usd: float
    latency_overhead_ms: float
    armed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    recent_mitigations: list[AutoShieldLogEntry]
    ai_immunity_summary: str

class AutoShieldToggleRequest(BaseModel):
    arm: bool
    ttl_hours: Optional[int] = 24

class AutoShieldSimulateHitRequest(BaseModel):
    visitor_region: Optional[str] = "us-east-1"
