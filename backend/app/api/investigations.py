from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.schema import BugReport, Session as SessionModel, Event as EventModel, Investigation, Reproduction, SystemSetting
from app.schemas.dtos import InvestigationTriggerRequest, InvestigationResponse, VisionAuditRequest
from app.services.ai_investigator import ai_investigator

router = APIRouter(prefix="/investigations", tags=["AI Investigation"])

@router.get("/bug/{bug_id}", response_model=InvestigationResponse)
def get_investigation_for_bug(bug_id: str, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.bug_id == bug_id).order_by(Investigation.created_at.desc()).first()
    if not inv:
        raise HTTPException(status_code=404, detail="No investigation report found for this bug")
    return inv

@router.post("/trigger", response_model=InvestigationResponse)
async def trigger_investigation(payload: InvestigationTriggerRequest, db: Session = Depends(get_db)):
    bug = db.query(BugReport).filter(BugReport.id == payload.bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")

    # Fetch session and events
    events_data = []
    session_meta = {}

    if bug.session_id:
        sess = db.query(SessionModel).filter(SessionModel.id == bug.session_id).first()
        if sess:
            session_meta = {
                "viewport_w": sess.viewport_w,
                "viewport_h": sess.viewport_h,
                "user_agent": sess.user_agent,
                "browser": sess.browser_name,
                "os": sess.os_name,
                "url": sess.url
            }
        evts = db.query(EventModel).filter(EventModel.session_id == bug.session_id).order_by(EventModel.timestamp_offset_ms.asc()).all()
        events_data = [
            {
                "timestamp_offset_ms": e.timestamp_offset_ms,
                "event_type": e.event_type,
                "payload": e.payload
            }
            for e in evts
        ]

    # Check for stored API keys if external LLM requested
    gemini_key = None
    openai_key = None
    if payload.use_external_llm:
        g_setting = db.query(SystemSetting).filter(SystemSetting.key == "GEMINI_API_KEY").first()
        o_setting = db.query(SystemSetting).filter(SystemSetting.key == "OPENAI_API_KEY").first()
        if g_setting and g_setting.value:
            gemini_key = g_setting.value
        if o_setting and o_setting.value:
            openai_key = o_setting.value
        if payload.ai_provider == "openai":
            gemini_key = None

    # Run AI Investigator
    result = ai_investigator.investigate(
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_message": bug.error_message,
            "error_type": bug.error_type,
            "stack_trace": bug.stack_trace,
            "url": bug.url,
            "component_context": bug.component_context
        },
        session_events=events_data,
        session_meta=session_meta,
        use_external_llm=payload.use_external_llm,
        api_key=gemini_key,
        openai_api_key=openai_key,
    )

    # Save to database
    investigation = Investigation(
        bug_id=bug.id,
        status="completed",
        summary=result.get("summary", ""),
        root_cause_analysis=result.get("root_cause_analysis", ""),
        observed_facts=result.get("observed_facts", []),
        inferred_explanations=result.get("inferred_explanations", []),
        unverified_hypotheses=result.get("unverified_hypotheses", []),
        confidence_score=result.get("confidence_score", 0.85),
        fix_recommendations=result.get("fix_recommendations", []),
        evidence=result.get("evidence", {}),
        ai_model_used=result.get("ai_model_used", "ReproLens AI Engine")
    )

    db.add(investigation)
    if bug.status == "open":
        bug.status = "investigating"
    db.commit()
    db.refresh(investigation)

    return investigation


@router.post("/vision-audit")
def run_vision_audit(payload: VisionAuditRequest, db: Session = Depends(get_db)):
    """Correlate a captured reproduction screenshot with DOM error context via Gemini Vision."""
    bug = db.query(BugReport).filter(BugReport.id == payload.bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")

    repro_query = db.query(Reproduction).filter(Reproduction.bug_id == bug.id)
    if payload.reproduction_id:
        repro = repro_query.filter(Reproduction.id == payload.reproduction_id).first()
    else:
        repro = repro_query.order_by(Reproduction.created_at.desc()).first()

    screenshot_rel = repro.screenshot_url if repro else None
    if not screenshot_rel and repro and repro.reproduction_steps:
        for step in reversed(repro.reproduction_steps):
            if step.get("screenshot_url"):
                screenshot_rel = step["screenshot_url"]
                break

    if not screenshot_rel:
        raise HTTPException(
            status_code=400,
            detail="No screenshot available for this bug yet. Run Browser Reproduction first."
        )

    shot_path = Path(settings.SCREENSHOTS_PATH) / Path(screenshot_rel).name
    if not shot_path.exists():
        raise HTTPException(status_code=404, detail=f"Screenshot file missing on disk: {shot_path.name}")

    g_setting = db.query(SystemSetting).filter(SystemSetting.key == "GEMINI_API_KEY").first()
    gemini_key = g_setting.value if (g_setting and g_setting.value) else None

    audit = ai_investigator.audit_screenshot_vision(
        screenshot_path=shot_path,
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_type": bug.error_type,
            "error_message": bug.error_message,
            "url": bug.url,
        },
        api_key=gemini_key,
    )
    audit["screenshot_url"] = screenshot_rel

    inv = db.query(Investigation).filter(Investigation.bug_id == bug.id).order_by(Investigation.created_at.desc()).first()
    if inv:
        inv.evidence = {**(inv.evidence or {}), "vision_audit": audit}
    else:
        inv = Investigation(
            bug_id=bug.id,
            status="completed",
            summary=audit.get("summary", ""),
            root_cause_analysis=audit.get("summary", ""),
            observed_facts=[f"Visual Audit ({audit.get('visual_verdict')}): {audit.get('summary')}"],
            inferred_explanations=[],
            unverified_hypotheses=[],
            confidence_score=audit.get("confidence_score", 0.85),
            fix_recommendations=[],
            evidence={"vision_audit": audit},
            ai_model_used=audit.get("model_used", "Gemini Vision"),
        )
        db.add(inv)
    db.commit()

    return {"bug_id": bug.id, "investigation_id": inv.id, "vision_audit": audit}
