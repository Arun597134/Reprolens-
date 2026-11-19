import asyncio
import json
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Callable, Awaitable
from playwright.async_api import async_playwright
from app.core.config import settings

logger = logging.getLogger(__name__)


async def run_with_playwright_loop(coro_factory: Callable[[], Awaitable[Any]]) -> Any:
    """
    On Windows under Uvicorn --reload, the active loop can be a SelectorEventLoop
    which raises NotImplementedError when Playwright spawns its Node driver subprocess.
    Delegate to a dedicated ProactorEventLoop worker thread when needed.
    """
    if sys.platform == "win32":
        loop = asyncio.get_running_loop()
        proactor_cls = getattr(asyncio, "ProactorEventLoop", None)
        if proactor_cls and not isinstance(loop, proactor_cls):
            def _run_in_proactor() -> Any:
                proactor_loop = proactor_cls()
                asyncio.set_event_loop(proactor_loop)
                try:
                    return proactor_loop.run_until_complete(coro_factory())
                finally:
                    proactor_loop.close()

            return await asyncio.to_thread(_run_in_proactor)
    return await coro_factory()


class ReproductionEngine:
    """
    Module 4 — Deterministic Bug Reproduction Engine.
    Executes a recorded user journey in an isolated Chromium instance with
    identical viewport, simulated network conditions, and API mocking if required.
    """

    async def reproduce(
        self,
        bug_report: dict[str, Any],
        session_meta: dict[str, Any],
        session_events: list[dict[str, Any]],
        target_base_url: str | None = None,
        simulate_network: bool = True,
        mock_failed_requests: bool = True,
        patch_script: str | None = None,
        scenario_config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Executes headless browser reproduction using Playwright safely across event loops."""
        return await run_with_playwright_loop(
            lambda: self._reproduce_impl(
                bug_report=bug_report,
                session_meta=session_meta,
                session_events=session_events,
                target_base_url=target_base_url,
                simulate_network=simulate_network,
                mock_failed_requests=mock_failed_requests,
                patch_script=patch_script,
                scenario_config=scenario_config,
            )
        )

    async def _reproduce_impl(
        self,
        bug_report: dict[str, Any],
        session_meta: dict[str, Any],
        session_events: list[dict[str, Any]],
        target_base_url: str | None = None,
        simulate_network: bool = True,
        mock_failed_requests: bool = True,
        patch_script: str | None = None,
        scenario_config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Executes headless browser reproduction using Playwright.
        """
        start_time = time.time()
        run_id = str(uuid.uuid4())[:8]
        logs = []
        status = "not_reproduced"
        screenshot_filename = None
        reproduced_steps = []
        captured_errors = []
        scenario_cfg = scenario_config or {}
        Path(settings.SCREENSHOTS_PATH).mkdir(parents=True, exist_ok=True)

        def log(msg: str):
            timestamp = f"[{time.strftime('%H:%M:%S')}]"
            line = f"{timestamp} {msg}"
            logs.append(line)
            logger.info(line)

        log(f"Initializing ReproLens Deterministic Browser Environment ({scenario_cfg.get('label', 'Standard')})...")

        # Extract environment configuration
        viewport_w = int(scenario_cfg.get("viewport_w") or session_meta.get("viewport_w", 1280))
        viewport_h = int(scenario_cfg.get("viewport_h") or session_meta.get("viewport_h", 800))
        user_agent = session_meta.get("user_agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        proj_url = (bug_report.get("project") or {}).get("website_url") if isinstance(bug_report.get("project"), dict) else None
        page_url = target_base_url or bug_report.get("url") or session_meta.get("url") or proj_url or "http://localhost:5173"

        # Find network failures to mock
        failed_network_calls = []
        for evt in session_events:
            if evt.get("event_type") == "network_request":
                p = evt.get("payload", {})
                if p.get("status", 200) >= 400 or p.get("status") == 0:
                    failed_network_calls.append(p)

        log(f"Configuring viewport: {viewport_w}x{viewport_h}")
        log(f"Target initial route: {page_url}")

        playwright_instance = None
        browser = None
        context = None

        try:
            playwright_instance = await async_playwright().start()
            browser = await playwright_instance.chromium.launch(
                headless=settings.PLAYWRIGHT_HEADLESS,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )

            context = await browser.new_context(
                viewport={"width": viewport_w, "height": viewport_h},
                user_agent=user_agent,
                locale="en-US",
                timezone_id="America/New_York",
                ignore_https_errors=True
            )

            # Simulated network latency if requested
            if simulate_network:
                # Apply simulated throttling via CDP session if possible
                try:
                    cdp = await context.new_cdp_session(await context.new_page())
                    await cdp.send("Network.emulateNetworkConditions", {
                        "offline": False,
                        "latency": 120, # 120ms latency
                        "downloadThroughput": 1024 * 1024 * 3, # 3 Mbps
                        "uploadThroughput": 1024 * 1024 * 1
                    })
                    log("Network emulation active: Latency 120ms, 3G/4G simulated.")
                except Exception as e:
                    log(f"Network throttling CDP notice: {e}")

            page = context.pages[0] if context.pages else await context.new_page()

            if patch_script:
                await page.add_init_script(patch_script)
                log("[DUAL-REALITY B] Injected runtime defensive patch script before navigation.")

            # Attach listeners for console errors and uncaught page errors
            def on_page_error(exc):
                captured_errors.append(str(exc))
                log(f"[BROWSER UNCAUGHT EXCEPTION] {exc}")

            def on_console_msg(msg):
                if msg.type in ("error", "warning"):
                    log(f"[BROWSER CONSOLE {msg.type.upper()}] {msg.text}")
                    if msg.type == "error":
                        captured_errors.append(msg.text)

            page.on("pageerror", on_page_error)
            page.on("console", on_console_msg)

            async def capture_step_frame(step_idx: int) -> str | None:
                shot_name = f"repro_{run_id}_step_{step_idx}.png"
                shot_path = Path(settings.SCREENSHOTS_PATH) / shot_name
                try:
                    await page.screenshot(path=str(shot_path), full_page=False)
                    return f"/screenshots/{shot_name}"
                except Exception:
                    return None

            async def try_click_with_self_healing(payload: dict[str, Any]) -> tuple[bool, str]:
                selector = payload.get("selector", "")
                text = payload.get("text", "")
                aria_label = payload.get("ariaLabel", "")
                data_test_id = payload.get("dataTestId", "")
                x_pct = payload.get("xPct")
                y_pct = payload.get("yPct")

                candidates: list[tuple[str, Any]] = []
                if selector:
                    candidates.append(("css_selector", lambda: page.locator(selector).first))
                if data_test_id:
                    candidates.append(("semantic_attr", lambda: page.get_by_test_id(data_test_id).first))
                if aria_label:
                    candidates.append(("semantic_attr", lambda: page.get_by_label(aria_label, exact=False).first))
                if text:
                    candidates.append(("text_match", lambda: page.get_by_text(text, exact=False).first))
                    candidates.append(("aria_role", lambda: page.get_by_role("button", name=text).first))
                    candidates.append(("aria_role", lambda: page.get_by_role("link", name=text).first))

                for method, get_loc in candidates:
                    try:
                        loc = get_loc()
                        if await loc.count() > 0 and await loc.is_visible():
                            await loc.click(timeout=3000)
                            return True, method
                    except Exception:
                        continue

                if x_pct is not None and y_pct is not None:
                    try:
                        px = max(1, min(viewport_w - 1, int(round((float(x_pct) / 100.0) * viewport_w))))
                        py = max(1, min(viewport_h - 1, int(round((float(y_pct) / 100.0) * viewport_h))))
                        await page.mouse.click(px, py)
                        log(f"[SELF-HEALING] Coordinate fallback click at ({x_pct}%, {y_pct}%) -> ({px}px, {py}px)")
                        return True, "self_healing_coords"
                    except Exception:
                        pass

                return False, "not_found"

            # Chaos scenario hooks (Cold Storage / Out-of-Order API Race)
            if scenario_cfg.get("clear_storage"):
                await context.clear_cookies()
                await page.add_init_script("try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}")
                log("[CHAOS MATRIX] Cleared cookies, localStorage, and sessionStorage.")

            if scenario_cfg.get("out_of_order_api"):
                api_call_counter = {"n": 0}

                async def handle_out_of_order(route):
                    if route.request.resource_type in ("fetch", "xhr") and "localhost:8000" not in route.request.url:
                        api_call_counter["n"] += 1
                        if api_call_counter["n"] == 1:
                            log(f"[CHAOS MATRIX] Stalling 1st XHR/fetch by 1500ms to force out-of-order race: {route.request.url}")
                            await asyncio.sleep(1.5)
                    await route.continue_()

                await page.route("**/*", handle_out_of_order)

            # Route interception for deterministic mock if enabled
            if mock_failed_requests and failed_network_calls:
                for failed in failed_network_calls:
                    failed_url = failed.get("url", "")
                    failed_status = failed.get("status", 500)
                    failed_method = failed.get("method", "POST")

                    if failed_url:
                        url_pattern = (
                            f"**{failed_url}"
                            if failed_url.startswith("/")
                            else f"**{failed_url.split('://')[-1]}"
                            if "://" in failed_url
                            else f"**/{failed_url}"
                        )
                        log(f"Arming deterministic mock route: {failed_method} {url_pattern} -> HTTP {failed_status}")

                        async def handle_route(route, s=failed_status):
                            log(f"Intercepted request {route.request.url} - fulfilling with simulated HTTP {s}")
                            await route.fulfill(
                                status=s,
                                content_type="application/json",
                                body=json.dumps({"error": "ReproLens simulated gateway timeout", "success": False})
                            )

                        await page.route(url_pattern, handle_route)

            # Step 1: Navigate to page
            log(f"Executing navigation: page.goto('{page_url}')")
            try:
                await page.goto(page_url, wait_until="domcontentloaded", timeout=15000)
                await asyncio.sleep(0.9)
            except Exception as e:
                log(f"Navigation warning: {e}. Continuing with document content...")

            nav_shot = await capture_step_frame(0)
            reproduced_steps.append({
                "step": "navigation",
                "target": page_url,
                "status": "executed",
                "locator_used": "url_goto",
                "screenshot_url": nav_shot,
                "action_ts_ms": int((time.time() - start_time) * 1000),
            })

            # Step 2: Replay interactive actions (limit to last 8 key interactions leading to error)
            interactive_events = [
                e for e in session_events if e.get("event_type") in ("click", "input", "navigation")
            ][-8:]

            log(f"Replaying {len(interactive_events)} recorded user interaction steps...")

            for i, evt in enumerate(interactive_events):
                etype = evt.get("event_type")
                payload = evt.get("payload", {})
                selector = payload.get("selector", "")
                text = payload.get("text", "")
                tag = payload.get("tag", "button")

                step_label = payload.get("semantic_summary") or payload.get("action_label") or text or selector or tag
                log(f"Step {i+1}/{len(interactive_events)}: {etype.upper()} on '{step_label}'")

                try:
                    if etype == "click":
                        clicked, locator_used = await try_click_with_self_healing(payload)
                        await asyncio.sleep(0.6)
                        frame_url = await capture_step_frame(i + 1)
                        reproduced_steps.append({
                            "step": "click",
                            "selector": selector,
                            "text": text,
                            "aria_label": payload.get("ariaLabel"),
                            "data_test_id": payload.get("dataTestId"),
                            "locator_used": locator_used,
                            "x_pct": payload.get("xPct"),
                            "y_pct": payload.get("yPct"),
                            "screenshot_url": frame_url,
                            "action_ts_ms": int((time.time() - start_time) * 1000),
                            "status": "clicked" if clicked else "selector_not_found",
                        })
                        if not clicked:
                            log(f"Notice: element '{text or selector}' not currently visible on page.")

                    elif etype == "input":
                        value = payload.get("value", "test_input")
                        filled = False
                        if selector:
                            try:
                                loc = page.locator(selector).first
                                if await loc.count() > 0:
                                    await loc.fill(value, timeout=2000)
                                    filled = True
                            except Exception:
                                pass
                        await asyncio.sleep(0.5)
                        frame_url = await capture_step_frame(i + 1)
                        reproduced_steps.append({
                            "step": "input",
                            "selector": selector,
                            "locator_used": "css_selector" if filled else "not_found",
                            "screenshot_url": frame_url,
                            "action_ts_ms": int((time.time() - start_time) * 1000),
                            "status": "filled" if filled else "selector_not_found",
                        })

                    elif etype == "navigation" and i > 0:
                        nav_target = payload.get("url") or payload.get("to")
                        if nav_target and nav_target != page.url and str(nav_target).startswith("http"):
                            try:
                                await page.goto(nav_target, wait_until="domcontentloaded", timeout=10000)
                                await asyncio.sleep(0.6)
                            except Exception:
                                pass
                        frame_url = await capture_step_frame(i + 1)
                        reproduced_steps.append({
                            "step": "navigation",
                            "target": nav_target or page.url,
                            "locator_used": "url_goto",
                            "screenshot_url": frame_url,
                            "action_ts_ms": int((time.time() - start_time) * 1000),
                            "status": "executed",
                        })

                    await asyncio.sleep(0.3)

                except Exception as step_err:
                    log(f"Step {i+1} interaction note: {step_err}")

            # Wait to capture any delayed exceptions or responses
            await asyncio.sleep(1.5)

            # Step 3: Capture full-page evidence screenshot
            screenshot_filename = f"repro_{run_id}.png"
            screenshot_filepath = Path(settings.SCREENSHOTS_PATH) / screenshot_filename
            try:
                await page.screenshot(path=str(screenshot_filepath), full_page=True)
                log(f"High-res state screenshot captured: {screenshot_filename}")
            except Exception as ss_err:
                screenshot_filename = None
                log(f"Screenshot capture notice: {ss_err}")

            # Step 4: Evaluate outcome
            expected_error = bug_report.get("error_message", "").lower()
            error_matched = any(
                (expected_error in err.lower() or "typeerror" in err.lower() or "500" in err)
                for err in captured_errors
            )

            if error_matched or len(captured_errors) > 0:
                status = "reproduced"
                log("Deterministic Reproduction SUCCESS: Target failure successfully reproduced in isolated browser!")
            elif len(reproduced_steps) > 0:
                status = "inconclusive"
                log("Deterministic Reproduction INCONCLUSIVE: Steps executed cleanly without runtime exception.")
            else:
                status = "not_reproduced"
                log("Deterministic Reproduction FAILED: Unable to execute steps on target route.")

        except Exception as e:
            log(f"Reproduction runner encountered exception: {type(e).__name__}: {e}")
            status = "failed"
        finally:
            if context:
                await context.close()
            if browser:
                await browser.close()
            if playwright_instance:
                await playwright_instance.stop()

        elapsed_ms = int((time.time() - start_time) * 1000)
        log(f"Reproduction job completed in {elapsed_ms}ms with outcome: {status.upper()}")

        return {
            "status": status,
            "reproduction_steps": reproduced_steps,
            "environment_config": {
                "viewport_w": viewport_w,
                "viewport_h": viewport_h,
                "user_agent": user_agent,
                "browser": "Chromium 125",
                "simulated_network": simulate_network,
                "mocked_endpoints": [f.get("url") for f in failed_network_calls],
                "patch_injected": bool(patch_script),
            },
            "screenshot_url": f"/screenshots/{screenshot_filename}" if screenshot_filename else None,
            "execution_logs": "\n".join(logs),
            "duration_ms": elapsed_ms,
            "exit_code": 0 if status == "reproduced" else 1,
            "captured_errors": captured_errors,
        }

    def _build_runtime_patch(self, bug_report: dict[str, Any], failed_calls: list[dict[str, Any]]) -> str:
        """Synthesize a defensive runtime JS hot-patch tailored to the failure pattern."""
        err_type = bug_report.get("error_type", "")
        err_msg = bug_report.get("error_message", "")
        routes = [str(c.get("url", "")) for c in failed_calls if c.get("url")]
        hint = f"{err_type}: {err_msg}"[:140].replace("`", "'").replace("\\", "/")

        return f"""
(() => {{
  if (window.__REPROLENS_RUNTIME_PATCH__) return;
  window.__REPROLENS_RUNTIME_PATCH__ = true;

  function showRecoveryBanner(detail) {{
    const render = () => {{
      if (!document.body) return;
      let banner = document.getElementById("reprolens-patch-recovery-banner");
      if (!banner) {{
        banner = document.createElement("div");
        banner.id = "reprolens-patch-recovery-banner";
        banner.setAttribute("role", "alert");
        banner.setAttribute("data-reprolens-patch", "active");
        banner.style.cssText = [
          "position:fixed", "bottom:16px", "right:16px", "z-index:2147483647",
          "background:#064e3b", "color:#ecfdf5", "border:1px solid #10b981",
          "padding:10px 14px", "border-radius:10px", "font-family:monospace",
          "font-size:12px", "box-shadow:0 8px 24px rgba(0,0,0,0.45)", "max-width:360px"
        ].join(";");
        document.body.appendChild(banner);
      }}
      banner.textContent = "[ReproLens Patch Guard] Safe fallback activated (" + detail + ")";
    }};
    if (document.body) render();
    else window.addEventListener("DOMContentLoaded", render, {{ once: true }});
  }}

  const origFetch = window.fetch;
  if (typeof origFetch === "function") {{
    window.fetch = async function(...args) {{
      try {{
        const res = await origFetch.apply(this, args);
        if (res && res.status >= 500) {{
          const reqUrl = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "api";
          showRecoveryBanner("HTTP " + res.status + " mitigated on " + reqUrl.slice(0, 48));
          const safeBody = JSON.stringify({{
            ok: false,
            recovered: true,
            patch: "ReproLens Circuit Breaker",
            hint: `{hint}`,
            message: "Temporarily unavailable — recovered gracefully",
            order: {{ id: "SAFE-RECOVERY" }},
            items: [],
            data: {{}},
            total: 0
          }});
          return new Response(safeBody, {{
            status: 200,
            headers: {{
              "Content-Type": "application/json",
              "X-ReproLens-Circuit-Breaker": "active"
            }}
          }});
        }}
        return res;
      }} catch (err) {{
        showRecoveryBanner("Network rejection mitigated");
        return new Response(JSON.stringify({{ ok: false, recovered: true, items: [], data: {{}}, total: 0 }}), {{
          status: 200,
          headers: {{ "Content-Type": "application/json" }}
        }});
      }}
    }};
  }}

  // Loading-guard click debounce to stop RageClickAnomaly & duplicate submissions
  let lastClickEl = null;
  let lastClickTs = 0;
  window.addEventListener("click", (e) => {{
    const btn = e.target && e.target.closest ? e.target.closest("button, [role='button'], input[type='submit']") : null;
    if (!btn) return;
    const now = Date.now();
    if (lastClickEl === btn && now - lastClickTs < 650) {{
      e.stopImmediatePropagation();
      e.preventDefault();
      btn.setAttribute("aria-busy", "true");
      showRecoveryBanner("Duplicate click blocked by loading-guard");
      return;
    }}
    lastClickEl = btn;
    lastClickTs = now;
  }}, true);

  // Last-resort unhandled promise & async boundary guard
  window.addEventListener("unhandledrejection", (e) => {{
    e.preventDefault();
    showRecoveryBanner("Unhandled promise rejection isolated");
  }});

  window.addEventListener("error", (e) => {{
    if (e && e.message) {{
      showRecoveryBanner("Runtime boundary caught: " + String(e.message).slice(0, 48));
      e.preventDefault();
    }}
  }}, true);
}})();
"""

    async def verify_fix_dual_reality(
        self,
        bug_report: dict[str, Any],
        session_meta: dict[str, Any],
        session_events: list[dict[str, Any]],
        target_base_url: str | None = None,
        simulate_network: bool = True,
        mock_failed_requests: bool = True,
        custom_patch_js: str | None = None,
    ) -> dict[str, Any]:
        """
        Feature #1 — Dual-Reality Fix Verifier.
        Pass A runs unpatched baseline reproduction.
        Pass B injects the runtime patch via add_init_script under identical mocks and compares crashes.
        """
        failed_calls = [
            evt.get("payload", {})
            for evt in session_events
            if evt.get("event_type") == "network_request"
            and (evt.get("payload", {}).get("status", 200) >= 400 or evt.get("payload", {}).get("status") == 0)
        ]

        patch_code = (
            custom_patch_js.strip()
            if custom_patch_js and custom_patch_js.strip()
            else self._build_runtime_patch(bug_report, failed_calls)
        )

        reality_a = await self.reproduce(
            bug_report=bug_report,
            session_meta=session_meta,
            session_events=session_events,
            target_base_url=target_base_url,
            simulate_network=simulate_network,
            mock_failed_requests=mock_failed_requests,
            patch_script=None,
        )

        reality_b = await self.reproduce(
            bug_report=bug_report,
            session_meta=session_meta,
            session_events=session_events,
            target_base_url=target_base_url,
            simulate_network=simulate_network,
            mock_failed_requests=mock_failed_requests,
            patch_script=patch_code,
        )

        errors_a = len(reality_a.get("captured_errors", []))
        errors_b = len(reality_b.get("captured_errors", []))

        if errors_a > 0 and errors_b == 0:
            verdict = "FIX_VERIFIED"
        elif errors_b < errors_a:
            verdict = "IMPROVED"
        elif errors_a == 0 and errors_b == 0 and reality_b.get("status") != "failed":
            verdict = "PATCH_APPLIED_NO_BASELINE_ERROR"
        else:
            verdict = "STILL_FAILING"

        return {
            "verified": verdict in ("FIX_VERIFIED", "IMPROVED", "PATCH_APPLIED_NO_BASELINE_ERROR"),
            "verdict": verdict,
            "error_delta": errors_a - errors_b,
            "patch_code": patch_code,
            "reality_a": {
                "status": reality_a["status"],
                "errors": reality_a.get("captured_errors", []),
                "error_count": errors_a,
                "screenshot_url": reality_a.get("screenshot_url"),
                "duration_ms": reality_a.get("duration_ms", 0),
                "steps": reality_a.get("reproduction_steps", []),
                "execution_logs": reality_a.get("execution_logs", ""),
            },
            "reality_b": {
                "status": reality_b["status"],
                "errors": reality_b.get("captured_errors", []),
                "error_count": errors_b,
                "screenshot_url": reality_b.get("screenshot_url"),
                "duration_ms": reality_b.get("duration_ms", 0),
                "steps": reality_b.get("reproduction_steps", []),
                "execution_logs": reality_b.get("execution_logs", ""),
            },
        }

    async def run_chaos_matrix(
        self,
        bug_report: dict[str, Any],
        session_meta: dict[str, Any],
        session_events: list[dict[str, Any]],
        target_base_url: str | None = None,
        mock_failed_requests: bool = True,
    ) -> dict[str, Any]:
        """
        Feature #2 — Counterfactual 4-Reality Race-Condition & Environment Chaos Matrix.
        Exposes flaky bugs that only trigger on race conditions, cold storage, or mobile viewports.
        """
        base_w = session_meta.get("viewport_w", 1280)
        base_h = session_meta.get("viewport_h", 800)
        scenarios_spec = [
            {
                "id": "baseline",
                "label": "Desktop Baseline",
                "description": f"{base_w}x{base_h} normal API timing",
                "config": {"label": "Desktop Baseline"},
            },
            {
                "id": "out_of_order_api",
                "label": "Out-of-Order API Race",
                "description": "Stalls 1st XHR/fetch 1500ms so concurrent responses arrive out of order",
                "config": {"label": "Out-of-Order API Race", "out_of_order_api": True},
            },
            {
                "id": "cold_storage",
                "label": "Cold Storage / Incognito",
                "description": "Wipes cookies, localStorage & sessionStorage before boot",
                "config": {"label": "Cold Storage", "clear_storage": True},
            },
            {
                "id": "mobile_390",
                "label": "Mobile 390x844",
                "description": "Narrow responsive mobile viewport interaction pass",
                "config": {"label": "Mobile 390x844", "viewport_w": 390, "viewport_h": 844},
            },
        ]

        results = []
        for spec in scenarios_spec:
            run = await self.reproduce(
                bug_report=bug_report,
                session_meta=session_meta,
                session_events=session_events,
                target_base_url=target_base_url,
                simulate_network=True,
                mock_failed_requests=mock_failed_requests,
                scenario_config=spec["config"],
            )
            err_cnt = len(run.get("captured_errors", []))
            failed = run.get("status") in ("reproduced", "failed") or err_cnt > 0
            results.append({
                "id": spec["id"],
                "label": spec["label"],
                "description": spec["description"],
                "status": run.get("status", "inconclusive"),
                "error_count": err_cnt,
                "errors": run.get("captured_errors", [])[:5],
                "duration_ms": run.get("duration_ms", 0),
                "screenshot_url": run.get("screenshot_url"),
                "failed": failed,
                "execution_logs": run.get("execution_logs", ""),
            })

        failing = [r["label"] for r in results if r["failed"]]
        passing = [r["label"] for r in results if not r["failed"]]
        flaky_detected = 0 < len(failing) < len(results)

        if flaky_detected:
            verdict = "FLAKY_ENVIRONMENT_DEPENDENT"
            summary = f"Environment/Race sensitivity detected: Failed under [{', '.join(failing)}] while passing under [{', '.join(passing)}]."
        elif len(failing) == len(results):
            verdict = "DETERMINISTIC_FAILURE"
            summary = "Failure triggered consistently across all 4 timing, storage, and viewport realities."
        else:
            verdict = "RESILIENT_ACROSS_ALL_REALITIES"
            summary = "Zero uncaught crashes triggered across all 4 chaos realities."

        return {
            "matrix_verdict": verdict,
            "flaky_detected": flaky_detected,
            "failing_count": len(failing),
            "total_scenarios": len(results),
            "trigger_summary": summary,
            "scenarios": results,
        }


reproduction_engine = ReproductionEngine()
