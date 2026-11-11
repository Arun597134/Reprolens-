from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import BugReport, Session as SessionModel, Event as EventModel, Reproduction
from app.schemas.dtos import ReproductionTriggerRequest, ReproductionResponse
from app.services.reproduction_engine import reproduction_engine

router = APIRouter(prefix="/reproductions", tags=["Browser Reproduction"])

@router.get("/bug/{bug_id}", response_model=list[ReproductionResponse])
def get_reproductions_for_bug(bug_id: str, db: Session = Depends(get_db)):
    return db.query(Reproduction).filter(Reproduction.bug_id == bug_id).order_by(Reproduction.created_at.desc()).all()

@router.post("/trigger", response_model=ReproductionResponse)
async def trigger_reproduction(payload: ReproductionTriggerRequest, db: Session = Depends(get_db)):
    bug = db.query(BugReport).filter(BugReport.id == payload.bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")

    session_meta = {}
    events_data = []

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

    # Run Playwright reproduction
    result = await reproduction_engine.reproduce(
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_message": bug.error_message,
            "url": bug.url
        },
        session_meta=session_meta,
        session_events=events_data,
        target_base_url=payload.target_url,
        simulate_network=payload.simulate_network,
        mock_failed_requests=payload.mock_failed_requests
    )

    reproduction = Reproduction(
        bug_id=bug.id,
        status=result["status"],
        reproduction_steps=result["reproduction_steps"],
        environment_config=result["environment_config"],
        screenshot_url=result.get("screenshot_url"),
        execution_logs=result.get("execution_logs", ""),
        duration_ms=result.get("duration_ms", 0),
        exit_code=result.get("exit_code", 0)
    )

    db.add(reproduction)
    if result["status"] == "reproduced":
        bug.status = "reproduced"
    db.commit()
    db.refresh(reproduction)

    return reproduction
