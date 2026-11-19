# ReproLens

<p align="center">
  <img src="docs/assets/banner.svg" alt="ReproLens Autonomous Platform Banner" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Autonomous%20Bug%20Investigation-0F172A?style=for-the-badge&labelColor=0284C7" alt="Platform" />
  <img src="https://img.shields.io/badge/Auto--Shield-0--Second%20Live%20Immunity-0F172A?style=for-the-badge&labelColor=10B981" alt="Auto-Shield" />
  <img src="https://img.shields.io/badge/Playwright-Deterministic%20Headless%20Replay-0F172A?style=for-the-badge&labelColor=F59E0B" alt="Playwright" />
  <img src="https://img.shields.io/badge/Privacy-On--Device%20Zero--PII%20Luhn%20Scrubber-0F172A?style=for-the-badge&labelColor=6366F1" alt="Privacy" />
  <img src="https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge&labelColor=64748B" alt="License" />
</p>

<p align="center">
  <strong>Autonomous Bug Investigation, Deterministic Playwright Replay &amp; 0-Second Live Runtime Self-Healing Platform</strong>
</p>

<p align="center">
  <a href="#pipeline-architecture">Pipeline Architecture</a> &bull;
  <a href="#dual-reality-runtime-verification">Dual-Reality Sandbox</a> &bull;
  <a href="#capability-benchmark-matrix">Capability Matrix</a> &bull;
  <a href="#chrome-extension--chaos-simulator">Extension &amp; Chaos</a> &bull;
  <a href="#technology-architecture">Tech Stack</a> &bull;
  <a href="#single-command-quickstart">Terminal Quickstart</a> &bull;
  <a href="#security--zero-auto-push-policy">Security &amp; Privacy</a>
</p>

---

## Autonomous Pipeline Architecture

<p align="center">
  <img src="docs/assets/pipeline.svg" alt="Autonomous 11-Stage Execution Pipeline" width="100%" />
</p>

ReproLens eliminates manual bug reproduction and post-mortem panic through an end-to-end autonomous cycle:

1. **Flight Recorder**: A 45-second circular ring buffer captures raw DOM mutations, clickstreams, and network failures in the client browser.
2. **On-Device Zero-PII Scrubber**: Pre-flight Luhn mathematical checks, RFC email regex, and bearer token filters scrub sensitive data before network dispatch.
3. **Deterministic Headless Replay**: Isolated Playwright Chromium instances recreate matching viewports, user agents, cookies, and mock network routes to reproduce bugs with 100% fidelity.
4. **0-Second Auto-Shield Runtime**: Injects client-side AST exception traps and Service Worker micro-proxies (`reprolens-shield.sw.js`) that intercept live visitor crashes in real time with `<1.2ms` overhead without emergency server redeployments.
5. **1-Click IDE Jump Dispatcher**: Generates direct `vscode://` and `cursor://` protocol jumps to the root cause line, placing the verified AST fallback patch onto the system clipboard.
6. **Safe Manual PR Studio**: Strictly enforces a **Zero-Auto-Push Policy** requiring explicit human inspection of before/after code diffs before modifying repositories.

---

## Dual-Reality Runtime Verification

<p align="center">
  <img src="docs/assets/split-sandbox.svg" alt="Dual-Reality Split Runtime Verification" width="100%" />
</p>

ReproLens executes both realities in parallel live in the browser without requiring page reloads:
- **Reality A (Unshielded Crash Baseline)**: Simulates the unmitigated production environment. Demonstrates unhandled `TypeError` exceptions, component tree unmounting, white-screen failures, and cart drop-offs.
- **Reality B (ReproLens Auto-Shield Active)**: Injects verified AST exception traps and defensive safe objects within 0.8ms, insulating visitors from crashes while keeping checkout flows 100% operational.

---

## Capability Benchmark Matrix

<p align="center">
  <img src="docs/assets/comparison-matrix.svg" alt="Capability Benchmark Matrix: ReproLens vs Legacy APMs" width="100%" />
</p>

---

## Chrome Extension & Chaos Simulator

<p align="center">
  <img src="docs/assets/extension-chaos.svg" alt="Chrome Extension MV3 and QA Chaos Simulator" width="100%" />
</p>

The ReproLens Chrome Extension (Manifest V3) instruments production and staging environments without requiring codebase modifications:
- **MAIN-World Interception**: Intercepts `window.fetch`, `XMLHttpRequest`, and unhandled promise rejections directly in the client application runtime.
- **Chaos Simulator Controls**:
  - **Slow 3G Network Latency (+2.5s)**: Injects network delays to diagnose frontend race conditions and hanging loaders.
  - **Force API HTTP 500 Drop**: Injects synthetic backend server failures to test application error boundary resilience.
  - **Black-Box Flight Recorder (45s Ring Buffer)**: Records the last 45 seconds of interaction history, discarded automatically unless a crash occurs.
- **Ambient Hunter Radar**: Background radar telemetry scanning DOM mutations and network anomalies across open browser tabs.

---

## Mission Control UI Showcase

### Enterprise Landing Page
<p align="center">
  <img src="docs/assets/landing-hero.png" alt="ReproLens Landing Page Hero" width="100%" />
</p>

### Developer Mission Control Dashboard
<p align="center">
  <img src="docs/assets/dashboard-overview.png" alt="ReproLens Dashboard Overview" width="100%" />
</p>

---

## Technology Architecture

<p align="center">
  <img src="docs/assets/tech-stack.svg" alt="Technology Architecture Full-Stack Spec" width="100%" />
</p>

---

## Single-Command Quickstart

<p align="center">
  <img src="docs/assets/terminal-quickstart.svg" alt="Terminal Quickstart Boot Sequence" width="100%" />
</p>

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher

```bash
# Clone the repository
git clone https://github.com/Arun597134/Reprolens-.git
cd Reprolens-

# Launch the unified full-stack environment (FastAPI Backend, React Dashboard & Demo App)
python start.py
```

The unified launcher starts:
- **Developer Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend & Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ShopNow E-Commerce Demo Application**: [http://localhost:3000](http://localhost:3000)
- **Client Web SDK Endpoint**: [http://localhost:8000/sdk/reprolens.js](http://localhost:8000/sdk/reprolens.js)

---

## Security & Zero-Auto-Push Policy

<p align="center">
  <img src="docs/assets/security-policy.svg" alt="Security Assurance and Zero-Auto-Push Policy" width="100%" />
</p>

- **Zero Unsolicited Writes**: Git branches, pull requests, and remote writes are never executed without explicit human authorization.
- **Client-Side Edge Redaction**: Credit cards (validated via Luhn algorithm), passwords, and bearer tokens are permanently purged before network dispatch.
- **Air-Gapped Telemetry**: Full offline deterministic operation supported without external cloud LLM dependencies.

---

## Chrome Extension Setup

1. Open `chrome://extensions` in Google Chrome, Brave, or Microsoft Edge.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the local `extension/` directory.
4. Open the extension popup to configure the API key and toggle Chaos Simulator parameters (Slow 3G, Force 500, Black-Box Flight Recorder).

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
