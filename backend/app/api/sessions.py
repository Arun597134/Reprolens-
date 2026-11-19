from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import Session as SessionModel, Event as EventModel
from app.schemas.dtos import SessionSummary, SessionDetail

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("", response_model=list[SessionSummary])
def list_sessions(
    project_id: str | None = None,
    has_errors: bool | None = None,
    status: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(SessionModel)
    if project_id:
        query = query.filter(SessionModel.project_id == project_id)
    if has_errors is True:
        query = query.filter(SessionModel.error_count > 0)
    elif has_errors is False:
        query = query.filter(SessionModel.error_count == 0)
    if status:
        query = query.filter(SessionModel.status == status)

    return query.order_by(SessionModel.started_at.desc()).limit(limit).all()

@router.get("/{session_id}", response_model=SessionDetail)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = (
        db.query(SessionModel)
        .filter((SessionModel.id == session_id) | (SessionModel.session_token == session_id))
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    session = (
        db.query(SessionModel)
        .filter((SessionModel.id == session_id) | (SessionModel.session_token == session_id))
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"status": "deleted"}
