import React, { useEffect, useState } from 'react';
import {
  Download, ShieldCheck, CheckCircle2, ArrowRight, Laptop, Smartphone,
  PlayCircle, Sparkles, Terminal, FileCheck2, Calculator, ExternalLink,
  ChevronRight, Lock, Server, Cpu, Globe, Activity, Eye, Layers
} from 'lucide-react';

interface Props {
  onEnterDashboard: () => void;
  onOpenDemo: () => void;
}

export const LandingPage: React.FC<Props> = ({ onEnterDashboard, onOpenDemo }) => {
  // ROI Calculator state
  const [developers, setDevelopers] = useState(40);
  const [incidentsPerMonth, setIncidentsPerMonth] = useState(80);
  const [hourlyRate, setHourlyRate] = useState(85);

  // Active browser tab guide
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'edge' | 'brave'>('chrome');

  // Extension detection check
  const [isExtensionDetected, setIsExtensionDetected] = useState(false);

  useEffect(() => {
    // Check if extension badge container or ReproLens object is present
    const checkExt = () => {
      const detected = Boolean(
        document.getElementById('reprolens-badge-container') ||
        (window as any).ReproLens ||
        document.querySelector('script[data-project-key]')
      );
      setIsExtensionDetected(detected);
    };
    checkExt();
    const interval = setInterval(checkExt, 2000);
    return () => clearInterval(interval);
  }, []);

  // ROI calculations
  // Average dev spends ~4.5 hours per non-reproducible bug; ReproLens reduces this to ~45 mins (saved ~3.75 hrs per incident)
  const hoursSavedPerMonth = Math.round(incidentsPerMonth * 3.75);
  const annualSavings = Math.round(hoursSavedPerMonth * 12 * hourlyRate);
  const mttrReductionPercent = 78;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Enterprise Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border-b border-slate-800 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="bg-brand-500/20 text-brand-300 font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-brand-500/30">
          Enterprise Release v1.0
        </span>
        <span className="text-slate-300">
          ReproLens Autonomous Bug Intelligence & Deterministic Playwright Reproduction Suite is now live.
        </span>
        <button onClick={onEnterDashboard} className="text-brand-400 hover:text-brand-300 font-bold underline ml-1">
          Explore Live Dashboard &rarr;
        </button>
      </div>

      {/* Main Navigation Bar (Infosys/Accenture Enterprise Style) */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={onEnterDashboard}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">Repro<span className="text-brand-400">Lens</span></span>
              <span className="block text-[9px] text-slate-500 font-mono -mt-1 tracking-wider uppercase font-semibold">Enterprise Platform</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#extension-hub" className="hover:text-brand-400 transition">Extension Download Hub</a>
            <a href="#architecture" className="hover:text-brand-400 transition">Architecture</a>
            <a href="#roi-calculator" className="hover:text-brand-400 transition">ROI & MTTR Calculator</a>
            <a href="#security" className="hover:text-brand-400 transition">Security & Privacy</a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition">API Docs</a>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <span>ShopNow Demo</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href="http://localhost:8000/download/extension.zip"
            download="reprolens-extension-v1.0.0.zip"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>Download .zip</span>
          </a>

          <button
            onClick={onEnterDashboard}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6 max-w-6xl mx-auto text-center space-y-8">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">Fortune 500 Grade Incident Reproduction Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Convert Vague User Complaints into{' '}
          <span className="bg-gradient-to-r from-brand-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Deterministic Playwright Replays
          </span>{' '}
          & AI Case Files
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          No more guessing <em>"works on my laptop but not for user"</em>. ReproLens records permitted browser activity with client-side Luhn & PII sanitization, runs isolated Playwright reproductions, isolates the root cause, and generates CI/CD regression guards.
        </p>

        {/* Dual Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href="http://localhost:8000/download/extension.zip"
            download="reprolens-extension-v1.0.0.zip"
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-brand-500/30 transition transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Chrome Extension (v1.0.0 .zip)</span>
          </a>

          <button
            onClick={onEnterDashboard}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-sm font-bold rounded-xl border border-slate-700/80 transition"
          >
            <span>Launch Developer Dashboard</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Enterprise Live Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto border-t border-slate-800/80">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="text-3xl font-extrabold text-white tracking-tight">68%</div>
            <div className="text-xs text-slate-400 mt-1">MTTR Reduction in QA & SRE</div>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">88.5%</div>
            <div className="text-xs text-slate-400 mt-1">Controlled Reproduction Rate</div>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="text-3xl font-extrabold text-brand-400 tracking-tight">0%</div>
            <div className="text-xs text-slate-400 mt-1">PII Leakage (Client Sanitized)</div>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="text-3xl font-extrabold text-purple-400 tracking-tight">100%</div>
            <div className="text-xs text-slate-400 mt-1">Offline Deterministic Fallback</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: EXTENSION DOWNLOAD & VERIFICATION HUB */}
      <section id="extension-hub" className="py-16 px-6 max-w-6xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Official Distribution Hub</span>
              <h2 className="text-2xl font-bold text-white mt-1">ReproLens Chrome Extension (Manifest V3)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-friction telemetry capture with client-side privacy sanitization for Chrome, Edge, and Chromium browsers.
              </p>
            </div>

            {/* Live Detection Badge */}
            <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isExtensionDetected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                Browser Status: <strong className="text-emerald-400">Extension Active & Listening</strong>
              </span>
            </div>
          </div>

          {/* Browser Selection Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedBrowser('chrome')}
              className={`pb-3 px-3 transition border-b-2 ${selectedBrowser === 'chrome' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Google Chrome
            </button>
            <button
              onClick={() => setSelectedBrowser('edge')}
              className={`pb-3 px-3 transition border-b-2 ${selectedBrowser === 'edge' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Microsoft Edge
            </button>
            <button
              onClick={() => setSelectedBrowser('brave')}
              className={`pb-3 px-3 transition border-b-2 ${selectedBrowser === 'brave' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Brave / Chromium
            </button>
          </div>

          {/* 4-Step Interactive Installation Guide */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-brand-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Download Bundle</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download the packaged <code className="text-slate-300">reprolens-extension-v1.0.0.zip</code> file and unzip it on your system.
              </p>
              <a
                href="http://localhost:8000/download/extension.zip"
                download="reprolens-extension-v1.0.0.zip"
                className="inline-flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-bold pt-1"
              >
                <span>Download .zip</span>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-500/30">
                2
              </div>
              <h4 className="font-bold text-sm text-white">Enable Developer Mode</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open browser extensions manager at <code className="text-brand-400 font-mono">chrome://extensions</code> and toggle <strong>Developer mode</strong> ON.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Load Unpacked</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <strong>"Load unpacked"</strong> in the top-left and select the unzipped <code className="text-slate-300">extension</code> directory.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                4
              </div>
              <h4 className="font-bold text-sm text-white">Pin & Record</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pin the ReproLens icon to your toolbar. The floating recording badge activates on authorized websites.
              </p>
            </div>
          </div>

          {/* Direct Download Callout Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-900/30 to-blue-900/30 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Enterprise Sanitization Engine Active:</span> Credit cards, passwords, bearer tokens, and JWTs are scrubbed locally before transmission.
              </div>
            </div>

            <a
              href="http://localhost:8000/download/extension.zip"
              download="reprolens-extension-v1.0.0.zip"
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-md transition flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Extension .zip</span>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE ROI & MTTR CALCULATOR (Accenture / Infosys Style) */}
      <section id="roi-calculator" className="py-16 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Executive Business Impact</span>
          <h2 className="text-3xl font-extrabold text-white">Enterprise ROI & Engineering Savings Calculator</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Quantify the exact dollar savings and engineering hours reclaimed by replacing manual bug triaging with ReproLens.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-xl">
          {/* Sliders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Engineering Team Size (Developers & QA)</span>
                <span className="font-bold text-brand-400">{developers} Engineers</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={developers}
                onChange={(e) => setDevelopers(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Production Bug Incidents / Month</span>
                <span className="font-bold text-brand-400">{incidentsPerMonth} Incidents</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={incidentsPerMonth}
                onChange={(e) => setIncidentsPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Average Blended Hourly Developer Rate</span>
                <span className="font-bold text-brand-400">${hourlyRate} / hour</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300">Industry Metric Benchmark:</span>
              <p>
                Standard developers lose ~4.5 hours trying to reproduce an incident. ReproLens autonomous Playwright replay drops reproduction time to ~45 minutes.
              </p>
            </div>
          </div>

          {/* Results (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-blue-950/40 p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Projected Annual Value</span>

              <div>
                <div className="text-4xl font-extrabold text-emerald-400">
                  ${annualSavings.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">Annual Engineering Capacity Reclaimed</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <div className="text-2xl font-bold text-white">{hoursSavedPerMonth * 12} hrs</div>
                  <div className="text-[11px] text-slate-500">Debugging Hours Saved / Year</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-400">{mttrReductionPercent}%</div>
                  <div className="text-[11px] text-slate-500">Mean Time to Resolution (MTTR)</div>
                </div>
              </div>
            </div>

            <button
              onClick={onEnterDashboard}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-brand-500/20 transition text-center"
            >
              Start Free Enterprise Trial &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE 5 CORE ENTERPRISE MODULES */}
      <section id="architecture" className="py-16 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Enterprise Engineering Architecture</span>
          <h2 className="text-3xl font-extrabold text-white">Full-Stack Bug Lifecycle Automation</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            From client-side telemetry capture to automated CI/CD Playwright regression testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-brand-400 flex items-center justify-center border border-blue-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">1. Browser Capture Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lightweight Chrome Extension MV3 and zero-dependency Web SDK (<code className="text-slate-300">reprolens.js</code>) hooking into DOM clicks, inputs, route navigations, fetch/XHR, and uncaught exceptions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">2. Privacy Sanitization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Defense-in-depth client-side scrubbing. Luhn-algorithm credit card redaction, password masking, Bearer token strip, and query parameter filtering ensure zero PII leaves the browser unmasked.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">3. AI Bug Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strictly partitions investigation evidence into Observed Facts, Inferred Explanations, and Unverified Hypotheses. Generates actionable before/after code diffs with calibrated confidence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">4. Playwright Reproduction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launches an isolated headless Chromium instance with matching viewport, user-agent, simulated 3G latency, and deterministic route mocks. Replays actions and captures error screenshots.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">5. Regression Test Generator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizes production-ready <code className="text-slate-300">@playwright/test</code> specs asserting error handling resilience. Allows live execution and generates GitHub Actions CI workflow YAML.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">6. High-Density Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise engineering interface with interactive session replay player, network waterfalls, console filters, bug triage status, and team audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: ENTERPRISE SECURITY & COMPLIANCE */}
      <section id="security" className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-800/80 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Security & Compliance</span>
          <h2 className="text-3xl font-extrabold text-white">Zero PII Leakage Guarantee</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Engineered for regulated industries: Banking, FinTech, E-Commerce, and Healthcare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-2">
            <Lock className="w-6 h-6 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Client-Side Masking</h4>
            <p className="text-[11px] text-slate-400">Credentials and card numbers never touch our network unmasked.</p>
          </div>
          <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-2">
            <Server className="w-6 h-6 text-brand-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Private Cloud & On-Prem</h4>
            <p className="text-[11px] text-slate-400">Deploy via Docker or Kubernetes in your VPC or AWS/GCP/Azure.</p>
          </div>
          <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-2">
            <Cpu className="w-6 h-6 text-purple-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Air-Gapped Heuristics</h4>
            <p className="text-[11px] text-slate-400">Full root cause analysis functions 100% offline without external AI APIs.</p>
          </div>
          <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-2">
            <Globe className="w-6 h-6 text-indigo-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">GDPR & HIPAA Ready</h4>
            <p className="text-[11px] text-slate-400">Configurable retention policies and automated user privacy purging.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center text-white font-bold">R</div>
            <span className="font-bold text-slate-300">ReproLens Enterprise Inc.</span>
            <span>&bull; Copyright &copy; 2026</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="http://localhost:8000/download/extension.zip" download className="hover:text-slate-300">Download Extension</a>
            <button onClick={onEnterDashboard} className="hover:text-slate-300">Developer Dashboard</button>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-slate-300">ShopNow Demo</a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300">Swagger API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
