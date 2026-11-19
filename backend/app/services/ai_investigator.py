import base64
import json
import logging
import re
from pathlib import Path
from typing import Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class BugInvestigator:
    """
    Module 3 — Bug Intelligence & Investigation Engine.
    Strictly separates:
    1. Observed facts (indisputable chronological telemetry)
    2. Inferred explanations (logical deduction from code & failure patterns)
    3. Unverified hypotheses (unproven potential external causes)
    4. Fix recommendations (actionable code fixes with before/after diffs)
    """

    def investigate(
        self,
        bug_report: dict[str, Any],
        session_events: list[dict[str, Any]],
        session_meta: dict[str, Any] | None = None,
        use_external_llm: bool = False,
        api_key: str | None = None,
        openai_api_key: str | None = None,
    ) -> dict[str, Any]:
        """
        Runs investigation on sanitized evidence.
        """
        # Collect telemetry context
        error_msg = bug_report.get("error_message", "")
        stack_trace = bug_report.get("stack_trace", "")
        error_type = bug_report.get("error_type", "JavaScriptError")
        page_url = bug_report.get("url", "")

        # Extract chronological facts from events
        observed_facts = []
        network_failures = []
        user_actions = []

        for evt in session_events:
            offset_s = evt.get("timestamp_offset_ms", 0) / 1000.0
            etype = evt.get("event_type", "")
            payload = evt.get("payload", {})

            if etype == "navigation":
                title_part = f" ({payload.get('title')})" if payload.get("title") else ""
                observed_facts.append(f"T+{offset_s:.1f}s: Navigated to route '{payload.get('url', page_url)}'{title_part}")
            elif etype == "click":
                summary = payload.get("semantic_summary")
                if summary:
                    observed_facts.append(f"T+{offset_s:.1f}s: {summary}")
                else:
                    target = payload.get("action_label") or payload.get("text") or payload.get("ariaLabel") or payload.get("selector") or "interactive element"
                    observed_facts.append(f"T+{offset_s:.1f}s: User clicked '{target}' ({payload.get('selector', '')})")
                user_actions.append(payload)
            elif etype == "input":
                summary = payload.get("semantic_summary")
                if summary:
                    observed_facts.append(f"T+{offset_s:.1f}s: {summary}")
                else:
                    field = payload.get("field_label") or payload.get("name") or payload.get("selector") or "input"
                    observed_facts.append(f"T+{offset_s:.1f}s: User interacted with field '{field}'")
            elif etype == "network_request":
                status = payload.get("status", 200)
                method = payload.get("method", "GET")
                url = payload.get("url", "")
                if status >= 400 or status == 0:
                    observed_facts.append(f"T+{offset_s:.1f}s: Network failure: {method} {url} returned HTTP {status}")
                    network_failures.append(payload)
                else:
                    observed_facts.append(f"T+{offset_s:.1f}s: Network call: {method} {url} returned HTTP {status}")
            elif etype in ("console_error", "js_exception"):
                msg = payload.get("message") or error_msg
                observed_facts.append(f"T+{offset_s:.1f}s: Failure detected: {msg}")
            elif etype == "rage_click":
                cnt = payload.get("click_count", 3)
                target = payload.get("semantic_summary") or payload.get("action_label") or payload.get("text") or payload.get("selector") or "UI button"
                observed_facts.append(f"T+{offset_s:.1f}s: Rage-Click Anomaly detected ({cnt}x rapid clicks — {target})")
            elif etype == "dead_click":
                target = payload.get("semantic_summary") or payload.get("action_label") or payload.get("text") or payload.get("selector") or "UI button"
                observed_facts.append(f"T+{offset_s:.1f}s: Silent UX Freeze: Clicking caused zero DOM or network response ({target})")

        if not observed_facts:
            observed_facts.append(f"Observed error: '{error_msg}' on URL '{page_url}'")

        # Try external LLM if requested and key is available
        if use_external_llm:
            passed_is_openai = bool(api_key and api_key.startswith("sk-"))
            gemini_key = (None if passed_is_openai else api_key) or settings.GEMINI_API_KEY
            openai_key = openai_api_key or (api_key if passed_is_openai else None) or settings.OPENAI_API_KEY

            if gemini_key:
                try:
                    return self._investigate_with_gemini(
                        gemini_key, bug_report, observed_facts, network_failures, session_meta
                    )
                except Exception as e:
                    logger.warning(f"External Gemini LLM investigation failed, trying next provider/heuristic: {e}")
            if openai_key:
                try:
                    return self._investigate_with_openai(
                        openai_key, bug_report, observed_facts, network_failures, session_meta
                    )
                except Exception as e:
                    logger.warning(f"External OpenAI investigation failed, falling back to heuristic: {e}")

        # Deterministic Heuristic & Static Semantic Analysis Engine
        return self._investigate_heuristic(
            bug_report=bug_report,
            observed_facts=observed_facts,
            network_failures=network_failures,
            user_actions=user_actions,
            session_meta=session_meta or {}
        )

    def _investigate_heuristic(
        self,
        bug_report: dict[str, Any],
        observed_facts: list[str],
        network_failures: list[dict[str, Any]],
        user_actions: list[dict[str, Any]],
        session_meta: dict[str, Any]
    ) -> dict[str, Any]:
        """
        High-precision deterministic static analysis based on error signatures and event causality.
        """
        error_msg = bug_report.get("error_message", "")
        stack_trace = bug_report.get("stack_trace", "")
        title = bug_report.get("title", "Frontend Application Error")

        inferred_explanations = []
        unverified_hypotheses = []
        fix_recommendations = []
        confidence_score = 0.85
        root_cause = ""

        # Pattern 1: Null/undefined dereference following failed API call
        if ("Cannot read properties of undefined" in error_msg or "Cannot read property" in error_msg or "null is not an object" in error_msg) and network_failures:
            failed_req = network_failures[-1]
            status = failed_req.get("status", 500)
            endpoint = failed_req.get("url", "/api/payment")
            
            # Detect property name from error
            prop_match = re.search(r"reading ['\"]?(\w+)['\"]?", error_msg)
            prop_name = prop_match.group(1) if prop_match else "transactionId"

            root_cause = f"The handler expected a successful response containing '{prop_name}', but the prior {endpoint} request returned HTTP {status}. When attempting to access '{prop_name}' on the missing payload, an unhandled TypeError was thrown."
            
            inferred_explanations.append(
                f"HTTP {status} response payload did not conform to the expected success contract (missing property '{prop_name}')."
            )
            inferred_explanations.append(
                "Absence of error handling / optional chaining in the response promise resolution handler."
            )
            
            unverified_hypotheses.append(
                f"The backend service at '{endpoint}' might have timed out, suffered an unhandled internal exception, or returned non-JSON error HTML."
            )
            unverified_hypotheses.append(
                "Upstream payment gateway gateway timeout or rate limiting."
            )

            confidence_score = 0.94

            fix_recommendations.append({
                "title": "Add Guard Clause & Optional Chaining in Payment Handler",
                "file": "src/services/payment.ts",
                "diff": f"""- const txId = response.data.{prop_name}.toUpperCase();
+ if (!response || !response.ok) {{
+   showUserError('Payment processing failed. Please try again.');
+   return;
+ }}
+ const txId = response.data?.{prop_name}?.toUpperCase() ?? 'PENDING';"""
            })
            fix_recommendations.append({
                "title": "Wrap Async Network Call in Try/Catch with Toast Notification",
                "file": "src/components/Checkout.tsx",
                "diff": """+ try {
    await processPayment(payload);
+ } catch (err) {
+   console.error('Payment failure captured:', err);
+   displayFeedbackBanner('Unable to complete transaction. Your card was not charged.');
+ }"""
            })

        # Pattern 2: Network failure without explicit JS crash
        elif network_failures and not error_msg:
            failed_req = network_failures[-1]
            status = failed_req.get("status", 500)
            endpoint = failed_req.get("url", "API endpoint")
            root_cause = f"API request to '{endpoint}' failed with status HTTP {status}, leaving the interface in a stalled or unresponsive state."
            inferred_explanations.append(f"HTTP {status} indicates backend service degradation or invalid client payload.")
            unverified_hypotheses.append("Authentication token might have expired, or CORS preflight was rejected.")
            confidence_score = 0.80

        # Pattern 3: Unhandled Promise Rejection
        elif "UnhandledPromiseRejection" in error_msg or "Unhandled Rejection" in error_msg:
            root_cause = "An asynchronous promise was rejected without a corresponding .catch() rejection handler."
            inferred_explanations.append("Network or parsing failure occurred within an un-awaited asynchronous block.")
            unverified_hypotheses.append("CORS restriction or client-side JSON parse error on malformed response.")
            confidence_score = 0.88
            fix_recommendations.append({
                "title": "Add .catch() or await with try/catch",
                "file": "src/api/client.ts",
                "diff": """- fetchEndpoint().then(renderData);
+ fetchEndpoint().then(renderData).catch(handleApiError);"""
            })

        # Pattern 4: Silent UX Freeze / Rage Click Anomaly
        elif "Rage Click" in error_msg or "Dead Click" in error_msg or bug_report.get("error_type") in ("RageClickAnomaly", "SilentUXFreeze"):
            comp = bug_report.get("component_context") or "interactive button"
            root_cause = f"Silent UX failure on '{comp}': user interaction produced neither DOM state transitions nor outbound network telemetry within the responsiveness budget, triggering repeated rage clicks or a dead interaction."
            inferred_explanations.append(
                f"Missing onClick event binding, blocked pointer-events overlay, or un-debounced async action lacking a loading state on '{comp}'."
            )
            unverified_hypotheses.append(
                "Z-index transparent overlay intercepting click events, or disabled form validation silently swallowing submission."
            )
            confidence_score = 0.91
            fix_recommendations.append({
                "title": "Add Loading Guard, Debounce & Deterministic Handler Feedback",
                "file": "src/components/InteractiveAction.tsx",
                "diff": """- <button onClick={handleAction}>Submit</button>
+ <button
+   disabled={isSubmitting}
+   aria-busy={isSubmitting}
+   onClick={async (e) => {
+     if (isSubmitting) return;
+     setIsSubmitting(true);
+     try { await handleAction(e); } finally { setIsSubmitting(false); }
+   }}
+ >
+   {isSubmitting ? 'Processing...' : 'Submit'}
+ </button>"""
            })

        # General Fallback
        else:
            root_cause = f"Exception '{error_msg or 'Unspecified Runtime Error'}' occurred during user session execution."
            inferred_explanations.append("Component lifecycle state was invalidated by unexpected DOM manipulation or missing state initialization.")
            unverified_hypotheses.append("Browser vendor compatibility or third-party script interference.")
            confidence_score = 0.72

        summary = f"Identified issue: {title}. {root_cause}"

        return {
            "summary": summary,
            "root_cause_analysis": root_cause,
            "observed_facts": observed_facts,
            "inferred_explanations": inferred_explanations,
            "unverified_hypotheses": unverified_hypotheses,
            "confidence_score": confidence_score,
            "fix_recommendations": fix_recommendations,
            "evidence": {
                "error_message": error_msg,
                "stack_trace": stack_trace,
                "network_failures": network_failures,
                "user_actions_count": len(user_actions),
                "browser_meta": session_meta
            },
            "ai_model_used": "ReproLens-Analyzer-v1 (Heuristic Engine)"
        }

    def _investigate_with_gemini(
        self,
        api_key: str,
        bug_report: dict,
        observed_facts: list[str],
        network_failures: list[dict],
        session_meta: dict | None
    ) -> dict[str, Any]:
        """
        Calls Gemini API with structured JSON output enforcing strict facts vs inferences distinction.
        """
        prompt = f"""You are the ReproLens Lead AI Debugging Engineer.
Analyze this web application failure using strictly separated categories:
1. observed_facts: ONLY actions, network calls, errors directly witnessed in the telemetry.
2. inferred_explanations: High-probability causal deductions explaining why the code failed.
3. unverified_hypotheses: Speculative or external possibilities that lack definitive evidence.
4. confidence_score: A float between 0.0 and 1.0.
5. root_cause_analysis: Summary explanation of the defect.
6. fix_recommendations: List of objects with {{"title": str, "file": str, "diff": str}}.

Bug Context:
Title: {bug_report.get('title')}
Error: {bug_report.get('error_message')}
Stack: {bug_report.get('stack_trace')}
URL: {bug_report.get('url')}

Observed Chronology:
{json.dumps(observed_facts, indent=2)}

Failed Network Calls:
{json.dumps(network_failures, indent=2)}

Browser Environment:
{json.dumps(session_meta or {}, indent=2)}

Respond with VALID JSON ONLY matching this structure:
{{
  "summary": "...",
  "root_cause_analysis": "...",
  "observed_facts": ["..."],
  "inferred_explanations": ["..."],
  "unverified_hypotheses": ["..."],
  "confidence_score": 0.95,
  "fix_recommendations": [{{"title": "...", "file": "...", "diff": "..."}}]
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        parsed, model_name = self._post_gemini_json(api_key, payload)
        parsed["ai_model_used"] = f"{model_name} (ReproLens AI)"
        parsed["evidence"] = {
            "error_message": bug_report.get("error_message"),
            "stack_trace": bug_report.get("stack_trace"),
            "network_failures": network_failures
        }
        return parsed

    def _post_gemini_json(self, api_key: str, payload: dict[str, Any]) -> tuple[dict[str, Any], str]:
        """Try Gemini model candidates in priority order and return (parsed_json, model_name)."""
        models_to_try = (
            "gemini-3-flash-preview",
            "gemini-3.8-flash",
            "gemini-flash-latest",
            "gemini-3.1-flash-lite-preview",
        )
        last_error = "No Gemini model candidates succeeded"

        with httpx.Client(timeout=45.0) as client:
            for model_name in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(raw_text), model_name
                last_error = f"{model_name} HTTP {resp.status_code}: {resp.text[:200]}"
                logger.warning(f"Gemini model candidate failed: {last_error}")

        raise RuntimeError(f"Gemini API failed across candidates: {last_error}")

    def audit_screenshot_vision(
        self,
        screenshot_path: str | Path,
        bug_report: dict[str, Any],
        api_key: str | None = None,
    ) -> dict[str, Any]:
        """
        Feature #1 — Resurrected Vision + DOM Crash Auditor.
        Correlates a single captured browser screenshot with error telemetry using Gemini Vision.
        """
        path = Path(screenshot_path)
        if not path.exists():
            raise FileNotFoundError(f"Screenshot not found: {path}")

        img_bytes = path.read_bytes()
        gemini_key = api_key or settings.GEMINI_API_KEY

        if gemini_key:
            prompt = f"""You are ReproLens Multimodal UI Crash Auditor.
