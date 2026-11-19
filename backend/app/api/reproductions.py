from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import BugReport, Session as SessionModel, Event as EventModel, Reproduction
from app.schemas.dtos import (
    ChaosMatrixRequest,
    DualRealityVerifyRequest,
    ReproductionResponse,
    ReproductionTriggerRequest,
)
from app.services.reproduction_engine import reproduction_engine

router = APIRouter(prefix="/reproductions", tags=["Browser Reproduction"])


def _load_reproduction_context(bug_id: str, db: Session) -> tuple[BugReport, dict, list[dict]]:
    """Fetch BugReport along with normalized session metadata and ordered events."""
    bug = db.query(BugReport).filter(BugReport.id == bug_id).first()
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
                "url": sess.url,
            }
        evts = (
            db.query(EventModel)
            .filter(EventModel.session_id == bug.session_id)
            .order_by(EventModel.timestamp_offset_ms.asc())
            .all()
        )
        events_data = [
            {
                "timestamp_offset_ms": e.timestamp_offset_ms,
                "event_type": e.event_type,
                "payload": e.payload,
            }
            for e in evts
        ]

    return bug, session_meta, events_data


@router.get("/bug/{bug_id}", response_model=list[ReproductionResponse])
def get_reproductions_for_bug(bug_id: str, db: Session = Depends(get_db)):
    return db.query(Reproduction).filter(Reproduction.bug_id == bug_id).order_by(Reproduction.created_at.desc()).all()


@router.post("/trigger", response_model=ReproductionResponse)
async def trigger_reproduction(payload: ReproductionTriggerRequest, db: Session = Depends(get_db)):
    bug, session_meta, events_data = _load_reproduction_context(payload.bug_id, db)

    result = await reproduction_engine.reproduce(
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_message": bug.error_message,
            "error_type": bug.error_type,
            "url": bug.url or (bug.project.website_url if bug.project else None),
            "project": {"website_url": bug.project.website_url} if bug.project else None,
        },
        session_meta=session_meta,
        session_events=events_data,
        target_base_url=payload.target_url,
        simulate_network=payload.simulate_network,
        mock_failed_requests=payload.mock_failed_requests,
    )

    reproduction = Reproduction(
        bug_id=bug.id,
        status=result["status"],
        reproduction_steps=result["reproduction_steps"],
        environment_config=result["environment_config"],
        screenshot_url=result.get("screenshot_url"),
        execution_logs=result.get("execution_logs", ""),
        duration_ms=result.get("duration_ms", 0),
        exit_code=result.get("exit_code", 0),
    )

    db.add(reproduction)
    if result["status"] == "reproduced":
        bug.status = "reproduced"
    db.commit()
    db.refresh(reproduction)

    return reproduction


def _build_env_config(
    session_meta: dict,
    events_data: list[dict],
    simulate_network: bool,
    extra: dict,
) -> dict:
    mocked_endpoints = [
        e.get("payload", {}).get("url")
        for e in events_data
        if e.get("event_type") == "network_request"
        and (e.get("payload", {}).get("status", 200) >= 400 or e.get("payload", {}).get("status") == 0)
    ]
    return {
        "viewport_w": session_meta.get("viewport_w", 1280),
        "viewport_h": session_meta.get("viewport_h", 800),
        "user_agent": session_meta.get("user_agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
        "browser": "Chromium 125",
        "simulated_network": simulate_network,
        "mocked_endpoints": mocked_endpoints,
        **extra,
    }


@router.post("/verify-fix", response_model=ReproductionResponse)
async def verify_fix_dual_reality(payload: DualRealityVerifyRequest, db: Session = Depends(get_db)):
    """Feature #1 — Run Reality A (unpatched baseline) vs Reality B (runtime patched) proof comparison."""
    bug, session_meta, events_data = _load_reproduction_context(payload.bug_id, db)

    dual = await reproduction_engine.verify_fix_dual_reality(
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_message": bug.error_message,
            "error_type": bug.error_type,
            "url": bug.url or (bug.project.website_url if bug.project else None),
            "project": {"website_url": bug.project.website_url} if bug.project else None,
        },
        session_meta=session_meta,
        session_events=events_data,
        target_base_url=payload.target_url,
        simulate_network=payload.simulate_network,
        mock_failed_requests=payload.mock_failed_requests,
        custom_patch_js=payload.custom_patch_js,
    )

    env_config = _build_env_config(
        session_meta, events_data, payload.simulate_network, {"dual_reality": dual}
    )

    combined_logs = (
        "=== REALITY A (UNPATCHED BASELINE) ===\n"
        + (dual["reality_a"].get("execution_logs") or "")
        + "\n\n=== REALITY B (RUNTIME PATCH INJECTED) ===\n"
        + (dual["reality_b"].get("execution_logs") or "")
    )

    reproduction = Reproduction(
        bug_id=bug.id,
        status=dual["reality_a"]["status"],
        reproduction_steps=dual["reality_a"].get("steps") or dual["reality_b"].get("steps") or [],
        environment_config=env_config,
        screenshot_url=dual["reality_b"].get("screenshot_url") or dual["reality_a"].get("screenshot_url"),
        execution_logs=combined_logs,
        duration_ms=dual["reality_a"].get("duration_ms", 0) + dual["reality_b"].get("duration_ms", 0),
        exit_code=0 if dual["verified"] else 1,
    )

    db.add(reproduction)
    if dual["reality_a"]["status"] == "reproduced" and bug.status == "new":
        bug.status = "reproduced"
    db.commit()
    db.refresh(reproduction)

    return reproduction


@router.post("/chaos-matrix", response_model=ReproductionResponse)
async def run_chaos_matrix_reproduction(payload: ChaosMatrixRequest, db: Session = Depends(get_db)):
    """Counterfactual 4-Reality Race-Condition & Chaos Matrix Reproducer."""
    bug, session_meta, events_data = _load_reproduction_context(payload.bug_id, db)

    matrix = await reproduction_engine.run_chaos_matrix(
        bug_report={
            "id": bug.id,
            "title": bug.title,
            "error_message": bug.error_message,
            "error_type": bug.error_type,
            "url": bug.url or (bug.project.website_url if bug.project else None),
            "project": {"website_url": bug.project.website_url} if bug.project else None,
        },
        session_meta=session_meta,
        session_events=events_data,
        target_base_url=payload.target_url,
        mock_failed_requests=payload.mock_failed_requests,
    )

    scenarios = matrix.get("scenarios", [])
    failing_sc = next((s for s in scenarios if s.get("failed")), None)
    overall_status = "reproduced" if matrix.get("failing_count", 0) > 0 else "inconclusive"
    total_ms = sum(s.get("duration_ms", 0) for s in scenarios)
    combined_logs = "\n\n".join(
        f"=== CHAOS SCENARIO: {s['label'].upper()} ({'FAIL' if s['failed'] else 'PASS'}) ===\n{s.get('execution_logs', '')}"
        for s in scenarios
    )

    env_config = _build_env_config(
        session_meta, events_data, True, {"chaos_matrix": matrix}
    )

    reproduction = Reproduction(
        bug_id=bug.id,
        status=overall_status,
        reproduction_steps=[],
        environment_config=env_config,
        screenshot_url=(failing_sc or (scenarios[0] if scenarios else {})).get("screenshot_url"),
        execution_logs=combined_logs,
        duration_ms=total_ms,
        exit_code=0 if matrix.get("failing_count", 0) > 0 else 1,
    )

    db.add(reproduction)
    if overall_status == "reproduced" and bug.status == "open":
        bug.status = "reproduced"
    db.commit()
    db.refresh(reproduction)

    return reproduction
