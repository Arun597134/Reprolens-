from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import BugReport, Session as SessionModel, Event as EventModel, RegressionTest
from app.schemas.dtos import (
    RegressionTestGenerateRequest, RegressionTestRunRequest, RegressionTestResponse
)
from app.services.test_generator import test_generator

router = APIRouter(prefix="/regression-tests", tags=["Regression Tests"])

@router.get("/bug/{bug_id}", response_model=list[RegressionTestResponse])
def get_tests_for_bug(bug_id: str, db: Session = Depends(get_db)):
    return db.query(RegressionTest).filter(RegressionTest.bug_id == bug_id).order_by(RegressionTest.created_at.desc()).all()

@router.post("/generate", response_model=RegressionTestResponse)
def generate_regression_test(payload: RegressionTestGenerateRequest, db: Session = Depends(get_db)):
    bug = db.query(BugReport).filter(BugReport.id == payload.bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")

    session_meta = {}
    events_data = []

    if bug.session_id:
        sess = db.query(SessionModel).filter(SessionModel.id == bug.session_id).first()
        if sess:
            session_meta = {"url": sess.url}
        evts = db.query(EventModel).filter(EventModel.session_id == bug.session_id).order_by(EventModel.timestamp_offset_ms.asc()).all()
        events_data = [{"event_type": e.event_type, "payload": e.payload} for e in evts]

    gen_data = test_generator.generate_playwright_test(
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_message": bug.error_message,
            "url": bug.url
        },
        session_events=events_data,
        session_meta=session_meta
    )

    test_obj = RegressionTest(
        bug_id=bug.id,
        title=gen_data["title"],
        test_code=gen_data["test_code"],
        framework="playwright",
        status="draft"
    )

    db.add(test_obj)
    if bug.status in ("open", "investigating", "reproduced"):
        bug.status = "regression_ready"
    db.commit()
    db.refresh(test_obj)

    return test_obj

@router.post("/run", response_model=RegressionTestResponse)
async def run_regression_test(payload: RegressionTestRunRequest, db: Session = Depends(get_db)):
    test_obj = db.query(RegressionTest).filter(RegressionTest.id == payload.test_id).first()
    if not test_obj:
        raise HTTPException(status_code=404, detail="Regression test not found")

    # Run Playwright test
    target_url = "http://localhost:3000"
    result = await test_generator.execute_test(test_obj.test_code, target_url=target_url)

    test_obj.status = "passing" if result["status"] == "passing" else "failing"
    test_obj.execution_result = result
    test_obj.last_run_at = db.query(RegressionTest).filter(RegressionTest.id == test_obj.id).first().created_at

    db.commit()
    db.refresh(test_obj)

    return test_obj

@router.post("/{test_id}/approve", response_model=RegressionTestResponse)
def approve_regression_test(test_id: str, db: Session = Depends(get_db)):
    test_obj = db.query(RegressionTest).filter(RegressionTest.id == test_id).first()
    if not test_obj:
        raise HTTPException(status_code=404, detail="Regression test not found")
    test_obj.status = "approved"
    db.commit()
    db.refresh(test_obj)
    return test_obj

@router.get("/{test_id}/ci-workflow", response_class=PlainTextResponse)
def get_ci_workflow(test_id: str, db: Session = Depends(get_db)):
    test_obj = db.query(RegressionTest).filter(RegressionTest.id == test_id).first()
    if not test_obj:
        raise HTTPException(status_code=404, detail="Regression test not found")
    return test_generator.generate_ci_workflow(f"reprolens-{test_obj.id[:8]}.spec.ts")
