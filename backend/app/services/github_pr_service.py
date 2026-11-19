import base64
import difflib
import json
import re
import time
from typing import Any
from urllib.parse import urlparse
import httpx

from app.core.config import settings
from app.services.ai_investigator import ai_investigator

GITHUB_API_BASE = "https://api.github.com"

IGNORED_DIRS = (
    "node_modules/",
    ".git/",
    "dist/",
    "build/",
    ".next/",
    ".vercel/",
    "__pycache__/",
    ".venv/",
    "coverage/",
)

CODE_EXTENSIONS = (
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".vue", ".svelte", ".py", ".css", ".scss", ".html",
)


def parse_owner_repo(repo_input: str) -> tuple[str, str]:
    """Normalize 'owner/repo' or full GitHub URL into (owner, repo)."""
    raw = (repo_input or "").strip()
    if not raw:
        raise ValueError("GitHub repository is required (e.g. 'owner/repo').")

    if raw.startswith("http://") or raw.startswith("https://"):
        parsed = urlparse(raw)
        path = parsed.path.strip("/")
    else:
        path = raw.strip("/")

    if path.endswith(".git"):
        path = path[:-4]

    parts = [p for p in path.split("/") if p]
    if len(parts) < 2:
        raise ValueError(f"Invalid GitHub repository format '{repo_input}'. Use 'owner/repo'.")
    return parts[0], parts[1]


def generate_unified_diff(original: str, patched: str, file_path: str) -> str:
    """Compute unified diff string between original and patched file contents."""
    diff_lines = difflib.unified_diff(
        original.splitlines(keepends=True),
        patched.splitlines(keepends=True),
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        lineterm="",
    )
    return "".join(diff_lines)


def rank_candidate_files(
    paths: list[str],
    bug_report: dict[str, Any],
    investigation: dict[str, Any] | None = None,
) -> list[str]:
    """Rank repository source files by relevance to stack trace, AI suggestions, and route."""
    code_files = [
        p for p in paths
        if not any(p.startswith(ignored) or f"/{ignored}" in p for ignored in IGNORED_DIRS)
        and p.lower().endswith(CODE_EXTENSIONS)
    ]

    keywords: list[str] = []
    if investigation:
        for rec in investigation.get("fix_recommendations") or []:
            f = (rec.get("file") or "").strip()
            if f:
                keywords.append(f.lower())

    trace_and_msg = " ".join([
        bug_report.get("stack_trace") or "",
        bug_report.get("error_message") or "",
        bug_report.get("component_context") or "",
    ]).lower()

    url_path = urlparse(bug_report.get("url") or "").path.strip("/").lower()
    url_tokens = [tok for tok in url_path.split("/") if len(tok) >= 3]

    scored: list[tuple[int, str]] = []
    for path in code_files:
        pl = path.lower()
        basename = pl.rsplit("/", 1)[-1]
        stem = basename.rsplit(".", 1)[0]
        score = 0

        for kw in keywords:
            if kw in pl or pl.endswith(kw):
                score += 100
        if basename in trace_and_msg:
            score += 75
        elif len(stem) >= 4 and stem in trace_and_msg:
            score += 40

        for tok in url_tokens:
            if tok in pl:
                score += 25

        if stem in ("app", "page", "index", "main", "layout", "checkout", "payment"):
            score += 10
        if pl.startswith("src/") or pl.startswith("app/") or pl.startswith("pages/"):
            score += 5

        scored.append((score, path))

    scored.sort(key=lambda item: (-item[0], len(item[1]), item[1]))
    return [p for _, p in scored[:40]]


def _github_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _raise_github_error(resp: httpx.Response, context: str) -> None:
    try:
        detail = resp.json().get("message", resp.text[:200])
    except Exception:
        detail = resp.text[:200]
    raise RuntimeError(f"GitHub API error during {context} (HTTP {resp.status_code}): {detail}")


