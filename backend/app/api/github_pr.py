from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.schema import BugReport, Investigation, Project, RegressionTest, SystemSetting
from app.schemas.dtos import (
    GitHubCreatePRRequest,
    GitHubListFilesRequest,
    GitHubPreviewPatchRequest,
)
from app.services.github_pr_service import github_pr_service
from app.services.test_generator import test_generator

router = APIRouter(prefix="/github", tags=["GitHub Auto-Fix PR"])


def _load_bug_and_keys(bug_id: str, db: Session) -> tuple[BugReport, Project | None, Investigation | None, dict[str, str]]:
    bug = db.query(BugReport).filter(BugReport.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found")

    project = db.query(Project).filter(Project.id == bug.project_id).first()
    inv = (
        db.query(Investigation)
        .filter(Investigation.bug_id == bug.id)
        .order_by(Investigation.created_at.desc())
        .first()
    )

    records = {s.key: s.value for s in db.query(SystemSetting).all()}
    keys = {
        "github_token": records.get("GITHUB_TOKEN") or settings.GITHUB_TOKEN,
        "gemini_key": records.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY,
        "openai_key": records.get("OPENAI_API_KEY") or settings.OPENAI_API_KEY,
        "default_repo": records.get("DEFAULT_GITHUB_REPO", ""),
        "default_branch": records.get("DEFAULT_GITHUB_BRANCH", "main") or "main",
    }
    return bug, project, inv, keys


def _bug_dict(bug: BugReport) -> dict:
    return {
        "id": bug.id,
        "title": bug.title,
        "error_message": bug.error_message,
        "error_type": bug.error_type,
        "stack_trace": bug.stack_trace,
        "url": bug.url,
        "component_context": bug.component_context,
    }


def _inv_dict(inv: Investigation | None) -> dict | None:
    if not inv:
        return None
    return {
        "root_cause_analysis": inv.root_cause_analysis,
        "fix_recommendations": inv.fix_recommendations or [],
    }


@router.get("/discover-repos")
def discover_github_repositories(username: str | None = None, db: Session = Depends(get_db)):
    records = {s.key: s.value for s in db.query(SystemSetting).all()}
    token = records.get("GITHUB_TOKEN") or settings.GITHUB_TOKEN
    clean_user = (username or "").strip()

    if token:
        try:
            return {"repos": github_pr_service.discover_user_repos(token), "source": "authenticated"}
        except Exception as e:
            if not clean_user:
                raise HTTPException(status_code=400, detail=str(e))

    if clean_user:
        try:
            return {"repos": github_pr_service.discover_public_user_repos(clean_user), "source": "public"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    raise HTTPException(
        status_code=400,
        detail="GitHub Personal Access Token not configured. Enter your GitHub username (e.g. Arun597134) to load public repos, or add your Token in Settings & SDK.",
    )


@router.post("/list-files")
def list_repository_files(payload: GitHubListFilesRequest, db: Session = Depends(get_db)):
    bug, project, inv, keys = _load_bug_and_keys(payload.bug_id, db)
    if not keys["github_token"]:
        raise HTTPException(status_code=400, detail="GitHub Personal Access Token not configured. Add it in Settings & SDK.")

    proj_cfg = (project.redaction_config or {}) if project else {}
    owner_repo = (payload.owner_repo or proj_cfg.get("github_repo") or keys["default_repo"] or "").strip()
    if not owner_repo:
        raise HTTPException(status_code=400, detail="No GitHub repo linked to this project. Link an owner/repo in Projects or Settings.")

    branch = (payload.branch or proj_cfg.get("github_branch") or keys["default_branch"] or "main").strip()
    try:
        return github_pr_service.list_repo_files(
            owner_repo=owner_repo,
            token=keys["github_token"],
            branch=branch,
            bug_report=_bug_dict(bug),
            investigation=_inv_dict(inv),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/preview-patch")
def preview_ai_patch(payload: GitHubPreviewPatchRequest, db: Session = Depends(get_db)):
    bug, _project, inv, keys = _load_bug_and_keys(payload.bug_id, db)
    if not keys["github_token"]:
        raise HTTPException(status_code=400, detail="GitHub Personal Access Token not configured. Add it in Settings & SDK.")

    try:
        return github_pr_service.preview_fix_patch(
            owner_repo=payload.owner_repo,
            token=keys["github_token"],
            branch=payload.branch or "main",
            file_path=payload.file_path,
            bug_report=_bug_dict(bug),
            investigation=_inv_dict(inv),
            gemini_key=keys["gemini_key"],
            openai_key=keys["openai_key"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-pr")
def create_github_pull_request(payload: GitHubCreatePRRequest, db: Session = Depends(get_db)):
    bug, _project, inv, keys = _load_bug_and_keys(payload.bug_id, db)
    if not keys["github_token"]:
        raise HTTPException(status_code=400, detail="GitHub Personal Access Token not configured. Add it in Settings & SDK.")

    short_id = bug.id[:8]
    pr_title = (payload.pr_title or f"fix({short_id}): {bug.title[:72]}").strip()
    commit_msg = (payload.commit_message or f"fix: resolve {bug.error_type} captured by ReproLens ({short_id})").strip()

    rca_section = inv.root_cause_analysis if inv and inv.root_cause_analysis else bug.error_message
    pr_body = payload.pr_body or "\n".join([
        f"## ReproLens Automated Bug Resolution (`{bug.id}`)",
        "",
        f"- **Severity**: `{bug.severity.upper()}`",
        f"- **Route**: `{bug.url}`",
        f"- **Error**: `{bug.error_type}: {bug.error_message}`",
        "",
        "### AI Root Cause Analysis",
        rca_section or "_Captured from runtime telemetry._",
        "",
        "### Modified File",
        f"- `{payload.file_path}`",
    ])

    test_file_path: str | None = None
    test_code: str | None = None
    if payload.include_regression_test:
        existing_test = (
            db.query(RegressionTest)
            .filter(RegressionTest.bug_id == bug.id)
            .order_by(RegressionTest.created_at.desc())
            .first()
        )
        if existing_test:
            test_code = existing_test.test_code
        else:
            generated = test_generator.generate_playwright_test(
                bug_report=_bug_dict(bug),
                investigation=_inv_dict(inv) or {},
            )
            test_code = generated["test_code"]
        test_file_path = f"tests/reprolens-{short_id}.spec.ts"
        pr_body += f"\n- Regression Spec: `{test_file_path}`\n"

    try:
        pr_result = github_pr_service.create_fix_pull_request(
            owner_repo=payload.owner_repo,
            token=keys["github_token"],
            base_branch=payload.branch or "main",
            file_path=payload.file_path,
            patched_content=payload.patched_content,
            commit_message=commit_msg,
            pr_title=pr_title,
            pr_body=pr_body,
            bug_id=bug.id,
            test_file_path=test_file_path,
            test_code=test_code,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    pr_record = {**pr_result, "created_at": datetime.now(timezone.utc).isoformat()}
    if not inv:
        inv = Investigation(
            bug_id=bug.id,
            status="completed",
            summary=f"GitHub PR #{pr_result.get('pr_number')} created for {bug.title}",
            root_cause_analysis=bug.error_message,
            evidence={"github_pr": pr_record},
            ai_model_used="ReproLens GitHub PR Bridge",
        )
        db.add(inv)
    else:
        ev = dict(inv.evidence or {})
        ev["github_pr"] = pr_record
        inv.evidence = ev

    bug.status = "regression_ready"
    db.commit()

    return pr_record
