"""
ReproLens Real-Time Alert Dispatcher.
Supports Slack Block Kit & Discord Webhook incident notifications with 1-click action links.
"""

import httpx
from typing import Any
from sqlalchemy.orm import Session
from app.models.schema import SystemSetting


def send_slack_alert(webhook_url: str, bug: dict[str, Any], app_url: str = "http://localhost:5173") -> dict[str, Any]:
    """Send rich Slack Block Kit notification for high/critical bug incidents."""
    if not webhook_url:
        return {"success": False, "error": "No webhook URL provided"}

    short_id = bug.get("id", "")[:8]
    title = bug.get("title", "Unhandled Runtime Bug")
    error_type = bug.get("error_type", "JavaScriptError")
    severity = str(bug.get("severity", "high")).upper()
    route = bug.get("url", "unknown")
    rca = bug.get("root_cause_analysis") or bug.get("error_message") or "Runtime crash captured by ReproLens."
    repro_url = f"{app_url.rstrip('/')}/?view=bug&id={bug.get('id', '')}"

    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🚨 ReproLens Incident: {error_type}",
                "emoji": True,
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Title:* *{title}*\n*Severity:* `{severity}` | *Bug ID:* `{short_id}`\n*Route:* `{route}`",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*AI Root Cause Analysis:*\n>{rca[:280]}",
            },
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "▶ View Interactive Replay", "emoji": True},
                    "style": "primary",
                    "url": repro_url,
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "🚀 Open Auto-Fix PR in ReproLens", "emoji": True},
                    "url": repro_url,
                },
            ],
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "🛡️ _ReproLens Deterministic Bug Telemetry & AI Self-Healing Engine_",
                }
            ],
        },
    ]

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(webhook_url, json={"blocks": blocks, "text": f"🚨 ReproLens Bug: {title}"})
            return {"success": resp.status_code in (200, 204), "status_code": resp.status_code, "text": resp.text}
    except Exception as e:
        return {"success": False, "error": str(e)}


def send_discord_alert(webhook_url: str, bug: dict[str, Any], app_url: str = "http://localhost:5173") -> dict[str, Any]:
    """Send rich Discord Embed notification for bug incidents with 1-click review."""
    if not webhook_url:
        return {"success": False, "error": "No webhook URL provided"}

    short_id = bug.get("id", "")[:8]
    title = bug.get("title", "Unhandled Runtime Bug")
    error_type = bug.get("error_type", "JavaScriptError")
    severity = str(bug.get("severity", "high")).upper()
    route = bug.get("url", "unknown")
    rca = bug.get("root_cause_analysis") or bug.get("error_message") or "Runtime crash captured by ReproLens."
    repro_url = f"{app_url.rstrip('/')}/?view=bug&id={bug.get('id', '')}"

    color = 0xE11D48 if severity in ("CRITICAL", "HIGH") else 0xF59E0B

    embed = {
        "title": f"🚨 ReproLens Incident: {error_type}",
        "url": repro_url,
        "description": f"**{title}**\n\n**AI Root Cause Analysis:**\n> {rca[:300]}",
        "color": color,
        "fields": [
            {"name": "Severity", "value": f"`{severity}`", "inline": True},
            {"name": "Bug ID", "value": f"`{short_id}`", "inline": True},
            {"name": "Route", "value": f"`{route}`", "inline": False},
        ],
        "footer": {
            "text": "ReproLens AI-Powered Bug Investigation • Click title to view Playwright reproduction & PR"
        },
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(webhook_url, json={"embeds": [embed], "content": f"🚨 **New Bug Captured on {route}**"})
            return {"success": resp.status_code in (200, 204), "status_code": resp.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


def dispatch_bug_alerts(bug: dict[str, Any], db: Session, app_url: str = "http://localhost:5173") -> dict[str, Any]:
    """Check configured webhooks in SystemSetting and dispatch alerts if severity >= medium."""
    settings = {s.key: s.value for s in db.query(SystemSetting).all()}
    slack_url = settings.get("SLACK_WEBHOOK_URL")
    discord_url = settings.get("DISCORD_WEBHOOK_URL")

    results = {}
    if slack_url:
        results["slack"] = send_slack_alert(slack_url, bug, app_url)
    if discord_url:
        results["discord"] = send_discord_alert(discord_url, bug, app_url)

    return results


def send_test_alert(platform: str, webhook_url: str, app_url: str = "http://localhost:5173") -> dict[str, Any]:
    """Send sample test alert to verify webhook configuration."""
    sample_bug = {
        "id": "test-sample-bug-1234",
        "title": "TypeError: Cannot read properties of undefined (reading 'items')",
        "error_type": "TypeError",
        "severity": "critical",
        "url": "https://arun-m-portfolio.vercel.app/projects",
        "root_cause_analysis": "Component tried to map over undefined array during initial state hydration. Handled with defensive optional chaining.",
    }
    if platform.lower() == "slack":
        return send_slack_alert(webhook_url, sample_bug, app_url)
    elif platform.lower() == "discord":
        return send_discord_alert(webhook_url, sample_bug, app_url)
    return {"success": False, "error": f"Unsupported platform '{platform}'"}
