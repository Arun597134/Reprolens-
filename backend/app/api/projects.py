import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import Project
from app.schemas.dtos import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc()).all()

@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    api_key = f"rpl_{secrets.token_hex(16)}"
    project = Project(
        name=data.name,
        website_url=data.website_url,
        api_key=api_key,
        redaction_config=data.redaction_config or {
            "mask_all_inputs": True,
            "filter_query_params": True,
            "custom_keywords": ["secret", "cvv", "token"]
        }
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.website_url is not None:
        project.website_url = data.website_url

    cfg = dict(project.redaction_config or {})
    if data.project_mode is not None:
        cfg["project_mode"] = data.project_mode
    if data.github_repo is not None:
        repo_val = data.github_repo.strip()
        cfg["github_repo"] = repo_val
        if data.project_mode is None:
            cfg["project_mode"] = "own_repo" if repo_val else "external_monitor"
    if data.github_branch is not None:
        cfg["github_branch"] = data.github_branch.strip() or "main"

    project.redaction_config = cfg
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"status": "deleted"}
