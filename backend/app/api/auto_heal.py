from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schema import BugReport, Investigation, Project
from app.services.auto_heal_pipeline import auto_heal_pipeline

router = APIRouter(prefix="/auto-heal", tags=["Autonomous Self-Healing"])


class AutoHealRunRequest(BaseModel):
    bug_id: str
    auto_pr: bool = False
    notify: bool = False
    app_url: str = "http://localhost:5173"


class ToggleProjectAutoHealRequest(BaseModel):
    project_id: str
    enabled: bool


@router.post("/run")
async def run_auto_heal_pipeline(payload: AutoHealRunRequest, db: Session = Depends(get_db)):
    """
    Triggers the end-to-end Autonomous Self-Healing Pipeline for a captured bug:
    [1. AI Root Cause Analysis] -> [2. Deterministic Dual-Reality B Verification] ->
    [3. Playwright Regression Guard] -> [4. Autonomous GitHub PR] -> [5. Slack/Discord Dispatch]
    """
    try:
        result = await auto_heal_pipeline.run(
            bug_id=payload.bug_id,
            db=db,
            auto_pr=payload.auto_pr,
            notify=payload.notify,
            app_url=payload.app_url,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-Heal Pipeline error: {str(e)}")


@router.get("/status/{bug_id}")
def get_auto_heal_status(bug_id: str, db: Session = Depends(get_db)):
    """Retrieve the latest auto-healing audit trail and stage results for a bug."""
    inv = (
        db.query(Investigation)
        .filter(Investigation.bug_id == bug_id)
        .order_by(Investigation.created_at.desc())
        .first()
    )
    if not inv or not inv.evidence or "auto_heal_pipeline" not in inv.evidence:
        return {"has_run": False, "stages": None, "logs": []}

    return {"has_run": True, **inv.evidence["auto_heal_pipeline"]}


@router.post("/toggle-project")
def toggle_project_auto_heal(payload: ToggleProjectAutoHealRequest, db: Session = Depends(get_db)):
    """Enable or disable autonomous background healing for all critical bugs ingested in a project."""
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    cfg = dict(project.redaction_config or {})
    cfg["auto_heal_enabled"] = payload.enabled
    project.redaction_config = cfg
    db.commit()

    return {"project_id": project.id, "auto_heal_enabled": payload.enabled}
