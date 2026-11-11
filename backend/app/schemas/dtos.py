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
    events: list[EventIngestItem] = Field(default_factory=list)

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    website_url: str
    redaction_config: Optional[dict[str, Any]] = None

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
