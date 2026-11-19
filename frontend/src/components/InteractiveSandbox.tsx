import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2,
  Terminal, Code2, Sparkles, Laptop, ArrowRight, Zap, RefreshCw,
  Layers, Lock, Bug, Check, Copy, Flame
} from 'lucide-react';

interface Props {
  theme?: 'dark' | 'light';
  onDownloadExtension?: () => void;
}

type ScenarioType = 'checkout_500' | 'type_error' | 'hydration_crash';

export const InteractiveSandbox: React.FC<Props> = ({ theme = 'dark', onDownloadExtension }) => {
  const isDark = theme === 'dark';

  const [activeScenario, setActiveScenario] = useState<ScenarioType>('checkout_500');
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Idle, 1: Triggered, 2: Sanitized, 3: AI Diagnosis, 4: Playwright Replay, 5: Verified
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  const scenarios = [
    {
      id: 'checkout_500' as ScenarioType,
      name: 'Stripe HTTP 500 Crash',
      tag: 'NETWORK DROP',
      color: 'red',
      route: '/checkout/payment',
      exception: 'UnhandledPromiseRejection: HTTP 500 Internal Server Error at POST /api/v1/charge',
      rootCause: 'Payment gateway timeout caused unhandled promise rejection without retry fallback.',
      fixedDiff: `- const res = await stripe.charges.create(payload);\n- if (res.status === 200) setSuccess(true);\n+ try {\n+   const res = await stripe.charges.create(payload);\n+   setSuccess(res?.status === 200);\n+ } catch (err) {\n+   renderGracefulFallback(err);\n+ }`,
      terminalOutput: [
        '[playwright:runner] Spinning up isolated Chromium (1280x720, Latency: 120ms)...',
        '[telemetry:dom] Replaying interaction stream: click -> #pay-now-btn',
        '[network:mock] Intercepting POST /api/v1/charge -> armed HTTP 500 response',
        '[reprolens:assert] Runtime crash reproduced deterministically in 320ms',
        '[reprolens:guard] Generated spec: tests/reprolens/checkout-resilience.spec.ts',
        '[reprolens:result] 0 PII leaked • 100% deterministic fidelity'
      ]
    },
    {
      id: 'type_error' as ScenarioType,
      name: 'TypeError: Cannot read properties',
      tag: 'JS EXCEPTION',
      color: 'amber',
      route: '/account/profile',
      exception: "TypeError: Cannot read properties of undefined (reading 'billingAddress')",
      rootCause: 'User state accessed before asynchronous GraphQL query hydration completed.',
      fixedDiff: `- const address = user.profile.billingAddress.street;\n+ const address = user?.profile?.billingAddress?.street || 'Not provided';`,
      terminalOutput: [
        '[playwright:runner] Chromium launched at viewport 1280x720',
        '[telemetry:dom] Fast-forwarding hydration sequence: 4 DOM events',
        '[reprolens:trace] Caught TypeError in OrderSummary.tsx:88',
        '[reprolens:ai] Synthesized optional chaining defensive patch (confidence: 99.8%)',
        '[reprolens:result] Snapshot verified against regression suite'
      ]
    },
    {
      id: 'hydration_crash' as ScenarioType,
      name: 'React Hydration Mismatch',
      tag: 'DOM CORRUPTION',
      color: 'blue',
      route: '/cart/review',
      exception: 'Error: Hydration failed because server HTML did not match client render',
      rootCause: 'Window localStorage access executed on server render pass causing mismatched DOM trees.',
      fixedDiff: `- const token = localStorage.getItem('token');\n+ const [token, setToken] = useState(null);\n+ useEffect(() => setToken(localStorage.getItem('token')), []);`,
      terminalOutput: [
        '[playwright:runner] Chromium comparing SSR snapshot vs CSR tree',
        '[telemetry:dom] Detected mismatched text content in <div id="cart-total">',
        '[reprolens:ai] Isolated client-only localStorage read during SSR pass',
        '[reprolens:guard] Synthesized defensive useEffect hydration wrapper'
      ]
    }
  ];

  const currentData = scenarios.find((s) => s.id === activeScenario) || scenarios[0];

  // Automated sequence runner
  const startSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStep(1);
    setIsPlaying(true);

    // Animate cursor to button
    setCursorPos({ x: 65, y: 72 });
    setTimeout(() => setIsClicking(true), 600);
    setTimeout(() => setIsClicking(false), 900);

    // Sequence steps
    setTimeout(() => {
      setCurrentStep(2); // Sanitization
    }, 1200);

    setTimeout(() => {
      setCurrentStep(3); // AI Diagnosis
    }, 2400);

    setTimeout(() => {
      setCurrentStep(4); // Playwright Replay
    }, 3800);

    setTimeout(() => {
      setCurrentStep(5); // Complete / Verified
      setIsPlaying(false);
    }, 5200);
  };

  const resetSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStep(0);
    setIsPlaying(false);
    setCursorPos({ x: 50, y: 50 });
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(`// Playwright Autonomous Regression Guard Spec
import { test, expect } from '@playwright/test';

test.describe('ReproLens Autonomous Bug Reproduction', () => {
  test('Deterministically reproduces and guards against ${currentData.name}', async ({ page }) => {
    // 1. Arm mock failure endpoint
    await page.route('**/api/v1/charge', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Gateway timeout' }) });
    });

    // 2. Replay captured user clickstream
    await page.goto('${currentData.route}');
    await page.click('button#pay-now');

    // 3. Verify resilient error boundary (no fatal crash)
    const errorBanner = page.locator('.error-fallback');
    await expect(errorBanner).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });
});`);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <section className="relative z-10 py-24 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto space-y-10 scroll-mt-20" id="sandbox">
      {/* Header Badge & Title */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono tracking-wider uppercase shadow-sm">
          <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className={isDark ? 'text-white/80' : 'text-black/80'}>LIVE INTERACTIVE ENGINE SIMULATOR</span>
        </div>

        <h2 className={`text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.05] ${
          isDark ? 'text-white' : 'text-[#111]'
        }`}>
          Trigger a fatal bug.<br />
          Watch ReproLens fix &amp; replay it.
        </h2>

        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
          Click the interactive button below to simulate a real-world checkout failure. See telemetry capture, client-side PII scrubbing, AI root cause deduction, and Playwright execution live.
        </p>
      </div>

      {/* Scenario Picker Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setActiveScenario(sc.id);
                resetSimulation();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 border cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? (isDark
                      ? 'bg-white text-black border-white shadow-lg font-bold'
                      : 'bg-[#111] text-white border-black shadow-md font-bold')
                  : (isDark
                      ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black')
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                sc.color === 'red' ? 'bg-red-500' : sc.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              <span>{sc.name}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Main Stage: Dual Pane Browser + Terminal Workspace */}
      <div className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 ${
        isDark
          ? 'bg-[#10121A]/95 border-white/[0.1] shadow-black/80'
          : 'bg-white/95 border-black/[0.1] shadow-xl'
      }`}>
        
        {/* Stage Toolbar */}
        <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
          isDark ? 'bg-white/[0.02] border-white/[0.08] text-white/60' : 'bg-black/[0.02] border-black/[0.06] text-black/60'
        }`}>
          {/* Traffic lights */}
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="ml-2 font-bold opacity-80">sandbox://reprolens.engine/live-triage</span>
          </div>

          {/* Stepper Status Indicators */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded font-bold ${
              currentStep === 0 ? 'bg-white/10 text-white/60' :
              currentStep === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              currentStep === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              currentStep === 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              currentStep === 4 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
            }`}>
              {currentStep === 0 && 'STATUS: STANDBY'}
              {currentStep === 1 && 'STEP 1: USER CLICK & CRASH'}
              {currentStep === 2 && 'STEP 2: EDGE PII SCRUBBING'}
              {currentStep === 3 && 'STEP 3: AI ROOT CAUSE SYNTHESIS'}
              {currentStep === 4 && 'STEP 4: PLAYWRIGHT HEADLESS REPLAY'}
              {currentStep === 5 && 'STEP 5: REPRODUCED & GUARDED'}
            </span>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={startSimulation}
              disabled={isPlaying}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-[#111] text-white hover:bg-black'
              } disabled:opacity-50`}
            >
              <Play className={`w-3 h-3 ${isPlaying ? 'animate-spin' : ''}`} />
              <span>{isPlaying ? 'EXECUTING...' : 'TRIGGER SIMULATION'}</span>
            </button>

            <button
              onClick={resetSimulation}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/10 text-white/60' : 'border-black/10 hover:bg-black/5 text-black/60'
              }`}
              title="Reset Sandbox"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dual-Pane Core View: Left = Web App Simulation / Right = ReproLens Diagnostic AI & Playwright */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* LEFT PANE (Col 6): The Monitored Customer Web App */}
          <div className={`lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r ${
            isDark ? 'border-white/[0.08] bg-[#0C0E14]' : 'border-black/[0.06] bg-slate-50/70'
          }`}>
            
            {/* Edge Laser Sanitization Scanline Overlay */}
            {currentStep === 2 && (
              <div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-40 pointer-events-none animate-bounce shadow-[0_0_15px_#10b981]"
                style={{ top: '40%' }}
              />
            )}

            {/* Virtual Cursor Animation */}
            {isPlaying && (
              <div
                className="absolute w-5 h-5 pointer-events-none z-50 transition-all duration-500 ease-out"
                style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
              >
                <svg className="w-5 h-5 text-red-500 fill-current drop-shadow-md" viewBox="0 0 24 24">
                  <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.439v-20.56z" />
                </svg>
                {isClicking && (
                  <span className="absolute -top-2 -left-2 w-9 h-9 rounded-full bg-red-500/40 animate-ping inline-block" />
                )}
              </div>
            )}

            <div className="space-y-6">
              {/* Fake Browser App Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-wider font-mono">
                    CUSTOMER CHECKOUT PORTAL
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>EXTENSION HOOKED</span>
                </div>
              </div>

              {/* Checkout Card Form */}
              <div className={`p-5 rounded-2xl border space-y-4 shadow-sm ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-black/10'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-inherit text-xs">
                  <div>
                    <div className="font-bold">Enterprise Cloud License</div>
                    <div className="text-[11px] opacity-60">12 Autonomous Agents &bull; 1 Year</div>
                  </div>
                  <div className="text-base font-extrabold font-mono">$49.00</div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase opacity-60 mb-1">Customer Email</label>
                    <div className={`p-2 rounded-lg border font-mono text-[11px] ${
                      currentStep >= 2
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-black/10'
                    }`}>
                      {currentStep >= 2 ? '[REDACTED_EMAIL]' : 'jane.cooper@global-fintech.com'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase opacity-60 mb-1">Credit Card Number</label>
                    <div className={`p-2 rounded-lg border font-mono text-[11px] ${
                      currentStep >= 2
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-black/10'
                    }`}>
                      {currentStep >= 2 ? '•••• •••• •••• 4242 [LUHN_MASKED]' : '4242 4242 4242 4242'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase opacity-60 mb-1">Bearer Auth Token</label>
                    <div className={`p-2 rounded-lg border font-mono text-[11px] ${
                      currentStep >= 2
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-black/10'
                    }`}>
                      {currentStep >= 2 ? '[REDACTED_AUTH_HEADER]' : 'Bearer eyJhbGciOiJIUzI1NiIsInR5c...'}
                    </div>
                  </div>
                </div>

                {/* THE TRIGGER BUTTON */}
                <button
                  id="pay-now-btn"
                  onClick={startSimulation}
                  disabled={isPlaying}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer ${
                    currentStep === 1
                      ? 'bg-red-600 text-white animate-pulse shadow-red-500/40'
                      : isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-[#111] text-white hover:bg-black'
                  }`}
                >
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>{currentStep === 1 ? 'EXCEPTION TRIGGERED (HTTP 500)' : 'SIMULATE CRASH: CLICK PAY $49'}</span>
                </button>
              </div>

              {/* Exception Banner when Triggered */}
              {currentStep >= 1 && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>RUNTIME FAULT INTERCEPTED</span>
                  </div>
                  <div className="text-[11px] opacity-90 leading-tight">
                    {currentData.exception}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Guarantee */}
            <div className={`pt-4 border-t flex items-center justify-between text-[11px] font-mono ${
              isDark ? 'border-white/[0.06] text-white/50' : 'border-black/[0.06] text-black/50'
            }`}>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Zero PII Escapes Edge
              </span>
              <span>Latency: 4.2ms</span>
            </div>
          </div>

          {/* RIGHT PANE (Col 6): The ReproLens Autonomous AI & Playwright Terminal */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-black text-white font-mono">
            <div className="space-y-4">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                <div className="flex items-center space-x-2 text-white/80">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold uppercase tracking-wider">reprolens-runner // stdout</span>
                </div>
                <span className="text-[10px] text-white/40">ISOLATED SANDBOX</span>
              </div>

              {/* Live Terminal Output Streams */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-white/80 min-h-[160px] overflow-y-auto">
                {currentStep === 0 && (
                  <div className="text-white/40 flex items-center gap-2 py-8 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin text-white/20" />
                    <span>Standing by. Click "SIMULATE CRASH" on the left to begin...</span>
                  </div>
                )}

                {currentStep >= 1 && (
                  <div className="space-y-1.5">
                    {currentData.terminalOutput.slice(0, currentStep + 1).map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                        <span className="text-emerald-400 select-none">&gt;</span>
                        <span className={idx === currentStep ? 'text-white font-bold' : 'text-white/70'}>
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3+: AI Root-Cause Code Diff */}
              {currentStep >= 3 && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Synthesized Defensive Patch</span>
                    </span>
                    <span className="text-white/40 text-[10px]">CONFIDENCE: 99.8%</span>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] overflow-x-auto leading-relaxed text-white/90">
                    {currentData.fixedDiff}
                  </pre>
                </div>
              )}

              {/* Step 5: Regression Test Ready */}
              {currentStep >= 4 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Playwright Spec Ready for CI/CD</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded uppercase">Pass 100%</span>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Auto-generated spec guarantees checkout never regresses under network timeouts.
                  </p>
                </div>
              )}
            </div>

            {/* Terminal Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                onClick={handleCopySpec}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSpec ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSpec ? 'COPIED PLAYWRIGHT SPEC' : 'COPY @playwright/test'}</span>
              </button>

              <button
                onClick={onDownloadExtension}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-white/10"
              >
                <span>DOWNLOAD EXTENSION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
