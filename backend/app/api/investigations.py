from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import BugReport, Session as SessionModel, Event as EventModel, Investigation, SystemSetting
from app.schemas.dtos import InvestigationTriggerRequest, InvestigationResponse
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
    api_key = None
    if payload.use_external_llm:
        provider = payload.ai_provider or "gemini"
        key_setting = db.query(SystemSetting).filter(SystemSetting.key == f"{provider.upper()}_API_KEY").first()
        if key_setting and key_setting.value:
            api_key = key_setting.value

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
        api_key=api_key
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
