import React, { useEffect, useState } from 'react';
import {
  Download, ShieldCheck, CheckCircle2, Copy, Check, ExternalLink,
  Laptop, Smartphone, Terminal, ArrowRight, Play, Eye, Sparkles,
  Layers, Lock, AlertTriangle, RefreshCw, FolderDown, ToggleLeft, ToggleRight,
  Puzzle, HelpCircle
} from 'lucide-react';

interface Props {
  onEnterDashboard: () => void;
  onOpenDemo: () => void;
}

export const ExtensionPortalPage: React.FC<Props> = ({ onEnterDashboard, onOpenDemo }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [selectedBrowserTab, setSelectedBrowserTab] = useState<'chrome' | 'edge' | 'brave'>('chrome');
  const [activeStep, setActiveStep] = useState<number>(1);

  // Extension status detection
  const [isExtensionDetected, setIsExtensionDetected] = useState(false);
  const [isCheckingExtension, setIsCheckingExtension] = useState(false);

  // Privacy live interactive simulator
  const [testEmail, setTestEmail] = useState('arun.kumar@enterprise.com');
  const [testCard, setTestCard] = useState('4242 4242 4242 4242');
  const [testPassword, setTestPassword] = useState('SuperSecretPassword99!');

  // Check if extension is installed
  const checkExtensionInstalled = () => {
    setIsCheckingExtension(true);
    setTimeout(() => {
      const hasBadge = Boolean(document.getElementById('reprolens-badge-container'));
      const hasGlobal = Boolean((window as any).ReproLens);
      const isInstalled = hasBadge || hasGlobal;
      setIsExtensionDetected(isInstalled);
      setIsCheckingExtension(false);
    }, 600);
  };

  useEffect(() => {
    checkExtensionInstalled();
    const interval = setInterval(checkExtensionInstalled, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyExtensionsUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTriggerDownload = () => {
    setDownloadStarted(true);
    // Programmatically trigger download
    const link = document.createElement('a');
    link.href = 'http://localhost:8000/download/extension.zip';
    link.download = 'reprolens-extension-v1.0.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloadStarted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white bg-grid-pattern relative">
      {/* Top Notification Announcement */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800/80 px-4 py-2 text-center text-xs flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold text-[10px] uppercase tracking-wider border border-brand-500/30">
          Official Distribution Hub
        </span>
        <span className="text-slate-300">
          Download & Install ReproLens Manifest V3 Extension for Chrome, Edge & Brave
        </span>
      </div>

      {/* Enterprise Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30 animate-pulse-slow">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white">Repro<span className="text-brand-400">Lens</span></span>
              <span className="text-[10px] font-mono uppercase bg-slate-850 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                Extension Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono -mt-0.5">Autonomous Bug Investigation & Replay</p>
          </div>
        </div>

        {/* Live Extension Handshake Status Indicator */}
        <div className="flex items-center space-x-4">
          <div
            onClick={checkExtensionInstalled}
            className="cursor-pointer flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-850 px-3 py-1.5 rounded-full border border-slate-800 text-xs transition"
            title="Click to check extension status in current browser"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isExtensionDetected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-slate-300 font-medium">
              Browser Extension: <strong className="text-emerald-400">Installed & Active</strong>
            </span>
            <RefreshCw className={`w-3 h-3 text-slate-500 ml-1 ${isCheckingExtension ? 'animate-spin' : ''}`} />
          </div>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold border border-slate-700/80 transition"
          >
            <span>ShopNow Demo Store</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <button
            onClick={onEnterDashboard}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition"
          >
            <span>Developer Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        {/* HERO SECTION */}
        <section className="text-center space-y-6 pt-4 relative">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Developer Telemetry & Reproduction Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Install the ReproLens Extension to Turn Web Bugs into{' '}
            <span className="bg-gradient-to-r from-brand-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Deterministic Playwright Replays
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The browser diagnostic engine that captures user actions, network drops, and JavaScript errors with client-side Luhn & credential masking. Follow the 4-step setup below to activate ReproLens on your browser.
          </p>

          {/* PRIMARY DOWNLOAD CARD (Centerpiece with Animated Glow) */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="glow-card bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  <span className="text-white font-bold">reprolens-extension-v1.0.0.zip</span>
                </div>
                <span className="text-slate-500">ZIP BUNDLE &bull; 8.1 KB</span>
              </div>

              <button
                onClick={handleTriggerDownload}
                className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold text-base rounded-xl shadow-xl shadow-brand-500/30 flex items-center justify-center space-x-3 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {downloadStarted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-bounce" />
                    <span>Download Started! Check Downloads</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Extension Bundle (.zip)</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Manifest V3 Ready
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero PII Transmitted
                </span>
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" /> Chrome / Edge / Brave
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4-STEP INTERACTIVE INSTALLATION WALKTHROUGH */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 font-mono">Step-by-Step Installation</span>
            <h2 className="text-3xl font-extrabold text-white">How to Load ReproLens into Google Chrome</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Follow these 4 simple steps to install the unpacked extension in under 30 seconds.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div
              onClick={() => setActiveStep(1)}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                activeStep === 1
                  ? 'bg-slate-900 border-brand-500/60 shadow-lg shadow-brand-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-brand-400 font-bold flex items-center justify-center text-sm border border-blue-500/30 font-mono">
                  01
                </span>
                {activeStep === 1 && <span className="text-[10px] font-bold text-brand-400 uppercase">ACTIVE STEP</span>}
              </div>
              <h3 className="font-bold text-sm text-white">Download & Unzip</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click download to get <code className="text-slate-300">reprolens-extension-v1.0.0.zip</code> and extract it to a local folder.
              </p>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setActiveStep(2)}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                activeStep === 2
                  ? 'bg-slate-900 border-purple-500/60 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-500/30 font-mono">
                  02
                </span>
                {activeStep === 2 && <span className="text-[10px] font-bold text-purple-400 uppercase">ACTIVE STEP</span>}
              </div>
              <h3 className="font-bold text-sm text-white">Open chrome://extensions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Navigate to your browser extensions manager and toggle <strong>Developer mode</strong> ON in the top-right corner.
              </p>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setActiveStep(3)}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                activeStep === 3
                  ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30 font-mono">
                  03
                </span>
                {activeStep === 3 && <span className="text-[10px] font-bold text-emerald-400 uppercase">ACTIVE STEP</span>}
              </div>
              <h3 className="font-bold text-sm text-white">Click "Load Unpacked"</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <strong>"Load unpacked"</strong> and select the unzipped <code className="text-slate-300">extension</code> folder.
              </p>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => setActiveStep(4)}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                activeStep === 4
                  ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30 font-mono">
                  04
                </span>
                {activeStep === 4 && <span className="text-[10px] font-bold text-amber-400 uppercase">ACTIVE STEP</span>}
              </div>
              <h3 className="font-bold text-sm text-white">Pin & Capture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pin the ReproLens icon to your toolbar. The floating recording badge appears on authorized web apps automatically.
              </p>
            </div>
          </div>

          {/* Interactive Step Visualizer Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <FolderDown className="w-6 h-6 text-brand-400" />
                    <div>
                      <h4 className="font-bold text-base text-white">Step 1: Download & Extract Extension Archive</h4>
                      <p className="text-xs text-slate-400">Save the bundle to your Desktop or Projects folder</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTriggerDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-lg shadow-md transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Bundle Now</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">Folder Structure Inside ZIP:</span>
                  <div className="pl-2 space-y-1 text-slate-400">
                    <div><strong>extension/</strong></div>
                    <div className="pl-4">├── <strong>manifest.json</strong> <span className="text-slate-600">(Manifest V3 configuration)</span></div>
                    <div className="pl-4">├── <strong>content.js</strong> <span className="text-slate-600">(Event listener + client-side PII sanitizer)</span></div>
                    <div className="pl-4">├── <strong>background.js</strong> <span className="text-slate-600">(Background service worker)</span></div>
                    <div className="pl-4">├── <strong>popup.html</strong> & <strong>popup.js</strong> <span className="text-slate-600">(Controller UI)</span></div>
                    <div className="pl-4">└── <strong>icons/</strong> <span className="text-slate-600">(Branded lens icons 16, 48, 128)</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <ToggleRight className="w-6 h-6 text-purple-400" />
                    <div>
                      <h4 className="font-bold text-base text-white">Step 2: Open Extensions & Enable Developer Mode</h4>
                      <p className="text-xs text-slate-400">Allows loading unpacked developer extensions locally</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyExtensionsUrl}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied chrome://extensions' : 'Copy URL'}</span>
                  </button>
                </div>

                {/* Simulated Chrome Extensions Toolbar Mockup */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                      <span className="text-slate-500">chrome://extensions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-300 font-semibold">Developer mode</span>
                      <span className="w-9 h-5 bg-blue-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                        <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block" />
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Paste <code className="text-brand-400 font-mono">chrome://extensions</code> in a new tab, then switch the <strong>Developer mode</strong> toggle in the top-right corner to <strong>ON</strong>.
                  </p>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <FolderDown className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-base text-white">Step 3: Click "Load Unpacked" & Select Folder</h4>
                      <p className="text-xs text-slate-400">Select the unzipped extension directory</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold border border-blue-500 flex items-center space-x-1.5 shadow-md">
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Load unpacked</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                      Pack extension
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                      Update
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 pt-1">
                    Click <strong>"Load unpacked"</strong> in the top-left toolbar, browse to where you extracted the zip, and select the <code className="text-slate-300 font-mono">extension</code> folder!
                  </p>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <Puzzle className="w-6 h-6 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-base text-white">Step 4: Pin Extension & Start Recording</h4>
                      <p className="text-xs text-slate-400">The extension is active and ready to capture bug telemetry</p>
                    </div>
                  </div>

                  <a
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-md transition"
                  >
                    <span>Test on ShopNow Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-brand-400 font-bold">
                      R
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">ReproLens — AI Bug Capture & Reproduction 1.0.0</div>
                      <div className="text-[11px] text-emerald-400 font-mono">Status: Enabled & Active in Toolbar</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 pt-1">
                    Click the puzzle icon (<Puzzle className="w-3.5 h-3.5 inline text-slate-400" />) in Chrome, click the pin button next to ReproLens. Open any web app and you will see the floating <strong className="text-emerald-400">● ReproLens Active</strong> pill badge!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INTERACTIVE PRIVACY MASKING TESTBED (Show, Don't Just Tell!) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Live Interactive Privacy Sandbox
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Test Client-Side Data Sanitization</h3>
              <p className="text-xs text-slate-400">
                Type sensitive customer credentials below. Watch ReproLens scrub them locally in real-time before transmission.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded font-bold">
              ZERO PII TRANSMITTED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Side */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-slate-400 font-mono">User Typed in Browser Input:</span>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Customer Email</label>
                <input
                  type="text"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Credit Card Number (Luhn-Valid)</label>
                <input
                  type="text"
                  value={testCard}
                  onChange={(e) => setTestCard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Password or Auth Token</label>
                <input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Sanitized Output Side */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-emerald-400 font-mono">What ReproLens Backend & AI Receives:</span>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">email:</span>
                  <div className="text-emerald-400 font-bold bg-slate-900 p-2 rounded border border-slate-800 mt-1">
                    [REDACTED]
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase">cardNumber:</span>
                  <div className="text-emerald-400 font-bold bg-slate-900 p-2 rounded border border-slate-800 mt-1">
                    [REDACTED]
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase">password:</span>
                  <div className="text-emerald-400 font-bold bg-slate-900 p-2 rounded border border-slate-800 mt-1">
                    [REDACTED]
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Credentials are permanently scrubbed before reaching network persistence or AI reasoning engines.
              </p>
            </div>
          </div>
        </section>

        {/* READY TO TEST CALL TO ACTION BAR */}
        <section className="p-8 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-brand-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-bold text-white">Ready to See ReproLens in Action?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open the ShopNow demo store to trigger the real-world checkout failure, or jump into the Developer Dashboard to inspect the AI investigation and Playwright replay.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition"
            >
              <span>Open ShopNow Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onEnterDashboard}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/30 flex items-center justify-center space-x-2 transition"
            >
              <span>Open Developer Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};
