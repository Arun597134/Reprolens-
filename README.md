# ReproLens 🔍
> **AI-Powered Bug Investigation, Deterministic Reproduction & Regression Testing Platform**

ReproLens is a developer-focused platform that converts vague bug reports (*"Payment button is stuck"*, *"Blank screen on checkout"*) into structured, evidence-backed engineering case files, automated Playwright browser reproductions, AI root-cause diagnostics, and automated CI/CD regression test suites.

---

## 🏛️ System Architecture

```text
[ Chrome Extension MV3 / Web SDK ]
              │
              ▼
[ Local Privacy & Sanitization Engine ] (Luhn check, password, JWT & PII masked)
              │
              ▼
[ FastAPI Backend (Port 8000) ]
        ├── PostgreSQL / SQLite Database (SQLAlchemy)
        ├── Module 2: Privacy Defense-in-Depth Sanitizer
        ├── Module 3: AI Investigation Engine (Gemini / OpenAI / Heuristic)
        ├── Module 4: Deterministic Playwright Reproduction Runner
        └── Module 5: Playwright Regression Test & CI Generator
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[ React 18 Dashboard ]  [ ShopNow E-Commerce Demo ]
 (Port 5173 / Port 8000)      (Port 3000)
```

---

## 🚀 Quickstart (Launch Full Stack in 1 Command)

Ensure **Python 3.10+** and **Node.js 18+** are installed.

```bash
# 1. Start all 3 services (Backend, Dashboard & Demo App)
python start.py
```

The system will start:
- 📊 **ReproLens Developer Dashboard**: [http://localhost:5173](http://localhost:5173) (or [http://localhost:8000/](http://localhost:8000/))
- 🛍️ **ShopNow E-Commerce Store**: [http://localhost:3000](http://localhost:3000)
- 📡 **FastAPI Backend & Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📦 **Client SDK Script**: [http://localhost:8000/sdk/reprolens.js](http://localhost:8000/sdk/reprolens.js)

---

## 🧪 Real-World Walkthrough: The ShopNow Checkout Incident

1. Open the **ShopNow Store** at [http://localhost:3000](http://localhost:3000).
2. Click **"Add to Cart"** on the *Pro Wireless Headphones (₹2,500)*.
3. Open **Checkout** and click **"Pay Now ₹2,500"**.
4. **Failure Triggered**:
   - `POST /api/payment` returns `HTTP 500` (Internal Server Error / Gateway Timeout).
   - Checkout callback attempts `response.data.transactionId.toUpperCase()`, throwing:
     `Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')`.
5. Open the **ReproLens Developer Dashboard** at [http://localhost:5173](http://localhost:5173).
6. Inspect the new Bug Case File:
   - **Interactive Timeline**: Replay the user journey (`Page opened` → `Add to Cart` → `Checkout opened` → `Pay Now clicked` → `HTTP 500` → `Uncaught TypeError`).
   - **AI Investigation**:
     - **Observed Facts**: Chronological ground-truth evidence.
     - **Inferred Explanations**: Identifies missing null-checks on `response.data`.
     - **Unverified Hypotheses**: Upstream banking gateway degradation.
     - **Code Fix Diff**: Safe guard clauses & optional chaining `response.data?.transactionId`.
   - **Playwright Reproduction**: Click **"Run Browser Reproduction Now"** to watch Playwright launch an isolated browser with identical viewports (1440x900 or 390x844 mobile), mock the route, replay the clicks, and capture the failure screenshot!
   - **AI Regression Guard**: Click **"Synthesize Test"** to generate an automated `@playwright/test` spec and export the GitHub Actions CI workflow!

---

## 🛡️ Module Breakdown

### Module 1: Browser Capture Engine
- **Web SDK (`sdk/reprolens.js`)**: Drop-in zero-dependency client script that captures clicks, route navigations, inputs, network requests (via `fetch` & `XMLHttpRequest` hooks), console errors, and unhandled window exceptions.
- **Chrome Extension MV3 (`extension/`)**: Unpacked Chrome/Edge extension for zero-code instrumentation of any website.

### Module 2: Privacy & Data Sanitization Engine (`backend/app/services/sanitization.py`)
- Client-side redaction before transmission + server-side validation.
- **Credit Card Scrubber**: Luhn algorithm verification and pattern matching.
- **Credential Masking**: Passwords, secrets, bearer tokens, JWTs, API keys, CVV/CVC, SSN masked as `[REDACTED]`.
- **URL Query Parameter Filter**: Strips sensitive access tokens and query secrets.

### Module 3: Bug Intelligence & Investigation Engine (`backend/app/services/ai_investigator.py`)
- Strictly categorizes findings into:
  1. **Observed Facts** (undisputable recorded telemetry)
  2. **Inferred Explanations** (causal deductions from code)
  3. **Unverified Hypotheses** (speculative external variables)
  4. **Actionable Fix Diffs** (ready-to-apply code changes)
- Dual-mode architecture:
  - **Deterministic Static & Semantic Analyzer**: Built-in 100% offline precision.
  - **Cloud LLM Reasoner**: Pluggable Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), or Anthropic.

### Module 4: Deterministic Bug Reproduction Engine (`backend/app/services/reproduction_engine.py`)
- Isolated headless browser execution using Playwright Chromium.
- Recreates recorded viewport, user agent, locale, and network latency (CDP throttling).
- Deterministic API interception to mock failing endpoints and replay user clicks/inputs.
- Captures full-page screenshots, execution logs, and pass/fail outcome badges.

### Module 5: AI Regression Test Generator (`backend/app/services/test_generator.py`)
- Synthesizes resilient Playwright test specs (`.spec.ts`).
- Simulates network failures with `page.route()`, triggers user actions, and asserts error banners without crashes.
- Direct live test runner and GitHub Actions CI workflow generator.

### Module 6: Developer Dashboard (`frontend/`)
- Dark-mode, high-density engineering interface built with React 18, TypeScript, Vite, Tailwind CSS, and Lucide Icons.
- Sections: Overview, Projects, Sessions Replay, Bug Reports, AI Investigations, Playwright Reproductions, Regression Suite, and Settings.

---

## 🔌 Installing the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top-right toggle.
3. Click **Load unpacked**.
4. Select the `Raprolens/extension` directory.
5. The ReproLens floating capture badge will appear on any authorized website.

---

## 🧪 Running Unit Tests

```bash
# Run the core services test suite
python -c "from tests.test_services import TestReproLensCoreServices; t = TestReproLensCoreServices(); t.test_privacy_sanitizer_luhn_credit_cards(); t.test_privacy_sanitizer_emails_and_jwt(); t.test_privacy_sanitizer_query_parameters(); t.test_ai_investigator_root_cause_analysis(); t.test_regression_test_generator(); t.test_ci_workflow_generation(); print('SUCCESS: ALL TESTS PASSED!')"
```
