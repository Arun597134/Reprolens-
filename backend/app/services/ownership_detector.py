from typing import Any
from urllib.parse import urlparse


LOCAL_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"}


def extract_host_and_port(url: str) -> tuple[str, str]:
    """Return normalized (hostname, netloc_without_www) for a URL."""
    raw = (url or "").strip()
    if not raw:
        return "", ""
    if "://" not in raw:
        raw = "https://" + raw
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        netloc = host
        if parsed.port:
            netloc = f"{host}:{parsed.port}"
        return host, netloc
    except Exception:
        return "", ""


def is_localhost_url(url: str) -> bool:
    host, _ = extract_host_and_port(url)
    return host in LOCAL_HOSTS


def urls_same_app(url_a: str, url_b: str) -> bool:
    """True when two URLs point to the same site/app host (and same port for localhost)."""
    host_a, netloc_a = extract_host_and_port(url_a)
    host_b, netloc_b = extract_host_and_port(url_b)
    if not host_a or not host_b:
        return False
    if host_a in LOCAL_HOSTS and host_b in LOCAL_HOSTS:
        # Differentiate localhost:3000 vs localhost:5173 when ports are present
        if ":" in netloc_a and ":" in netloc_b:
            return netloc_a == netloc_b
        return True
    return host_a == host_b


def classify_bug_ownership(
    bug_url: str,
    project_website_url: str,
    redaction_config: dict[str, Any] | None = None,
    source: str = "",
) -> dict[str, Any]:
    """
    Determine whether a bug belongs to the user's own source-controlled project
    or an external active website that should stay monitor/investigate-only.
    """
    cfg = redaction_config or {}
    mode = cfg.get("project_mode")
    github_repo = (cfg.get("github_repo") or "").strip()
    bug_host, _ = extract_host_and_port(bug_url)
    proj_host, _ = extract_host_and_port(project_website_url)

    # 1. Explicit external-only project
    if mode == "external_monitor" and source != "web_sdk" and not is_localhost_url(bug_url):
        return {
            "ownership": "external_app",
            "can_push_pr": False,
            "reason": f"'{bug_host or bug_url}' is under External / Active App Monitor mode.",
            "detected_host": bug_host,
        }

    # 2. Embedded ReproLens Web SDK means source code is owned by developer
    if source == "web_sdk":
        return {
            "ownership": "own_project",
            "can_push_pr": True,
            "reason": "ReproLens Web SDK is embedded directly in app source code.",
            "detected_host": bug_host,
        }

    # 3. Host mismatch guard: even if project has a GitHub repo, do not allow PR push for unrelated domains
    if bug_host and proj_host and not urls_same_app(bug_url, project_website_url):
        if is_localhost_url(bug_url):
            return {
                "ownership": "own_project",
                "can_push_pr": bool(github_repo) or mode == "own_repo",
                "reason": f"Running on local dev host ({bug_host}).",
                "detected_host": bug_host,
            }
        return {
            "ownership": "external_app",
            "can_push_pr": False,
            "reason": f"Host mismatch: captured on '{bug_host}', project tracks '{proj_host}'. Treated as External App (Investigate Only).",
            "detected_host": bug_host,
        }

    # 4. Matched project domain with GitHub repo or own_repo flag
    if github_repo or mode == "own_repo":
        return {
            "ownership": "own_project",
            "can_push_pr": True,
            "reason": f"Domain '{bug_host or proj_host}' matches Own Project{' (' + github_repo + ')' if github_repo else ''}.",
            "detected_host": bug_host,
        }

    # 5. Localhost without explicit external flag
    if is_localhost_url(bug_url):
        return {
            "ownership": "own_project",
            "can_push_pr": True,
            "reason": f"Local development environment ({bug_host}).",
            "detected_host": bug_host,
        }

    return {
        "ownership": "external_app",
        "can_push_pr": False,
        "reason": f"External domain '{bug_host or bug_url}' with no linked GitHub repository.",
        "detected_host": bug_host,
    }


def select_target_project(
    default_project: Any,
    all_projects: list[Any],
    payload_url: str,
    source: str = "extension",
) -> tuple[Any, dict[str, Any]]:
    """
    Auto-route incoming telemetry to the matching project by domain:
    - If payload_url matches an Own Project's website_url, route there (own_project).
    - If payload_url matches default_project or localhost or uses web_sdk, use default_project.
    - Otherwise route external domains to an External Monitor project if available (or signal external_app).
    """
    if source == "web_sdk" or not payload_url:
        verdict = classify_bug_ownership(
            payload_url, default_project.website_url, default_project.redaction_config, source=source
        )
        return default_project, verdict

    # 1. Exact host match preferring Own Projects first
    own_matches = []
    other_matches = []
    for proj in all_projects:
        if urls_same_app(payload_url, proj.website_url):
            cfg = proj.redaction_config or {}
            if cfg.get("project_mode") == "own_repo" or cfg.get("github_repo"):
                own_matches.append(proj)
            else:
                other_matches.append(proj)

    if own_matches:
        chosen = own_matches[0]
        return chosen, classify_bug_ownership(payload_url, chosen.website_url, chosen.redaction_config, source=source)

    if other_matches:
        chosen = other_matches[0]
        return chosen, classify_bug_ownership(payload_url, chosen.website_url, chosen.redaction_config, source=source)

    # 2. Localhost stays on default project
    if is_localhost_url(payload_url):
        return default_project, classify_bug_ownership(
            payload_url, default_project.website_url, default_project.redaction_config, source=source
        )

    # 3. Unrecognized external domain: prefer an explicit external_monitor project if user has one
    for proj in all_projects:
        cfg = proj.redaction_config or {}
        if cfg.get("project_mode") == "external_monitor":
            return proj, classify_bug_ownership(payload_url, proj.website_url, cfg, source=source)

    # Fallback: keep on default_project, but stamp ownership as external_app cleanly
    verdict = classify_bug_ownership(
        payload_url, default_project.website_url, default_project.redaction_config, source=source
    )
    return default_project, verdict
