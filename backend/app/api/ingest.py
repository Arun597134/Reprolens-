import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import Project, Session as SessionModel, Event as EventModel, BugReport
from app.schemas.dtos import SessionIngestRequest
from app.services.ownership_detector import select_target_project
from app.services.sanitization import sanitizer

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.post("", status_code=status.HTTP_201_CREATED)
def ingest_session_data(payload: SessionIngestRequest, db: Session = Depends(get_db)):
    """
    Ingestion endpoint for ReproLens Chrome Extension and Web SDK.
    Runs domain/SDK ownership auto-routing, server-side privacy sanitization,
    records session telemetry, and automatically registers bug reports for detected failures.
    """
    # 1. Validate Project API key (with graceful auto-route fallback)
    default_project = db.query(Project).filter(Project.api_key == payload.api_key).first()
    if not default_project:
        # Graceful fallback: match by domain URL or default to first project
        all_projs = db.query(Project).all()
        for p in all_projs:
            if p.website_url and payload.url and (p.website_url.replace("https://", "").replace("http://", "").split("/")[0] in payload.url):
                default_project = p
                break
        if not default_project:
            default_project = db.query(Project).first()

    # 1b. Smart Auto-Routing: match Own Project domains or isolate External Active Websites
    all_projects = db.query(Project).all()
    project, ownership = select_target_project(
        default_project=default_project,
        all_projects=all_projects,
        payload_url=payload.url,
        source=payload.source or "extension",
    )

    if ownership["ownership"] == "external_app" and (project.redaction_config or {}).get("project_mode") != "external_monitor":
        ext_project = Project(
            name="External & Active Apps",
            website_url="https://external-apps.monitor",
            api_key=f"rpl_{secrets.token_hex(16)}",
            redaction_config={
                "project_mode": "external_monitor",
                "mask_all_inputs": True,
                "filter_query_params": True,
                "auto_created": True,
            },
        )
        db.add(ext_project)
        db.commit()
        db.refresh(ext_project)
        project = ext_project

    # 2. Get or create session
    session = db.query(SessionModel).filter(SessionModel.session_token == payload.session_token).first()
    if not session:
        session = SessionModel(
            project_id=project.id,
            session_token=payload.session_token,
            user_agent=payload.user_agent,
            browser_name=payload.browser_name,
            os_name=payload.os_name,
            viewport_w=payload.viewport_w,
            viewport_h=payload.viewport_h,
            device_pixel_ratio=payload.device_pixel_ratio,
            url=payload.url,
            duration_ms=payload.duration_ms,
            status="active"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    else:
        session.duration_ms = max(session.duration_ms, payload.duration_ms)
        session.url = payload.url or session.url

    # 3. Process and sanitize events
    new_events = []
    detected_errors = []

    for item in payload.events:
        # Defense-in-depth: Server-side privacy sanitization
        sanitized_payload = sanitizer.sanitize_data(item.payload)

        event = EventModel(
            session_id=session.id,
            timestamp_offset_ms=item.timestamp_offset_ms,
            event_type=item.event_type,
            payload=sanitized_payload,
            is_sanitized=True
        )
        new_events.append(event)

        # Detect error & silent UX freeze conditions
        if item.event_type in ("js_exception", "console_error", "rage_click", "dead_click"):
            if item.event_type == "rage_click" and "error_type" not in sanitized_payload:
                sanitized_payload["error_type"] = "RageClickAnomaly"
            elif item.event_type == "dead_click" and "error_type" not in sanitized_payload:
                sanitized_payload["error_type"] = "SilentUXFreeze"
            detected_errors.append(sanitized_payload)
        elif item.event_type == "network_request":
            status_code = sanitized_payload.get("status", 200)
            if status_code >= 500 or status_code == 0:
                detected_errors.append(sanitized_payload)

    if new_events:
        db.bulk_save_objects(new_events)

    # 4. Update session error count and auto-create BugReport if fatal failure detected
    if detected_errors:
        session.error_count += len(detected_errors)
        session.status = "error"

        # Check if bug report already registered for this session
        existing_bug = db.query(BugReport).filter(BugReport.session_id == session.id).first()
        if not existing_bug:
            primary_err = detected_errors[0]
            err_msg = primary_err.get("message") or primary_err.get("error") or "Unhandled Application Failure"
            err_type = primary_err.get("error_type") or ("NetworkError" if primary_err.get("status") else "JavaScriptError")
            stack = primary_err.get("stack") or ""

            bug = BugReport(
                project_id=project.id,
                session_id=session.id,
                title=f"{err_type}: {err_msg[:80]}",
                severity="critical" if "TypeError" in err_msg or primary_err.get("status", 0) >= 500 else "high",
                error_message=err_msg,
                error_type=err_type,
                stack_trace=stack,
                url=session.url,
                component_context=(
                    primary_err.get("component")
                    or primary_err.get("semantic_summary")
                    or primary_err.get("entity_author")
                    or primary_err.get("selector", "")
                )
            )
            db.add(bug)
            db.flush()
            try:
                from app.services.alert_dispatcher import dispatch_bug_alerts
                dispatch_bug_alerts({
                    "id": bug.id,
                    "title": bug.title,
                    "error_type": bug.error_type,
                    "severity": bug.severity,
                    "error_message": bug.error_message,
                    "url": bug.url,
                }, db)
            except Exception:
                pass

    db.commit()

    return {
        "status": "success",
        "session_id": session.id,
        "events_ingested": len(new_events),
        "errors_detected": len(detected_errors)
    }