Inspect this web application screenshot captured during a failed reproduction alongside the telemetry below.
Identify visible UI/UX failures: blank screens, stuck spinners, off-screen/clipped buttons, overlapping modals, raw error dumps, or missing error feedback.

Bug Context:
- Title: {bug_report.get('title')}
- Error Type: {bug_report.get('error_type')}
- Error Message: {bug_report.get('error_message')}
- Route: {bug_report.get('url')}

Respond with VALID JSON ONLY:
{{
  "visual_verdict": "UI_BROKEN" | "RENDERED_ERROR_STATE" | "VISUALLY_CLEAN",
  "summary": "...",
  "ui_anomalies": [
    {{"category": "...", "severity": "critical|high|medium|low", "description": "...", "location_hint": "..."}}
  ],
  "accessibility_flags": ["..."],
  "confidence_score": 0.9
}}"""
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": base64.b64encode(img_bytes).decode("ascii"),
                            }
                        },
                    ]
                }],
                "generationConfig": {"response_mime_type": "application/json"},
            }
            try:
                parsed, model_name = self._post_gemini_json(gemini_key, payload)
                parsed["model_used"] = f"{model_name} (Vision + DOM)"
                parsed["screenshot_bytes"] = len(img_bytes)
                return parsed
            except Exception as e:
                logger.warning(f"Gemini Vision audit failed, falling back to heuristic visual check: {e}")

        # Deterministic offline fallback audit
        anomalies = []
        if len(img_bytes) < 8192:
            anomalies.append({
                "category": "Blank / Unrendered Screen",
                "severity": "critical",
                "description": f"Captured PNG is unusually small ({len(img_bytes)} bytes), indicating an unrendered or crashed blank DOM.",
                "location_hint": "Full viewport",
            })
        if bug_report.get("error_message"):
            anomalies.append({
                "category": "DOM Error Correlation",
                "severity": "high",
                "description": f"Runtime exception '{bug_report.get('error_type')}' occurred while UI remained without visible recovery state.",
                "location_hint": bug_report.get("url") or "Active route",
            })

        return {
            "visual_verdict": "UI_BROKEN" if len(img_bytes) < 8192 else "RENDERED_ERROR_STATE",
            "summary": "Offline heuristic visual check completed (configure valid Gemini Vision key for pixel-level UI reasoning).",
            "ui_anomalies": anomalies,
            "accessibility_flags": ["Verify visible [role='alert'] banner communicates failure state to users."],
            "confidence_score": 0.75,
            "model_used": "ReproLens Heuristic Visual Fallback",
            "screenshot_bytes": len(img_bytes),
        }

    def _investigate_with_openai(
        self,
        api_key: str,
        bug_report: dict,
        observed_facts: list[str],
        network_failures: list[dict],
        session_meta: dict | None
    ) -> dict[str, Any]:
        """
        Calls OpenAI API with JSON output mode.
        """
        prompt = f"""You are ReproLens AI Debugger.
Analyze this bug report and return JSON with:
summary, root_cause_analysis, observed_facts (list), inferred_explanations (list), unverified_hypotheses (list), confidence_score (float 0-1), fix_recommendations (list of {{title, file, diff}}).

Bug: {bug_report.get('title')} - {bug_report.get('error_message')}
Chronology: {json.dumps(observed_facts)}
Failed Requests: {json.dumps(network_failures)}
"""
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
        with httpx.Client(timeout=30.0) as client:
            resp = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                parsed = json.loads(data["choices"][0]["message"]["content"])
                parsed["ai_model_used"] = "GPT-4o-mini (ReproLens AI)"
                parsed["evidence"] = {"network_failures": network_failures}
                return parsed
            else:
                raise RuntimeError(f"OpenAI API returned HTTP {resp.status_code}")

ai_investigator = BugInvestigator()
