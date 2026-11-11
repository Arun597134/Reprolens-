import json
import logging
import re
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
        api_key: str | None = None
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
                observed_facts.append(f"T+{offset_s:.1f}s: Navigated to route '{payload.get('url', page_url)}'")
            elif etype == "click":
                target = payload.get("text") or payload.get("selector") or "interactive element"
                observed_facts.append(f"T+{offset_s:.1f}s: User clicked '{target}' ({payload.get('selector', '')})")
                user_actions.append(payload)
            elif etype == "input":
                field = payload.get("name") or payload.get("selector") or "input"
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

        if not observed_facts:
            observed_facts.append(f"Observed error: '{error_msg}' on URL '{page_url}'")

        # Try external LLM if requested and key is available
        if use_external_llm:
            gemini_key = api_key or settings.GEMINI_API_KEY
            openai_key = api_key or settings.OPENAI_API_KEY

            if gemini_key:
                try:
                    return self._investigate_with_gemini(
                        gemini_key, bug_report, observed_facts, network_failures, session_meta
                    )
                except Exception as e:
                    logger.warning(f"External Gemini LLM investigation failed, falling back to heuristic: {e}")
            elif openai_key:
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
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text)
                parsed["ai_model_used"] = "Gemini 1.5 Flash (ReproLens AI)"
                parsed["evidence"] = {
                    "error_message": bug_report.get("error_message"),
                    "stack_trace": bug_report.get("stack_trace"),
                    "network_failures": network_failures
                }
                return parsed
            else:
                raise RuntimeError(f"Gemini API returned HTTP {resp.status_code}: {resp.text}")

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
