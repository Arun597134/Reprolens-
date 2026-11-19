import asyncio
import sys
import unittest
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.sanitization import sanitizer
from app.services.ai_investigator import ai_investigator
from app.services.test_generator import test_generator
from app.services.reproduction_engine import reproduction_engine
from app.main import app

class TestReproLensCoreServices(unittest.TestCase):

    def test_privacy_sanitizer_luhn_credit_cards(self):
        valid_card = "4242 4242 4242 4242"
        text = f"User typed card number {valid_card} in checkout."
        sanitized = sanitizer.sanitize_string(text)
        self.assertNotIn("4242", sanitized)
        self.assertIn("[REDACTED]", sanitized)

    def test_privacy_sanitizer_emails_and_jwt(self):
        email = "arun.kumar@gmail.com"
        jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        raw_dict = {
            "user_email": email,
            "access_token": jwt_token,
            "password": "superSecretPassword123!",
            "public_id": "cust_9921",
            "profile_url": f"https://example.com/callback?token={jwt_token}&user=arun"
        }
        res = sanitizer.sanitize_data(raw_dict)
        self.assertEqual(res["password"], "[REDACTED]")
        self.assertEqual(res["access_token"], "[REDACTED]")
        self.assertEqual(res["user_email"], "[REDACTED]")
        self.assertEqual(res["public_id"], "cust_9921")
        self.assertNotIn("superSecretPassword", str(res))

    def test_privacy_sanitizer_query_parameters(self):
        url = "https://shopnow.com/checkout?token=secret123&session=99283&product_id=4"
        clean_url = sanitizer.sanitize_url(url)
        self.assertNotIn("secret123", clean_url)
        self.assertIn("product_id=4", clean_url)

    def test_ai_investigator_root_cause_analysis(self):
        bug_report = {
            "title": "Payment Button Failure",
            "error_message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')",
            "error_type": "TypeError",
            "url": "http://localhost:3000/checkout"
        }
        events = [
            {"event_type": "navigation", "timestamp_offset_ms": 0, "payload": {"url": "http://localhost:3000/checkout"}},
            {"event_type": "click", "timestamp_offset_ms": 14000, "payload": {"text": "Pay Now", "selector": "#btn-pay"}},
            {"event_type": "network_request", "timestamp_offset_ms": 15000, "payload": {"method": "POST", "url": "/api/payment", "status": 500}},
            {"event_type": "js_exception", "timestamp_offset_ms": 15200, "payload": {"message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')"}}
        ]

        result = ai_investigator.investigate(
            bug_report=bug_report,
            session_events=events,
            use_external_llm=False
        )

        self.assertIn("observed_facts", result)
        self.assertIn("inferred_explanations", result)
        self.assertIn("unverified_hypotheses", result)
        self.assertIn("fix_recommendations", result)
        self.assertGreater(result["confidence_score"], 0.8)

        # Verify strict 4-tier separation
        self.assertTrue(any("HTTP 500" in f for f in result["observed_facts"]))
        self.assertTrue(any("transactionId" in inf or "contract" in inf for inf in result["inferred_explanations"]))
        self.assertIn("diff", result["fix_recommendations"][0])

    def test_regression_test_generator(self):
        bug_report = {
            "title": "Checkout Payment Failure",
            "error_message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')",
            "url": "http://localhost:3000/checkout"
        }
        events = [
            {"event_type": "click", "payload": {"text": "Pay Now", "selector": "#btn-pay-now"}},
            {"event_type": "network_request", "payload": {"url": "/api/payment", "status": 500, "method": "POST"}}
        ]

        gen = test_generator.generate_playwright_test(bug_report, events)
        test_code = gen["test_code"]

        self.assertIn("import { test, expect } from \"@playwright/test\";", test_code)
        self.assertIn("page.route", test_code)
        self.assertIn("/api/payment", test_code)
        self.assertIn("Pay Now", test_code)
        self.assertIn("toBeVisible", test_code)

    def test_ci_workflow_generation(self):
        yaml = test_generator.generate_ci_workflow("checkout-regression.spec.ts")
        self.assertIn("name: ReproLens Regression Suite", yaml)
        self.assertIn("playwright test", yaml)

    def test_silent_ux_rage_click_investigation(self):
        bug_report = {
            "title": "Silent UX Anomaly: RageClickAnomaly on Pay Now",
            "error_message": "User clicked Pay Now 4 times in 900ms with zero feedback",
            "error_type": "RageClickAnomaly",
            "url": "https://example.com/checkout",
        }
        events = [
            {"event_type": "rage_click", "timestamp_offset_ms": 2100, "payload": {"text": "Pay Now", "selector": "#pay-btn", "click_count": 4, "window_ms": 900}},
            {"event_type": "dead_click", "timestamp_offset_ms": 3400, "payload": {"text": "Submit", "selector": "#submit-btn"}},
        ]
        result = ai_investigator.investigate(bug_report=bug_report, session_events=events, use_external_llm=False)
        self.assertGreater(result["confidence_score"], 0.7)
        self.assertTrue(any("rage-click" in f.lower() or "silent ux freeze" in f.lower() for f in result["observed_facts"]))
        self.assertTrue(len(result["fix_recommendations"]) > 0)

    def test_dual_reality_runtime_patch_synthesis(self):
        patch_js = reproduction_engine._build_runtime_patch(
            {"error_type": "TypeError", "error_message": "Cannot read properties of undefined"},
            [{"url": "/api/payment", "status": 500}],
        )
        self.assertIn("__REPROLENS_RUNTIME_PATCH__", patch_js)
        self.assertIn("reprolens-patch-recovery-banner", patch_js)
        self.assertIn("X-ReproLens-Circuit-Breaker", patch_js)
        self.assertIn("unhandledrejection", patch_js)

    def test_api_routes_and_extension_package(self):
        import zipfile

        route_paths = set(app.openapi().get("paths", {}).keys())
        self.assertIn("/api/v1/reproductions/verify-fix", route_paths)
        self.assertIn("/api/v1/reproductions/trigger", route_paths)
        self.assertIn("/api/v1/reproductions/chaos-matrix", route_paths)
        self.assertIn("/api/v1/investigations/vision-audit", route_paths)
        self.assertIn("/api/v1/github/discover-repos", route_paths)
        self.assertIn("/api/v1/github/list-files", route_paths)
        self.assertIn("/api/v1/webhooks/github", route_paths)
        self.assertIn("/api/v1/alerts/test", route_paths)
        self.assertIn("/api/v1/github/workflow-spec", route_paths)
        self.assertIn("/api/v1/github/preview-patch", route_paths)
        self.assertIn("/api/v1/github/create-pr", route_paths)
        self.assertIn("/api/v1/projects/{project_id}", route_paths)
        self.assertIn("/download/extension.zip", route_paths)

        zip_path = Path(__file__).resolve().parent.parent / "storage" / "reprolens-extension-v1.0.0.zip"
        self.assertTrue(zip_path.exists())
        with zipfile.ZipFile(zip_path) as zf:
            names = set(zf.namelist())
            for required in ("manifest.json", "main_world.js", "content.js", "background.js", "popup.html", "popup.js"):
                self.assertIn(required, names)

    def test_vision_audit_offline_heuristic_fallback(self):
        import tempfile
        from unittest.mock import patch
        from app.core.config import settings

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(b"\x89PNG\r\n\x1a\n" + b"\x00" * 128)
            tmp_path = Path(tmp.name)

        try:
            with patch.object(settings, "GEMINI_API_KEY", ""):
                result = ai_investigator.audit_screenshot_vision(
                    screenshot_path=tmp_path,
                    bug_report={
                        "title": "Checkout UI Blank Crash",
                        "error_type": "TypeError",
                        "error_message": "Cannot read properties of undefined",
                        "url": "http://localhost:3000/checkout",
                    },
                )
            self.assertEqual(result["visual_verdict"], "UI_BROKEN")
            self.assertEqual(result["model_used"], "ReproLens Heuristic Visual Fallback")
            self.assertGreaterEqual(len(result["ui_anomalies"]), 2)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_reprolens_mcp_server_protocol(self):
        import json
        import reprolens_mcp

        init_resp = reprolens_mcp.handle_jsonrpc_request(
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
        )
        self.assertEqual(init_resp["result"]["serverInfo"]["name"], "reprolens-mcp")

        tools_resp = reprolens_mcp.handle_jsonrpc_request(
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}
        )
        tool_names = {t["name"] for t in tools_resp["result"]["tools"]}
        self.assertEqual(
            tool_names,
            {"list_bugs", "get_bug_dossier", "verify_fix_dual_reality", "run_chaos_matrix"},
        )

        call_resp = reprolens_mcp.handle_jsonrpc_request(
            {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": "list_bugs", "arguments": {"limit": 5}},
            }
        )
        self.assertFalse(call_resp["result"].get("isError", False))
        bugs_payload = json.loads(call_resp["result"]["content"][0]["text"])
        self.assertIn("bugs", bugs_payload)
        self.assertIsInstance(bugs_payload["bugs"], list)

    def test_semantic_click_context_observed_facts(self):
        result = ai_investigator.investigate(
            bug_report={
                "title": "Like API Timeout",
                "error_type": "NetworkError",
                "error_message": "POST /api/like returned HTTP 500",
                "url": "https://www.instagram.com/",
            },
            session_events=[
                {
                    "timestamp_offset_ms": 12700,
                    "event_type": "click",
                    "payload": {
                        "tag": "div",
                        "selector": "div#mount_0_0_l6 > div > svg",
                        "text": "Like",
                        "action_label": "Like",
                        "entity_author": "@nasa",
                        "entity_title": "Artemis launch pad rollout",
                        "entity_url": "/p/C9xyz123/",
                        "semantic_summary": 'Clicked "Like" on post by @nasa ("Artemis launch pad rollout") (/p/C9xyz123/)',
                    },
                }
            ],
            session_meta={},
            use_external_llm=False,
        )
        facts_joined = " ".join(result["observed_facts"])
        self.assertIn('Clicked "Like" on post by @nasa', facts_joined)
        self.assertIn("/p/C9xyz123/", facts_joined)
        self.assertNotIn("div#mount_0_0_l6", facts_joined)

    def test_windows_playwright_proactor_loop_wrapper(self):
        from unittest.mock import patch
        from app.services.reproduction_engine import run_with_playwright_loop

        def _drive_sync(coro):
            try:
                coro.send(None)
            except StopIteration as stop:
                return stop.value
            raise AssertionError("Expected coroutine to complete without suspending on real I/O")

        class FakeNonProactorLoop:
            pass

        class FakeProactorLoop:
            def run_until_complete(self, coro):
                return _drive_sync(coro)

            def close(self):
                pass

        async def _check():
            return "playwright-ok"

        async def _fake_to_thread(fn, *args, **kwargs):
            return fn(*args, **kwargs)

        with patch("app.services.reproduction_engine.asyncio.get_running_loop", return_value=FakeNonProactorLoop()), \
             patch("app.services.reproduction_engine.asyncio.ProactorEventLoop", FakeProactorLoop, create=True), \
             patch("app.services.reproduction_engine.asyncio.set_event_loop", lambda *_a, **_kw: None), \
             patch("app.services.reproduction_engine.asyncio.to_thread", side_effect=_fake_to_thread), \
             patch("app.services.reproduction_engine.sys.platform", "win32"):
            result = _drive_sync(run_with_playwright_loop(_check))
            self.assertEqual(result, "playwright-ok")

    def test_github_pr_service_ranking_diff_and_pr_flow(self):
        from unittest.mock import patch, MagicMock
        from app.services.github_pr_service import (
            github_pr_service,
            parse_owner_repo,
            rank_candidate_files,
            generate_unified_diff,
        )

        self.assertEqual(parse_owner_repo("arun/portfolio"), ("arun", "portfolio"))
        self.assertEqual(parse_owner_repo("https://github.com/arun/portfolio.git"), ("arun", "portfolio"))

        ranked = rank_candidate_files(
            [
                "node_modules/react/index.js",
                "README.md",
                "src/components/Navbar.tsx",
                "src/pages/CheckoutPage.tsx",
            ],
            bug_report={
                "stack_trace": "TypeError at CheckoutPage.tsx:42",
                "url": "https://example.com/checkout",
            },
            investigation={"fix_recommendations": [{"file": "CheckoutPage.tsx"}]},
        )
        self.assertEqual(ranked[0], "src/pages/CheckoutPage.tsx")
        self.assertNotIn("node_modules/react/index.js", ranked)

        diff = generate_unified_diff("const a = 1;\n", "const a = 2;\n", "src/App.tsx")
        self.assertIn("-const a = 1;", diff)
        self.assertIn("+const a = 2;", diff)

        fake_client = MagicMock()
        fake_client.__enter__.return_value = fake_client
        fake_client.__exit__.return_value = None

        def _resp(status_code, data):
            r = MagicMock()
            r.status_code = status_code
            r.json.return_value = data
            return r

        fake_client.get.side_effect = [
            _resp(200, {"object": {"sha": "base_sha_123"}}),
            _resp(200, {"sha": "file_sha_456"}),
            _resp(404, {}),
        ]
        fake_client.post.side_effect = [
            _resp(201, {"ref": "refs/heads/reprolens/fix-1234"}),
            _resp(201, {"number": 7, "html_url": "https://github.com/arun/portfolio/pull/7"}),
        ]
        fake_client.put.side_effect = [
            _resp(200, {"commit": {"sha": "commit_sha_789"}}),
            _resp(201, {"commit": {"sha": "test_sha_999"}}),
        ]

        with patch("app.services.github_pr_service.httpx.Client", return_value=fake_client):
            pr_res = github_pr_service.create_fix_pull_request(
                owner_repo="arun/portfolio",
                token="ghp_test",
                base_branch="main",
                file_path="src/App.tsx",
                patched_content="const a = 2;\n",
                commit_message="fix: guard value",
                pr_title="fix: portfolio crash",
                pr_body="Automated fix",
                bug_id="12345678-aaaa",
                test_file_path="tests/reprolens-12345678.spec.ts",
                test_code="test('ok', async () => {});",
            )
        self.assertEqual(pr_res["pr_number"], 7)
        self.assertEqual(pr_res["pr_url"], "https://github.com/arun/portfolio/pull/7")
        self.assertEqual(pr_res["files_changed"], ["src/App.tsx", "tests/reprolens-12345678.spec.ts"])

    def test_ownership_detector_and_repo_discovery(self):
        from types import SimpleNamespace
        from unittest.mock import patch
        from app.services.ownership_detector import (
            classify_bug_ownership,
            select_target_project,
            urls_same_app,
        )
        from app.services.github_pr_service import GitHubPRService

        self.assertTrue(urls_same_app("https://www.arun-m-portfolio.vercel.app/", "https://arun-m-portfolio.vercel.app/#projects"))
        self.assertFalse(urls_same_app("http://localhost:5173/", "http://localhost:3000/"))

        portfolio_proj = SimpleNamespace(
            id="proj-portfolio",
            name="Arun Portfolio",
            website_url="https://arun-m-portfolio.vercel.app",
            redaction_config={"project_mode": "own_repo", "github_repo": "arun/portfolio", "github_branch": "main"},
        )
        external_proj = SimpleNamespace(
            id="proj-external",
            name="External & Active Apps",
            website_url="https://external-apps.monitor",
            redaction_config={"project_mode": "external_monitor"},
        )

        # 1. Host mismatch guard: v0.app error inside portfolio project must be flagged external
        mismatch = classify_bug_ownership(
            bug_url="https://v0.app/chat/123",
            project_website_url=portfolio_proj.website_url,
            redaction_config=portfolio_proj.redaction_config,
            source="chrome_extension",
        )
        self.assertEqual(mismatch["ownership"], "external_app")
        self.assertFalse(mismatch["can_push_pr"])
        self.assertIn("Host mismatch", mismatch["reason"])

        # 2. Matching domain + own repo => own project
        own_match = classify_bug_ownership(
            bug_url="https://arun-m-portfolio.vercel.app/projects",
            project_website_url=portfolio_proj.website_url,
            redaction_config=portfolio_proj.redaction_config,
            source="chrome_extension",
        )
        self.assertEqual(own_match["ownership"], "own_project")
        self.assertTrue(own_match["can_push_pr"])

        # 3. Embedded Web SDK source or localhost dev server => own project
        sdk_res = classify_bug_ownership(
            bug_url="https://app.custom-domain.dev/checkout",
            project_website_url="https://external-apps.monitor",
            redaction_config={"project_mode": "external_monitor"},
            source="web_sdk",
        )
        self.assertEqual(sdk_res["ownership"], "own_project")
        self.assertTrue(sdk_res["can_push_pr"])

        local_res = classify_bug_ownership(
            bug_url="http://localhost:5173/dashboard",
            project_website_url="https://arun-m-portfolio.vercel.app",
            redaction_config={"project_mode": "own_repo", "github_repo": "arun/portfolio"},
            source="chrome_extension",
        )
        self.assertEqual(local_res["ownership"], "own_project")
        self.assertTrue(local_res["can_push_pr"])

        # 4. select_target_project routes v0.app to external monitor & portfolio URL to portfolio_proj
        all_projects = [portfolio_proj, external_proj]
        routed_ext, ext_verdict = select_target_project(
            default_project=portfolio_proj,
            all_projects=all_projects,
            payload_url="https://v0.app/arun/chat",
            source="chrome_extension",
        )
        self.assertEqual(routed_ext.id, "proj-external")
        self.assertEqual(ext_verdict["ownership"], "external_app")
        self.assertFalse(ext_verdict["can_push_pr"])

        routed_own, own_verdict = select_target_project(
            default_project=external_proj,
            all_projects=all_projects,
            payload_url="https://arun-m-portfolio.vercel.app/#contact",
            source="chrome_extension",
        )
        self.assertEqual(routed_own.id, "proj-portfolio")
        self.assertEqual(own_verdict["ownership"], "own_project")
        self.assertTrue(own_verdict["can_push_pr"])

        # 5. discover_user_repos filters writable repos and preserves homepage/default_branch
        class _FakeRepoResp:
            status_code = 200
            text = "ok"

            def json(self):
                return [
                    {
                        "full_name": "arun/portfolio",
                        "name": "portfolio",
                        "default_branch": "main",
                        "homepage": "https://arun-m-portfolio.vercel.app",
                        "html_url": "https://github.com/arun/portfolio",
                        "private": False,
                        "permissions": {"push": True, "pull": True},
                    },
                    {
                        "full_name": "someone/readonly-fork",
                        "name": "readonly-fork",
                        "default_branch": "main",
                        "homepage": "",
                        "html_url": "https://github.com/someone/readonly-fork",
                        "private": False,
                        "permissions": {"push": False, "pull": True},
                    },
                ]

        class _FakeClient:
            def __init__(self, *args, **kwargs):
                pass

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

            def get(self, *args, **kwargs):
                return _FakeRepoResp()

        with patch("app.services.github_pr_service.httpx.Client", _FakeClient):
            repos = GitHubPRService().discover_user_repos("ghp_dummy")
            public_repos = GitHubPRService().discover_public_user_repos("arun")
        self.assertEqual(len(repos), 1)
        self.assertEqual(repos[0]["full_name"], "arun/portfolio")
        self.assertEqual(repos[0]["homepage"], "https://arun-m-portfolio.vercel.app")
        self.assertEqual(len(public_repos), 2)
        self.assertEqual(public_repos[0]["full_name"], "arun/portfolio")

    def test_alert_dispatcher_and_github_webhook_parser(self):
        from unittest.mock import patch
        from types import SimpleNamespace
        from app.services.alert_dispatcher import send_slack_alert, send_discord_alert
        from app.api.webhooks import _find_bug_id_in_pr_payload, get_ci_workflow_spec

        # 1. Test PR payload bug ID parser
        body_pr = {"body": "Fixes issue\nReproLens Automated Bug Resolution (`12345678-aaaa-bbbb-cccc-111122223333`)\n"}
        self.assertEqual(_find_bug_id_in_pr_payload(body_pr), "12345678-aaaa-bbbb-cccc-111122223333")

        branch_pr = {"head": {"ref": "reprolens/fix-87654321"}}
        self.assertEqual(_find_bug_id_in_pr_payload(branch_pr), "87654321")

        title_pr = {"title": "fix(abcdef12): resolve TypeError on /checkout"}
        self.assertEqual(_find_bug_id_in_pr_payload(title_pr), "abcdef12")

        # 2. Test Slack & Discord alert dispatcher
        class _MockResp:
            status_code = 200
            text = "ok"

        class _MockClient:
            def __init__(self, *args, **kwargs):
                pass
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc, tb):
                return False
            def post(self, url, json=None, **kwargs):
                return _MockResp()

        sample_bug = {
            "id": "bug-12345678",
            "title": "TypeError: Cannot read properties of undefined",
            "error_type": "TypeError",
            "severity": "critical",
            "url": "https://arun-m-portfolio.vercel.app",
            "error_message": "Crash on render",
        }

        with patch("app.services.alert_dispatcher.httpx.Client", _MockClient):
            slack_res = send_slack_alert("https://hooks.slack.com/services/xxx", sample_bug)
            self.assertTrue(slack_res["success"])

            discord_res = send_discord_alert("https://discord.com/api/webhooks/xxx", sample_bug)
            self.assertTrue(discord_res["success"])

        # 3. Test CI workflow generator
        ci_spec = get_ci_workflow_spec()
        self.assertEqual(ci_spec["filename"], ".github/workflows/reprolens-ci.yml")
        self.assertIn("playwright test", ci_spec["yaml_content"])


if __name__ == "__main__":
    unittest.main()
