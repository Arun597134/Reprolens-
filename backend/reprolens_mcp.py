"""
ReproLens Model Context Protocol (MCP) Stdio Server.
Allows AI coding agents (Antigravity, Cursor, Claude Code) to query live browser bugs,
inspect root-cause dossiers, run 4-Reality Chaos Matrices, and verify JS fixes in Dual-Reality Chromium.
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.schema import BugReport, Event as EventModel, Investigation, Reproduction, Session as SessionModel
from app.services.reproduction_engine import reproduction_engine

PROTOCOL_VERSION = "2024-11-05"

TOOLS: list[dict[str, Any]] = [
    {
        "name": "list_bugs",
        "description": "List recent bug reports captured by ReproLens browser telemetry.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "Optional status filter (open, investigating, reproduced, resolved)"},
                "limit": {"type": "integer", "default": 15, "description": "Max bugs to return"},
            },
        },
    },
    {
        "name": "get_bug_dossier",
        "description": "Retrieve full bug report, chronological session telemetry, AI investigation root cause, Vision audit, and latest reproduction steps.",
        "inputSchema": {
            "type": "object",
            "required": ["bug_id"],
            "properties": {
                "bug_id": {"type": "string", "description": "ReproLens bug UUID"},
            },
        },
    },
    {
        "name": "verify_fix_dual_reality",
        "description": "Run Playwright Dual-Reality sandbox verification comparing unpatched baseline (Reality A) vs injected runtime patch (Reality B).",
        "inputSchema": {
            "type": "object",
            "required": ["bug_id"],
            "properties": {
                "bug_id": {"type": "string", "description": "ReproLens bug UUID"},
                "custom_patch_js": {"type": "string", "description": "Optional JavaScript patch to inject via page.add_init_script in Reality B"},
            },
        },
    },
    {
        "name": "run_chaos_matrix",
        "description": "Execute the 4-Reality Race-Condition & Chaos Matrix (Desktop Baseline, Out-of-Order API Race, Cold Storage, Mobile 390x844).",
        "inputSchema": {
            "type": "object",
            "required": ["bug_id"],
            "properties": {
                "bug_id": {"type": "string", "description": "ReproLens bug UUID"},
            },
        },
    },
]


def _load_bug_context(bug_id: str) -> tuple[BugReport, dict, list[dict]]:
    db = SessionLocal()
    try:
        bug = db.query(BugReport).filter(BugReport.id == bug_id).first()
        if not bug:
            raise ValueError(f"Bug '{bug_id}' not found")
        session_meta: dict[str, Any] = {}
        events_data: list[dict[str, Any]] = []
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
        db.expunge(bug)
        return bug, session_meta, events_data
    finally:
        db.close()


def _tool_list_bugs(args: dict[str, Any]) -> dict[str, Any]:
    db = SessionLocal()
    try:
        q = db.query(BugReport)
        if args.get("status"):
            q = q.filter(BugReport.status == args["status"])
        limit = min(int(args.get("limit") or 15), 50)
        bugs = q.order_by(BugReport.created_at.desc()).limit(limit).all()
        return {
            "count": len(bugs),
            "bugs": [
                {
                    "id": b.id,
                    "title": b.title,
                    "status": b.status,
                    "severity": b.severity,
                    "error_type": b.error_type,
                    "error_message": b.error_message,
                    "url": b.url,
                }
                for b in bugs
            ],
        }
    finally:
        db.close()


def _tool_get_bug_dossier(args: dict[str, Any]) -> dict[str, Any]:
    bug_id = str(args["bug_id"])
    bug, session_meta, events_data = _load_bug_context(bug_id)
    db = SessionLocal()
    try:
        inv = db.query(Investigation).filter(Investigation.bug_id == bug.id).order_by(Investigation.created_at.desc()).first()
        repro = db.query(Reproduction).filter(Reproduction.bug_id == bug.id).order_by(Reproduction.created_at.desc()).first()
        return {
            "bug": {
                "id": bug.id,
                "title": bug.title,
                "status": bug.status,
                "severity": bug.severity,
                "error_type": bug.error_type,
                "error_message": bug.error_message,
                "stack_trace": bug.stack_trace,
                "url": bug.url,
            },
            "session_meta": session_meta,
            "telemetry_events": events_data[-25:],
            "investigation": (
                {
                    "summary": inv.summary,
                    "root_cause_analysis": inv.root_cause_analysis,
                    "observed_facts": inv.observed_facts,
                    "fix_recommendations": inv.fix_recommendations,
                    "vision_audit": (inv.evidence or {}).get("vision_audit"),
                }
                if inv
                else None
            ),
            "latest_reproduction": (
                {
                    "status": repro.status,
                    "steps": repro.reproduction_steps,
                    "dual_reality": (repro.environment_config or {}).get("dual_reality"),
                    "chaos_matrix": (repro.environment_config or {}).get("chaos_matrix"),
                }
                if repro
                else None
            ),
        }
    finally:
        db.close()


def _tool_verify_fix_dual_reality(args: dict[str, Any]) -> dict[str, Any]:
    bug, session_meta, events_data = _load_bug_context(str(args["bug_id"]))
    return asyncio.run(
        reproduction_engine.verify_fix_dual_reality(
            bug_report={
                "id": bug.id,
                "title": bug.title,
                "error_message": bug.error_message,
                "error_type": bug.error_type,
                "url": bug.url,
            },
            session_meta=session_meta,
            session_events=events_data,
            custom_patch_js=args.get("custom_patch_js"),
        )
    )


def _tool_run_chaos_matrix(args: dict[str, Any]) -> dict[str, Any]:
    bug, session_meta, events_data = _load_bug_context(str(args["bug_id"]))
    return asyncio.run(
        reproduction_engine.run_chaos_matrix(
            bug_report={
                "id": bug.id,
                "title": bug.title,
                "error_message": bug.error_message,
                "error_type": bug.error_type,
                "url": bug.url,
            },
            session_meta=session_meta,
            session_events=events_data,
        )
    )


TOOL_DISPATCH = {
    "list_bugs": _tool_list_bugs,
    "get_bug_dossier": _tool_get_bug_dossier,
    "verify_fix_dual_reality": _tool_verify_fix_dual_reality,
    "run_chaos_matrix": _tool_run_chaos_matrix,
}


def handle_jsonrpc_request(req: dict[str, Any]) -> dict[str, Any] | None:
    req_id = req.get("id")
    method = req.get("method", "")
    params = req.get("params") or {}

    if method == "notifications/initialized":
        return None
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "reprolens-mcp", "version": "1.0.0"},
            },
        }
    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}
    if method == "tools/call":
        name = params.get("name", "")
        handler = TOOL_DISPATCH.get(name)
        if not handler:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Unknown tool: {name}"},
            }
        try:
            output = handler(params.get("arguments") or {})
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(output, indent=2, default=str)}],
                },
            }
        except Exception as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "isError": True,
                    "content": [{"type": "text", "text": f"Tool execution error: {exc}"}],
                },
            }

    if req_id is None:
        return None
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def main() -> None:
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        resp = handle_jsonrpc_request(req)
        if resp is not None:
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