class GitHubPRService:
    """Service for Own-Project AI Auto-Fix Patching & GitHub Pull Request creation."""

    def discover_user_repos(self, token: str) -> list[dict[str, Any]]:
        """List writable GitHub repositories + Vercel/deployment homepages for automatic project linking."""
        headers = _github_headers(token)
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(
                f"{GITHUB_API_BASE}/user/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 30, "affiliation": "owner,collaborator,organization_member"},
            )
            if resp.status_code != 200:
                _raise_github_error(resp, "discovering user repositories")
            repos = resp.json()

        return [
            {
                "full_name": r.get("full_name", ""),
                "name": r.get("name", ""),
                "default_branch": r.get("default_branch", "main"),
                "homepage": (r.get("homepage") or "").strip(),
                "html_url": r.get("html_url", ""),
                "private": bool(r.get("private", False)),
            }
            for r in repos
            if (r.get("permissions") or {}).get("push", True)
        ]

    def discover_public_user_repos(self, username: str) -> list[dict[str, Any]]:
        """List public repositories for a given GitHub username without needing a token."""
        clean_user = username.strip().split("/")[0].strip()
        if not clean_user:
            return []
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "ReproLens",
        }
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(
                f"{GITHUB_API_BASE}/users/{clean_user}/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 30},
            )
            if resp.status_code == 404:
                raise RuntimeError(f"GitHub user '{clean_user}' not found.")
            if resp.status_code != 200:
                _raise_github_error(resp, f"fetching public repos for '{clean_user}'")
            repos = resp.json()

        return [
            {
                "full_name": r.get("full_name", ""),
                "name": r.get("name", ""),
                "default_branch": r.get("default_branch", "main"),
                "homepage": (r.get("homepage") or "").strip(),
                "html_url": r.get("html_url", ""),
                "private": bool(r.get("private", False)),
            }
            for r in repos
        ]

    def list_repo_files(
        self,
        owner_repo: str,
        token: str,
        branch: str | None,
        bug_report: dict[str, Any],
        investigation: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        owner, repo = parse_owner_repo(owner_repo)
        headers = _github_headers(token)

        with httpx.Client(timeout=20.0) as client:
            repo_resp = client.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}", headers=headers)
            if repo_resp.status_code != 200:
                _raise_github_error(repo_resp, "repo lookup")
            repo_meta = repo_resp.json()
            resolved_branch = (branch or "").strip() or repo_meta.get("default_branch", "main")

            tree_resp = client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{resolved_branch}?recursive=1",
                headers=headers,
            )
            if tree_resp.status_code != 200 and resolved_branch != repo_meta.get("default_branch"):
                resolved_branch = repo_meta.get("default_branch", "main")
                tree_resp = client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{resolved_branch}?recursive=1",
                    headers=headers,
                )
            if tree_resp.status_code != 200:
                _raise_github_error(tree_resp, "tree listing")

            blobs = [
                item["path"]
                for item in tree_resp.json().get("tree", [])
                if item.get("type") == "blob" and item.get("path")
            ]

        ranked = rank_candidate_files(blobs, bug_report, investigation)
        return {
            "owner_repo": f"{owner}/{repo}",
            "branch": resolved_branch,
            "default_branch": repo_meta.get("default_branch", resolved_branch),
            "candidate_files": ranked,
            "total_blobs": len(blobs),
        }

    def fetch_file(self, owner_repo: str, token: str, branch: str, file_path: str) -> tuple[str, str]:
        owner, repo = parse_owner_repo(owner_repo)
        headers = _github_headers(token)
        clean_path = file_path.lstrip("/")

        with httpx.Client(timeout=20.0) as client:
            resp = client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}",
                headers=headers,
                params={"ref": branch},
            )
            if resp.status_code != 200:
                _raise_github_error(resp, f"fetching {clean_path}")
            data = resp.json()

        raw_b64 = data.get("content", "")
        content = base64.b64decode(raw_b64).decode("utf-8", errors="replace")
        return content, data["sha"]

    def preview_fix_patch(
        self,
        owner_repo: str,
        token: str,
        branch: str,
        file_path: str,
        bug_report: dict[str, Any],
        investigation: dict[str, Any] | None = None,
        gemini_key: str | None = None,
        openai_key: str | None = None,
    ) -> dict[str, Any]:
        original_content, file_sha = self.fetch_file(owner_repo, token, branch, file_path)
        title = bug_report.get("title", "Runtime Defect")
        err_msg = bug_report.get("error_message", "")
        root_cause = (investigation or {}).get("root_cause_analysis", "")
        rec_diffs = json.dumps((investigation or {}).get("fix_recommendations", []), indent=2)

        g_key = gemini_key or settings.GEMINI_API_KEY
        o_key = openai_key or settings.OPENAI_API_KEY

        patched_content = original_content
        commit_message = f"fix: resolve {bug_report.get('error_type', 'runtime')} in {file_path}"
        explanation = "Generated minimal defensive patch."
        model_used = "ReproLens Offline Patch Template"

        prompt = f"""You are a Senior Software Engineer fixing a verified production bug in `{file_path}`.
Produce a COMPLETE, working updated version of `{file_path}` with ONLY the minimal necessary fix (preserve formatting, comments, imports, and unrelated code).

Bug Title: {title}
Error Type: {bug_report.get('error_type', '')}
Error Message: {err_msg}
URL: {bug_report.get('url', '')}
Stack Trace:
{bug_report.get('stack_trace', '')}

Investigation Root Cause:
{root_cause}

Suggested Fix Snippets:
{rec_diffs}

Current File Content (`{file_path}`):
```
{original_content[:18000]}
```

Return VALID JSON ONLY matching:
{{
  "patched_content": "<full updated file text>",
  "commit_message": "fix: concise one-line commit message",
  "explanation": "1-2 sentence explanation of the code change"
}}"""

        parsed: dict[str, Any] | None = None
        if g_key:
            try:
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                }
                parsed, model_name = ai_investigator._post_gemini_json(g_key, payload)
                model_used = f"{model_name} (Auto-Patch)"
            except Exception:
                parsed = None

        if parsed is None and o_key:
            try:
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {o_key}", "Content-Type": "application/json"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "user", "content": prompt}],
                            "response_format": {"type": "json_object"},
                        },
                    )
                if resp.status_code == 200:
                    parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                    model_used = "GPT-4o-mini (Auto-Patch)"
            except Exception:
                parsed = None

        if parsed and isinstance(parsed.get("patched_content"), str) and parsed["patched_content"].strip():
            patched_content = parsed["patched_content"]
            commit_message = (parsed.get("commit_message") or commit_message)[:100]
            explanation = parsed.get("explanation") or explanation
        else:
            # Deterministic safe fallback guard comment / ResizeObserver guard when LLMs are unavailable
            if "ResizeObserver" in err_msg and not original_content.startswith("/* ReproLens"):
                guard = (
                    "// ReproLens Auto-Fix Guard: prevent ResizeObserver loop unhandled notification crash\n"
                    if file_path.endswith((".ts", ".tsx", ".js", ".jsx"))
                    else ""
                )
                patched_content = guard + original_content
                explanation = "No external LLM response; inserted safe guard template — review/edit before pushing PR."

        diff_text = generate_unified_diff(original_content, patched_content, file_path)
        return {
            "owner_repo": owner_repo,
            "branch": branch,
            "file_path": file_path,
            "file_sha": file_sha,
            "original_content": original_content,
            "patched_content": patched_content,
            "unified_diff": diff_text or "(No diff lines changed yet — edit patched code below before pushing)",
            "commit_message": commit_message,
            "explanation": explanation,
            "model_used": model_used,
        }

    def create_fix_pull_request(
        self,
        owner_repo: str,
        token: str,
        base_branch: str,
        file_path: str,
        patched_content: str,
        commit_message: str,
        pr_title: str,
        pr_body: str,
        bug_id: str,
        test_file_path: str | None = None,
        test_code: str | None = None,
    ) -> dict[str, Any]:
        owner, repo = parse_owner_repo(owner_repo)
        headers = _github_headers(token)
        clean_path = file_path.lstrip("/")
        short_id = re.sub(r"[^a-zA-Z0-9_-]", "", bug_id)[:8] or "bug"
        branch_name = f"reprolens/fix-{short_id}-{int(time.time()) % 100000}"

        with httpx.Client(timeout=25.0) as client:
            # 1. Resolve base branch HEAD SHA
            ref_resp = client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/ref/heads/{base_branch}",
                headers=headers,
            )
            if ref_resp.status_code != 200:
                _raise_github_error(ref_resp, f"reading base branch '{base_branch}'")
            base_sha = ref_resp.json()["object"]["sha"]

            # 2. Create feature fix branch
            create_ref_resp = client.post(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/refs",
                headers=headers,
                json={"ref": f"refs/heads/{branch_name}", "sha": base_sha},
            )
            if create_ref_resp.status_code not in (200, 201):
                _raise_github_error(create_ref_resp, f"creating branch '{branch_name}'")

            # 3. Get current SHA of file on branch & commit patch
            file_resp = client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}",
                headers=headers,
                params={"ref": branch_name},
            )
            put_body: dict[str, Any] = {
                "message": commit_message,
                "content": base64.b64encode(patched_content.encode("utf-8")).decode("ascii"),
                "branch": branch_name,
            }
            if file_resp.status_code == 200:
                put_body["sha"] = file_resp.json()["sha"]

            commit_resp = client.put(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}",
                headers=headers,
                json=put_body,
            )
            if commit_resp.status_code not in (200, 201):
                _raise_github_error(commit_resp, f"committing fix to '{clean_path}'")
            commit_sha = commit_resp.json().get("commit", {}).get("sha", "")

            committed_files = [clean_path]

            # 4. Optionally attach generated Playwright regression test
            if test_file_path and test_code:
                clean_test_path = test_file_path.lstrip("/")
                test_check = client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_test_path}",
                    headers=headers,
                    params={"ref": branch_name},
                )
                test_put: dict[str, Any] = {
                    "message": f"test: add ReproLens regression spec for bug {short_id}",
                    "content": base64.b64encode(test_code.encode("utf-8")).decode("ascii"),
                    "branch": branch_name,
                }
                if test_check.status_code == 200:
                    test_put["sha"] = test_check.json()["sha"]

                test_commit_resp = client.put(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_test_path}",
                    headers=headers,
                    json=test_put,
                )
                if test_commit_resp.status_code in (200, 201):
                    committed_files.append(clean_test_path)

            # 5. Open Pull Request against base_branch
            pr_resp = client.post(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls",
                headers=headers,
                json={
                    "title": pr_title,
                    "body": pr_body,
                    "head": branch_name,
                    "base": base_branch,
                },
            )
            if pr_resp.status_code not in (200, 201):
                _raise_github_error(pr_resp, "creating Pull Request")
            pr_data = pr_resp.json()

        return {
            "owner_repo": f"{owner}/{repo}",
            "branch": branch_name,
            "base_branch": base_branch,
            "pr_number": pr_data.get("number"),
            "pr_url": pr_data.get("html_url"),
            "commit_sha": commit_sha,
            "files_changed": committed_files,
        }


github_pr_service = GitHubPRService()
