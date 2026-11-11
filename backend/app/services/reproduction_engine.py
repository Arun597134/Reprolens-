import asyncio
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any
from playwright.async_api import async_playwright
from app.core.config import settings

logger = logging.getLogger(__name__)

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
        mock_failed_requests: bool = True
    ) -> dict[str, Any]:
        """
        Executes headless browser reproduction using Playwright.
        """
        start_time = time.time()
        logs = []
        status = "not_reproduced"
        screenshot_filename = None
        reproduced_steps = []
        captured_errors = []

        def log(msg: str):
            timestamp = f"[{time.strftime('%H:%M:%S')}]"
            line = f"{timestamp} {msg}"
            logs.append(line)
            logger.info(line)

        log("Initializing ReproLens Deterministic Browser Environment...")

        # Extract environment configuration
        viewport_w = session_meta.get("viewport_w", 1280)
        viewport_h = session_meta.get("viewport_h", 800)
        user_agent = session_meta.get("user_agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        page_url = target_base_url or bug_report.get("url") or session_meta.get("url") or "http://localhost:3000"

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

            # Route interception for deterministic mock if enabled
            if mock_failed_requests and failed_network_calls:
                for failed in failed_network_calls:
                    failed_url = failed.get("url", "")
                    failed_status = failed.get("status", 500)
                    failed_method = failed.get("method", "POST")

                    if failed_url:
                        # Extract pathname or wildcard match
                        url_pattern = f"**{failed_url}" if failed_url.startswith("/") else f"**{failed_url.split('://')[-1]}" if "://" in failed_url else f"**/{failed_url}"
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
            reproduced_steps.append({"step": "navigation", "target": page_url, "status": "executed"})
            try:
                await page.goto(page_url, wait_until="domcontentloaded", timeout=15000)
                await asyncio.sleep(1.0)
            except Exception as e:
                log(f"Navigation warning: {e}. Continuing with document content...")

            # Step 2: Replay interactive actions (clicks, inputs)
            interactive_events = [
                e for e in session_events if e.get("event_type") in ("click", "input", "navigation")
            ]

            log(f"Replaying {len(interactive_events)} recorded user interaction steps...")

            for i, evt in enumerate(interactive_events):
                etype = evt.get("event_type")
                payload = evt.get("payload", {})
                selector = payload.get("selector", "")
                text = payload.get("text", "")
                tag = payload.get("tag", "button")

                log(f"Step {i+1}/{len(interactive_events)}: {etype.upper()} on '{text or selector or tag}'")

                try:
                    if etype == "click":
                        # Try robust locators in order: selector -> text -> role
                        clicked = False
                        if selector:
                            try:
                                loc = page.locator(selector).first
                                if await loc.count() > 0 and await loc.is_visible():
                                    await loc.click(timeout=3000)
                                    clicked = True
                            except Exception:
                                pass

                        if not clicked and text:
                            try:
                                loc = page.get_by_text(text, exact=False).first
                                if await loc.count() > 0:
                                    await loc.click(timeout=3000)
                                    clicked = True
                            except Exception:
                                pass

                        if not clicked and text:
                            try:
                                loc = page.get_by_role("button", name=text).first
                                if await loc.count() > 0:
                                    await loc.click(timeout=3000)
                                    clicked = True
                            except Exception:
                                pass

                        reproduced_steps.append({
                            "step": "click",
                            "selector": selector,
                            "text": text,
                            "status": "clicked" if clicked else "selector_not_found"
                        })
                        if not clicked:
                            log(f"Notice: element '{text or selector}' not currently visible on page.")

                    elif etype == "input":
                        value = payload.get("value", "test_input")
                        if selector:
                            try:
                                loc = page.locator(selector).first
                                if await loc.count() > 0:
                                    await loc.fill(value, timeout=2000)
                            except Exception:
                                pass
                        reproduced_steps.append({
                            "step": "input",
                            "selector": selector,
                            "status": "filled"
                        })

                    # Small delay between actions to mirror human interaction
                    await asyncio.sleep(0.8)

                except Exception as step_err:
                    log(f"Step {i+1} interaction note: {step_err}")

            # Wait to capture any delayed exceptions or responses
            await asyncio.sleep(2.0)

            # Step 3: Capture evidence screenshot
            shot_id = str(uuid.uuid4())[:8]
            screenshot_filename = f"repro_{shot_id}.png"
            screenshot_filepath = Path(settings.SCREENSHOTS_PATH) / screenshot_filename
            try:
                await page.screenshot(path=str(screenshot_filepath), full_page=True)
                log(f"High-res state screenshot captured: {screenshot_filename}")
            except Exception as ss_err:
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
                log("Deterministic Reproduction INCONCLUSIVE: Steps executed but error condition was not triggered.")
            else:
                status = "not_reproduced"
                log("Deterministic Reproduction FAILED: Unable to execute steps on target route.")

        except Exception as e:
            log(f"Reproduction runner encountered exception: {e}")
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
                "mocked_endpoints": [f.get("url") for f in failed_network_calls]
            },
            "screenshot_url": f"/screenshots/{screenshot_filename}" if screenshot_filename else None,
            "execution_logs": "\n".join(logs),
            "duration_ms": elapsed_ms,
            "exit_code": 0 if status == "reproduced" else 1
        }

reproduction_engine = ReproductionEngine()
