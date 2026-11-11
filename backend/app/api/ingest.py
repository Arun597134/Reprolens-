from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import Project, Session as SessionModel, Event as EventModel, BugReport
from app.schemas.dtos import SessionIngestRequest
from app.services.sanitization import sanitizer

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.post("", status_code=status.HTTP_201_CREATED)
def ingest_session_data(payload: SessionIngestRequest, db: Session = Depends(get_db)):
    """
    Ingestion endpoint for ReproLens Chrome Extension and Web SDK.
    Runs server-side privacy sanitization on all events, records session,
    and automatically registers bug reports for detected failures.
    """
    # 1. Validate Project API key
    project = db.query(Project).filter(Project.api_key == payload.api_key).first()
    if not project:
        raise HTTPException(status_code=403, detail="Invalid ReproLens project API key")

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

        # Detect error conditions
        if item.event_type in ("js_exception", "console_error"):
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
                component_context=primary_err.get("component") or primary_err.get("selector", "")
            )
            db.add(bug)

    db.commit()

    return {
        "status": "success",
        "session_id": session.id,
        "events_ingested": len(new_events),
        "errors_detected": len(detected_errors)
    }
