from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import BugReport
from app.schemas.dtos import BugReportCreate, BugReportUpdate, BugReportResponse

router = APIRouter(prefix="/bugs", tags=["Bugs"])

@router.get("", response_model=list[BugReportResponse])
def list_bugs(
    project_id: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(BugReport)
    if project_id:
        query = query.filter(BugReport.project_id == project_id)
    if status:
        query = query.filter(BugReport.status == status)
    if severity:
        query = query.filter(BugReport.severity == severity)
    return query.order_by(BugReport.created_at.desc()).limit(limit).all()

@router.post("", response_model=BugReportResponse)
def create_bug(data: BugReportCreate, db: Session = Depends(get_db)):
    bug = BugReport(
        project_id=data.project_id,
        session_id=data.session_id,
        title=data.title,
        severity=data.severity,
        error_message=data.error_message,
        error_type=data.error_type,
        stack_trace=data.stack_trace,
        url=data.url,
        component_context=data.component_context
    )
    db.add(bug)
    db.commit()
    db.refresh(bug)
    return bug

@router.get("/{bug_id}", response_model=BugReportResponse)
def get_bug(bug_id: str, db: Session = Depends(get_db)):
    bug = db.query(BugReport).filter(BugReport.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")
    return bug

@router.patch("/{bug_id}", response_model=BugReportResponse)
def update_bug(bug_id: str, data: BugReportUpdate, db: Session = Depends(get_db)):
    bug = db.query(BugReport).filter(BugReport.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")
    if data.status:
        bug.status = data.status
    if data.severity:
        bug.severity = data.severity
    if data.title:
        bug.title = data.title
    db.commit()
    db.refresh(bug)
    return bug

@router.delete("/{bug_id}")
def delete_bug(bug_id: str, db: Session = Depends(get_db)):
    bug = db.query(BugReport).filter(BugReport.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")
    db.delete(bug)
    db.commit()
    return {"status": "deleted"}
