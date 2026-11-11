import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    api_key = Column(String(64), unique=True, nullable=False, index=True)
    website_url = Column(String(255), nullable=False)
    redaction_config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("Session", back_populates="project", cascade="all, delete-orphan")
    bugs = relationship("BugReport", back_populates="project", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    session_token = Column(String(64), index=True, nullable=False)
    user_agent = Column(Text, default="")
    browser_name = Column(String(50), default="Chrome")
    os_name = Column(String(50), default="Windows")
    viewport_w = Column(Integer, default=1920)
    viewport_h = Column(Integer, default=1080)
    device_pixel_ratio = Column(Float, default=1.0)
    url = Column(String(500), default="")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    status = Column(String(20), default="active") # active, completed, error

    project = relationship("Project", back_populates="sessions")
    events = relationship("Event", back_populates="session", cascade="all, delete-orphan", order_by="Event.timestamp_offset_ms")
    bugs = relationship("BugReport", back_populates="session", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False, index=True)
    timestamp_offset_ms = Column(Integer, nullable=False, default=0)
    event_type = Column(String(50), nullable=False, index=True) # click, input, navigation, network_request, console_error, js_exception, dom_snapshot
    payload = Column(JSON, nullable=False)
    is_sanitized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="events")

class BugReport(Base):
    __tablename__ = "bug_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(30), default="open") # open, investigating, reproduced, regression_ready, resolved, closed
    severity = Column(String(20), default="high") # critical, high, medium, low
    error_message = Column(Text, default="")
    error_type = Column(String(100), default="JavaScriptError")
    stack_trace = Column(Text, default="")
    url = Column(String(500), default="")
    component_context = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="bugs")
    session = relationship("Session", back_populates="bugs")
    investigations = relationship("Investigation", back_populates="bug", cascade="all, delete-orphan")
    reproductions = relationship("Reproduction", back_populates="bug", cascade="all, delete-orphan")
    regression_tests = relationship("RegressionTest", back_populates="bug", cascade="all, delete-orphan")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bug_id = Column(String(36), ForeignKey("bug_reports.id"), nullable=False, index=True)
    status = Column(String(30), default="completed") # pending, completed, failed
    summary = Column(Text, default="")
    root_cause_analysis = Column(Text, default="")
    observed_facts = Column(JSON, default=list) # List of strictly observed event statements
    inferred_explanations = Column(JSON, default=list) # List of logical causal inferences
    unverified_hypotheses = Column(JSON, default=list) # List of unproven hypotheses
    confidence_score = Column(Float, default=0.0) # 0.0 - 1.0 calibrated confidence
    fix_recommendations = Column(JSON, default=list) # Suggested code diffs or mitigation steps
    evidence = Column(JSON, default=dict) # Referenced logs, failed network requests, DOM nodes
    ai_model_used = Column(String(50), default="ReproLens-Analyzer-v1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bug = relationship("BugReport", back_populates="investigations")

class Reproduction(Base):
    __tablename__ = "reproductions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bug_id = Column(String(36), ForeignKey("bug_reports.id"), nullable=False, index=True)
    status = Column(String(30), default="pending") # pending, running, reproduced, inconclusive, not_reproduced, failed
    reproduction_steps = Column(JSON, default=list)
    environment_config = Column(JSON, default=dict) # Viewport, user-agent, route, network latency
    screenshot_url = Column(String(255), nullable=True)
    execution_logs = Column(Text, default="")
    duration_ms = Column(Integer, default=0)
    exit_code = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bug = relationship("BugReport", back_populates="reproductions")

class RegressionTest(Base):
    __tablename__ = "regression_tests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bug_id = Column(String(36), ForeignKey("bug_reports.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    test_code = Column(Text, nullable=False) # Playwright TypeScript/JavaScript test code
    framework = Column(String(30), default="playwright")
    status = Column(String(30), default="draft") # draft, approved, passing, failing
    last_run_at = Column(DateTime, nullable=True)
    execution_result = Column(JSON, default=dict) # exit code, stdout, stderr, run time
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bug = relationship("BugReport", back_populates="regression_tests")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), default="")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
