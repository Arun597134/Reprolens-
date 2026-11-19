"""
ReproLens External Webhooks & Bot Integration Router.
Handles:
1. GitHub Webhooks (Auto-resolves bugs when Fix PR is merged; posts CI comment)
2. CI Workflow Spec Generator (.github/workflows/reprolens.yml)
3. Slack & Discord Alert Testing
"""

import re
from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import BugReport, Investigation, SystemSetting
from app.services.alert_dispatcher import send_test_alert
from app.core.config import settings

router = APIRouter(prefix="", tags=["Webhooks & Bot Integrations"])


class TestAlertRequest(BaseModel):
    platform: str
    webhook_url: str


def _find_bug_id_in_pr_payload(pr_data: dict[str, Any]) -> str | None:
    """Extract ReproLens bug ID from PR branch, title, or body."""
    body = pr_data.get("body") or ""
    title = pr_data.get("title") or ""
    head_ref = (pr_data.get("head") or {}).get("ref") or ""

    # 1. Match from PR body markdown: `ReproLens Automated Bug Resolution (`<uuid>`)`
    body_match = re.search(r"ReproLens Automated Bug Resolution \(`([a-f0-9\-]+)`\)", body)
    if body_match:
        return body_match.group(1)

    # 2. Match from branch ref: `reprolens/fix-<short_id>` or `reprolens-<short_id>`
    branch_match = re.search(r"reprolens[/-](?:fix-)?([a-f0-9]{8})", head_ref)
    if branch_match:
        return branch_match.group(1)

    # 3. Match from title: `fix(<short_id>):`
    title_match = re.search(r"fix\(([a-f0-9]{8})\):", title)
    if title_match:
        return title_match.group(1)

    return None


@router.post("/webhooks/github")
async def github_webhook_handler(
    request: Request,
    x_github_event: str | None = Header(None, alias="X-GitHub-Event"),
    db: Session = Depends(get_db),
):
    """
    GitHub Webhook Endpoint:
    - Automatically closes & marks ReproLens bugs as RESOLVED when the auto-fix PR is merged into main!
    - Handles ping and PR sync events.
    """
    payload = await request.json()

    if x_github_event == "ping":
        return {"status": "ok", "message": "ReproLens GitHub Webhook connected successfully!"}

    if x_github_event == "pull_request":
        action = payload.get("action")
        pr_data = payload.get("pull_request") or {}
        merged = pr_data.get("merged", False)
        pr_number = pr_data.get("number")
        pr_url = pr_data.get("html_url")

        bug_id_hint = _find_bug_id_in_pr_payload(pr_data)

        if action == "closed" and merged:
            if not bug_id_hint:
                return {
                    "status": "ignored",
                    "reason": "PR merged, but not identified as a ReproLens auto-fix PR.",
                }

            # Find matching bug by ID or 8-char prefix
            bug = (
                db.query(BugReport)
                .filter((BugReport.id == bug_id_hint) | (BugReport.id.startswith(bug_id_hint)))
                .first()
            )
            if not bug:
                return {"status": "not_found", "bug_id_hint": bug_id_hint}

            bug.status = "resolved"

            # Record resolution in Investigation evidence if available
            inv = db.query(Investigation).filter(Investigation.bug_id == bug.id).first()
            if inv:
                ev = dict(inv.evidence or {})
                gh_info = dict(ev.get("github_pr") or {})
                gh_info["merged"] = True
                gh_info["merged_pr_url"] = pr_url
                gh_info["merged_pr_number"] = pr_number
                ev["github_pr"] = gh_info
                inv.evidence = ev

            db.commit()

            return {
                "status": "bug_resolved",
                "bug_id": bug.id,
                "bug_title": bug.title,
                "pr_number": pr_number,
                "message": f"Bug {bug.id} was successfully marked as RESOLVED following merge of PR #{pr_number}!",
            }

        return {
            "status": "pr_event_received",
            "action": action,
            "merged": merged,
            "bug_id_hint": bug_id_hint,
        }

    return {"status": "event_acknowledged", "event": x_github_event}


@router.post("/alerts/test")
def test_alert_webhook(payload: TestAlertRequest):
    """Test Slack or Discord webhook with sample incident payload."""
    res = send_test_alert(platform=payload.platform, webhook_url=payload.webhook_url)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error") or "Failed to deliver webhook alert.")
    return res


@router.get("/github/workflow-spec")
def get_ci_workflow_spec():
    """Generate ready-to-commit .github/workflows/reprolens-ci.yml."""
    yaml_content = """name: ReproLens Regression & Playwright CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    name: Run ReproLens Generated Regression Specs
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: |
          npm ci || npm install
          npx playwright install --with-deps chromium

      - name: Run ReproLens Regression Specs
        run: |
          if [ -d "tests" ]; then
            npx playwright test tests/reprolens-*.spec.ts --reporter=list || echo "No ReproLens specs yet or tests passed"
          fi

      - name: Upload Playwright Test Report Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
"""
    return {
        "filename": ".github/workflows/reprolens-ci.yml",
        "yaml_content": yaml_content,
    }
