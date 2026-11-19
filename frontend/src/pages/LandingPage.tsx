import React, { useEffect, useState } from 'react';
import {
  Download, ShieldCheck, CheckCircle2,
  Terminal, FileCheck2, ExternalLink, ChevronRight, Lock,
  Server, Cpu, Globe, Activity, Eye, Layers, Copy, Check, ToggleRight,
  FolderDown, Puzzle, RefreshCw, Zap, Play, Code2, AlertTriangle,
  ArrowUpRight, Bug, Workflow, Sliders, Database, Braces, Compass,
  Laptop, Sparkles, PlayCircle, Sun, Moon, Volume2, Gauge, Split,
  GitPullRequest, TrendingDown, SquareTerminal, CheckCheck
} from 'lucide-react';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { InteractiveSandbox } from '../components/InteractiveSandbox';
import { N8nWorkflowPipeline } from '../components/N8nWorkflowPipeline';

interface Props {
  onEnterDashboard?: () => void;
  onReplayIntro?: () => void;
}

export const LandingPage: React.FC<Props> = ({ onEnterDashboard, onReplayIntro }) => {
  // Theme state: defaults to dark mode for testing!
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  // Download State
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'define' | 'memory' | 'deploy' | 'vscode' | 'voice' | 'radar'>('install');

  // Enterprise Innovation Suite State
  const [innovationTab, setInnovationTab] = useState<'autoshield' | 'ide' | 'voice' | 'sandbox' | 'radar'>('autoshield');
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1);
  const [sandboxFaultTriggered, setSandboxFaultTriggered] = useState(false);
  const [radarSimulating, setRadarSimulating] = useState(false);
  const [shieldArmed, setShieldArmed] = useState(true);
  const [shieldHits, setShieldHits] = useState(142);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [shieldSimulating, setShieldSimulating] = useState(false);
  const [shieldCopied, setShieldCopied] = useState(false);

  // Extension Chaos Simulator Demo States
  const [demoSlow3G, setDemoSlow3G] = useState(false);
  const [demoForce500, setDemoForce500] = useState(false);
  const [demoFlightRecorder, setDemoFlightRecorder] = useState(true);

  const handleSimulateLandingShield = () => {
    if (shieldSimulating) return;
    setShieldSimulating(true);
    setTimeout(() => {
      setShieldHits((prev) => prev + 1);
      setShieldFlash(true);
      setShieldSimulating(false);
      setTimeout(() => setShieldFlash(false), 2400);
    }, 400);
  };

  const handleCopyShieldSnippet = () => {
    navigator.clipboard.writeText(`<script src="https://cdn.reprolens.com/shield/rpl_cf4a2650.js" async></script>`);
    setShieldCopied(true);
    setTimeout(() => setShieldCopied(false), 2000);
  };

  // Step state for Chrome Extension install
  const [activeStep, setActiveStep] = useState<number>(1);

  // Live Extension Detection
  const [isExtensionDetected, setIsExtensionDetected] = useState(false);
  const [isCheckingExtension, setIsCheckingExtension] = useState(false);

  // Live Extension Radar Animation Showcase (Simulated Bug-Hunting & Auto-Solving)
  const [showcasePhase, setShowcasePhase] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setShowcasePhase((p) => (p + 1) % 4);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Voice Explainer demo speak handler
  const handleToggleVoiceDemo = () => {
    if (!('speechSynthesis' in window)) {
      alert('SpeechSynthesis is not supported in this browser.');
      return;
    }
    if (voicePlaying) {
      window.speechSynthesis.cancel();
      setVoicePlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const text = 'ReproLens diagnostic briefing. Critical TypeError detected in ProjectsGrid.tsx at line 42. State array was hydrated with undefined before API promise resolved. Recommended AST patch: optional chaining with empty array fallback.';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.onend = () => setVoicePlaying(false);
    utterance.onerror = () => setVoicePlaying(false);
    window.speechSynthesis.speak(utterance);
    setVoicePlaying(true);
  };

  // Voice explainer cleanup
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Copy patch demo handler
  const handleCopyPatchDemo = () => {
    navigator.clipboard.writeText(`// ReproLens Verified AST Fallback\nconst safeItems = items?.map((item) => item.title) ?? [];`);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  // Live Interactive Privacy Sanitizer Testbed
  const [testEmail, setTestEmail] = useState('arun.kumar@enterprise.com');
  const [testCard, setTestCard] = useState('4242 4242 4242 4242');
  const [testPassword, setTestPassword] = useState('SuperSecretPassword99!');

  // Live Table Active ReproLens Reproduction Tasks
  const liveTasks = [
    { id: 'TSK-9402', task: 'Cart Checkout 500 Route Replay', region: 'us-east-1', status: 'Reproduced' },
    { id: 'TSK-9401', task: 'Stripe Webhook Bearer Token Sanitization', region: 'eu-west-1', status: 'Sanitized' },
    { id: 'TSK-9400', task: 'Playwright Viewport 1280x720 Headless Trace', region: 'us-west-2', status: 'Running' },
    { id: 'TSK-9399', task: 'Uncaught TypeError in OrderSummary.tsx:42', region: 'ap-south-1', status: 'Fixed' },
    { id: 'TSK-9398', task: 'DOM Clickstream Capture: #pay-now-btn', region: 'sa-east-1', status: 'Completed' },
  ];

  // Extension Check: listens for #reprolens-extension-badge in DOM
  const checkExtensionInstalled = () => {
    setIsCheckingExtension(true);
    setTimeout(() => {
      const badge = document.getElementById('reprolens-extension-badge') || (window as any).__REPROLENS_INSTALLED__;
      const isInstalled = !!badge;
      setIsExtensionDetected(isInstalled);
      setIsCheckingExtension(false);
    }, 400);
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
    const link = document.createElement('a');
    link.href = 'http://localhost:8000/download/extension.zip';
    link.download = 'reprolens-extension-v1.0.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloadStarted(false), 3000);
  };

  // Marquee item arrays
  const marqueeItemsRow1 = [
    'Autonomous Auto-Shield', 'Performance Memory Radar', 'AI Voice RCA Explainer', 'Dual-Reality Split Sandbox',
    'VS Code Deep-Link', 'Zero-Auto-Push GitHub PR Studio', 'Playwright Headless Replay',
    'Luhn Card Redaction', '0-Sec Live Runtime Immunity', 'DOM Clickstream Capture', 'Client-Side Token Strip',
    'Autonomous Auto-Shield', 'Performance Memory Radar', 'AI Voice RCA Explainer', 'Dual-Reality Split Sandbox',
    'VS Code Deep-Link', 'Zero-Auto-Push GitHub PR Studio', 'Playwright Headless Replay',
  ];
  const marqueeItemsRow2 = [
    'Self-Healing Web Immune System', 'JS Heap Leak Velocity', '60 FPS Stall Detection', 'Dual-Reality Component Lab',
    'Natural Audio Standup Brief', '1-Click IDE Dispatch', 'AST Auto-Heal Fallback',
    'Self-Healing Web Immune System', 'JS Heap Leak Velocity', '60 FPS Stall Detection', 'Dual-Reality Component Lab',
    'Natural Audio Standup Brief', '1-Click IDE Dispatch', 'AST Auto-Heal Fallback',
  ];

  return (
    <div
      className={`min-h-screen font-sans antialiased relative overflow-x-hidden transition-colors duration-500 ${
        isDark
          ? 'bg-[#090A0F] text-white selection:bg-white selection:text-black'
          : 'bg-[#F5F4F0] text-[#111] selection:bg-[#111] selection:text-white'
      }`}
    >
      {/* BACKGROUND PARTICLES ANIMATION */}
      <ParticleCanvas theme={theme} />

      {/* FLOATING GLASS HEADER */}
      <div className="fixed top-4 sm:top-5 inset-x-0 z-50 px-3 sm:px-6 w-full max-w-[1580px] mx-auto pointer-events-auto">
        <nav
          className={`flex items-center justify-between gap-2 xl:gap-4 px-4 sm:px-6 py-2.5 rounded-2xl border transition-all duration-300 ${
            isDark ? 'border-white/[0.16]' : 'border-white/70 ring-1 ring-black/[0.06]'
          }`}
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(18, 20, 32, 0.45) 0%, rgba(10, 12, 20, 0.30) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.55) 0%, rgba(245, 244, 240, 0.38) 100%)',
            boxShadow: isDark
              ? '0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.05)'
              : '0 12px 36px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04)'
          }}
        >
          {/* Left: Brand Logo & Engine Indicator */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <a href="#" className="flex items-center space-x-2 group">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm transition group-hover:scale-105 ${
                isDark ? 'bg-white text-black' : 'bg-[#111] text-white'
              }`}>
                <span className="font-pixel text-[11px]">R</span>
              </div>
              <span className={`font-pixel text-xs tracking-[0.22em] font-extrabold whitespace-nowrap ${isDark ? 'text-white' : 'text-black'}`}>
                REPROLENS
              </span>
            </a>
            <span
              className={`hidden 2xl:inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${
                isDark ? 'bg-white/5 text-white/60 border-white/10' : 'bg-black/5 text-black/60 border-black/10'
              }`}
            >
              MV3 ENGINE
            </span>
          </div>

          {/* Center: Clean Spaced Navigation Links */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 min-w-0">
            <a
              href="#platform"
              className={`text-[11px] xl:text-xs px-2 xl:px-3 py-1.5 rounded-xl transition font-medium whitespace-nowrap ${
                isDark ? 'text-white/75 hover:text-white hover:bg-white/10' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              Platform
            </a>

            <a
              href="#sandbox"
              className={`text-[11px] xl:text-xs px-2.5 xl:px-3.5 py-1.5 rounded-xl transition font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                isDark
                  ? 'text-amber-400 bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25'
                  : 'text-amber-800 bg-amber-100/70 border border-amber-300/60 hover:bg-amber-100'
              }`}
            >
              <span>Live Sandbox</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
            </a>

            <a
              href="#agents"
              className={`text-[11px] xl:text-xs px-2 xl:px-3 py-1.5 rounded-xl transition font-medium whitespace-nowrap ${
                isDark ? 'text-white/75 hover:text-white hover:bg-white/10' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              Agents
            </a>

            <a
              href="#services"
              className={`text-[11px] xl:text-xs px-2 xl:px-3 py-1.5 rounded-xl transition font-medium whitespace-nowrap ${
                isDark ? 'text-white/75 hover:text-white hover:bg-white/10' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              Services &amp; n8n Pipeline
            </a>

            <a
              href="#privacy"
              className={`text-[11px] xl:text-xs px-2 xl:px-3 py-1.5 rounded-xl transition font-medium whitespace-nowrap ${
                isDark ? 'text-white/75 hover:text-white hover:bg-white/10' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              Privacy Shield
            </a>

            <a
              href="#download"
              className={`text-[11px] xl:text-xs px-2 xl:px-3 py-1.5 rounded-xl transition font-medium whitespace-nowrap ${
                isDark ? 'text-white/75 hover:text-white hover:bg-white/10' : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              Extension Hub
            </a>
          </div>

          {/* Right: Actions (Status, Theme Toggle & Download CTA) */}
          <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
            {/* Live Extension Detection Indicator */}
            <div
              onClick={checkExtensionInstalled}
              className={`cursor-pointer hidden 2xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono transition whitespace-nowrap ${
                isDark ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15' : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/10'
              }`}
              title="Extension Status"
            >
              <span className={`w-2 h-2 rounded-full ${isExtensionDetected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-emerald-500 animate-pulse'}`} />
              <span className={`font-medium ${isDark ? 'text-white/85' : 'text-black/75'}`}>Extension Active</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-mono cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-white/[0.08] border-white/15 text-amber-400 hover:bg-white/15 shadow-sm'
                  : 'bg-white/50 border-black/10 text-black/80 hover:bg-white/80 shadow-sm'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-black/70" />}
              <span className="text-[10px] font-bold tracking-wider">{isDark ? 'LIGHT' : 'DARK'}</span>
            </button>

            {/* High-End Interactive Download CTA Button */}
            <button
              onClick={handleTriggerDownload}
              className={`group relative overflow-hidden px-3.5 xl:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-lg select-none whitespace-nowrap ${
                isDark
                  ? 'bg-gradient-to-r from-white via-slate-100 to-white text-[#0A0B10] shadow-[0_0_25px_rgba(255,255,255,0.2)] border border-white'
                  : 'bg-[#111] text-white hover:bg-black shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-black/80'
              }`}
            >
              {/* Shimmer Light Reflection on Hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

              {/* Dynamic Icon Badge */}
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-transform group-hover:translate-y-0.5 duration-200 shrink-0 ${
                isDark ? 'bg-black/10 text-[#0A0B10]' : 'bg-white/15 text-white'
              }`}>
                {downloadStarted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 animate-pulse" />
                ) : (
                  <Download className="w-3 h-3 group-hover:animate-bounce" />
                )}
              </div>

              {/* Main Button Label */}
              <span className="font-mono text-[11px] xl:text-xs font-bold tracking-wider">
                {downloadStarted ? 'DOWNLOADING...' : 'GET EXTENSION'}
              </span>

              {/* High-Tech Version Pill */}
              <span className={`hidden sm:inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                isDark
                  ? 'bg-black/10 text-black/70 border border-black/10'
                  : 'bg-white/15 text-white/90 border border-white/20'
              }`}>
                v1.0
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* SECTION 1: TRUE FULLSCREEN CINEMATIC HERO */}
      <section className="relative min-h-screen h-screen w-full overflow-hidden flex flex-col justify-end">
        {/* Fullscreen Edge-to-Edge Cinematic Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-0 ${
            isDark ? 'opacity-95' : 'opacity-100'
          }`}
          style={{
            objectPosition: 'center center',
          }}
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/agentic-hero-9yW3wnTNMfn2U6lsVhTTZSJFEvAoSj.mp4"
        />

        {/* Smooth Progressive Bottom Gradient Mask - Covers only the bottom text area so video stays 100% visible */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: '52%',
            background: isDark
              ? 'linear-gradient(to top, #090A0F 0%, rgba(9,10,15,0.85) 40%, rgba(9,10,15,0.3) 75%, transparent 100%)'
              : 'linear-gradient(to top, #F5F4F0 0%, rgba(245,244,240,0.85) 40%, rgba(245,244,240,0.3) 75%, transparent 100%)'
          }}
        />

        {/* Hero Content Symmetrically Positioned in the Lower Third */}
        <div className="relative z-20 px-6 md:px-12 pb-12 sm:pb-16 max-w-6xl mx-auto w-full space-y-6">
          <div className="space-y-3">
            <span className={`font-pixel text-[11px] sm:text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              // REPROLENS AUTONOMOUS BUG INTELLIGENCE
            </span>

            <h1 className={`text-4xl sm:text-6xl md:text-7xl font-light leading-[1.02] tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
              Capture &amp;<br />
              reproduce bugs<br />
              while you sleep.
            </h1>
          </div>

          <p className={`text-sm sm:text-base max-w-2xl leading-relaxed ${isDark ? 'text-white/75' : 'text-black/75'}`}>
            Convert vague user bug reports like <em>"Payment button not working"</em> into evidence-backed Playwright replays. Capture telemetry, scrub credentials on the client edge, isolate root causes, and run isolated browser reproductions.
          </p>

          {/* Action Row - ONLY Download Extension, No direct dashboard button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
            <button
              onClick={handleTriggerDownload}
              className={`px-7 py-3.5 text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2.5 tracking-wider uppercase cursor-pointer ${
                isDark ? 'bg-white hover:bg-white/90 text-black shadow-white/10' : 'bg-[#111] hover:bg-black text-white'
              }`}
            >
              {downloadStarted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>DOWNLOADING EXTENSION BUNDLE...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD EXTENSION (v1.0.0 .ZIP)</span>
                </>
              )}
            </button>

            <div
              className={`flex items-center space-x-2 text-xs font-mono px-4 py-2.5 rounded-xl border ${
                isDark ? 'text-white/60 bg-white/5 border-white/10' : 'text-black/60 bg-black/5 border-black/10'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              <span>Dashboard is accessible via the installed Chrome Extension</span>
            </div>

            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className={`flex items-center space-x-2 text-xs font-mono px-4 py-2.5 rounded-xl border transition cursor-pointer select-none ${
                  isDark
                    ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/20 shadow-sm'
                    : 'text-cyan-800 bg-cyan-50 border-cyan-200 hover:bg-cyan-100 shadow-sm'
                }`}
                title="Watch Cinematic ReproLens Intro"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span>WATCH INTRO</span>
              </button>
            )}
          </div>

          {/* Metric Bar */}
          <div className={`grid grid-cols-3 gap-6 pt-5 border-t max-w-md ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div>
              <div className={`text-2xl sm:text-3xl font-light ${isDark ? 'text-white' : 'text-[#111]'}`}>50M+</div>
              <div className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-mono ${isDark ? 'text-white/40' : 'text-black/50'}`}>Events Captured</div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-light ${isDark ? 'text-white' : 'text-[#111]'}`}>99.9%</div>
              <div className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-mono ${isDark ? 'text-white/40' : 'text-black/50'}`}>Replay Fidelity</div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-light ${isDark ? 'text-white' : 'text-[#111]'}`}>0%</div>
              <div className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-mono ${isDark ? 'text-white/40' : 'text-black/50'}`}>PII Leakage</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PLATFORM */}
      <section id="platform" className="relative z-10 py-24 px-6 md:px-12 max-w-6xl mx-auto space-y-12">
        <div className="space-y-3">
          <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>PLATFORM</span>
          <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Everything you need to ship bug reproduction.
          </h2>
          <p className={`text-xs max-w-xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            From client-side telemetry capture to automated CI/CD Playwright regression verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-[#111]'}`}>
              <Eye className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Browser Capture Engine</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Chrome Extension MV3 hooks into user clicks, route navigations, failed HTTP 500 requests, and uncaught exceptions with DOM context.
            </p>
          </div>

          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-[#111]'}`}>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Privacy &amp; Data Shield</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Client-side Luhn-algorithm card masking, password scrubbing, Bearer token strip, and query parameter filtering ensure zero sensitive PII is transmitted.
            </p>
          </div>

          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-[#111]'}`}>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>AI Bug Investigation</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Partitions evidence strictly into Observed Facts, Inferred Explanations, and Unverified Hypotheses. Generates defensive code fixes with calibrated confidence.
            </p>
          </div>

          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-[#111]'}`}>
              <PlayCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Playwright Reproduction</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Launches an isolated headless Chromium instance with matching viewport dimensions, simulated 3G latency, and deterministic route mocks.
            </p>
          </div>

          {/* New Feature 1: Performance & Memory Leak Radar */}
          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-cyan-500/40' : 'border-black/[0.08] bg-white/70 hover:border-cyan-600/40'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'}`}>
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Performance &amp; Memory Radar</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Tracks real-time JS Heap growth velocity in MB/s, catches 60 FPS drops below 30 FPS threshold, and flags main-thread tasks blocking over 50ms.
            </p>
          </div>

          {/* New Feature 2: AI Voice Bug Explainer */}
          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-purple-500/40' : 'border-black/[0.08] bg-white/70 hover:border-purple-600/40'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>AI Voice Bug Explainer</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Synthesizes concise 30-second natural audio briefings of root cause and fix with speed controls (1x, 1.25x, 1.5x) and animated equalizer for on-call triage.
            </p>
          </div>

          {/* New Feature 3: Dual-Reality Split Sandbox */}
          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-pink-500/40' : 'border-black/[0.08] bg-white/70 hover:border-pink-600/40'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-700'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Dual-Reality Split Sandbox</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Simulates Reality A (broken runtime crash) side-by-side with Reality B (AST resilient fallback) live in the browser with zero full-page reloads.
            </p>
          </div>

          {/* New Feature 4: 1-Click IDE Deep-Link & Manual PR Studio */}
          <div className={`p-7 rounded-2xl border backdrop-blur-sm space-y-4 hover:shadow-lg transition ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-emerald-500/40' : 'border-black/[0.08] bg-white/70 hover:border-emerald-600/40'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>IDE Deep-Link &amp; Manual PR Studio</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Direct vscode:// and cursor:// protocol links opening exact lines, instant clipboard patch copy, and zero-auto-push manual GitHub PR confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: ENTERPRISE INNOVATION SUITE (LIVE INTERACTIVE LAB) */}
      <section id="innovation" className={`relative z-10 py-20 px-6 md:px-12 max-w-6xl mx-auto space-y-10 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Enterprise Diagnostic Innovation</span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Five Autonomous Tools Engineered for High-Velocity Teams.
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Experience how ReproLens bridges live runtime browser immunization, developer IDE deep-linking, audio RCA standup briefings, split-component verification, and memory radar.
          </p>
        </div>

        {/* Innovation Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl border max-w-4xl mx-auto bg-black/20 backdrop-blur-md">
          <button
            onClick={() => setInnovationTab('autoshield')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              innovationTab === 'autoshield'
                ? isDark
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-emerald-600 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autonomous Auto-Shield</span>
          </button>

          <button
            onClick={() => setInnovationTab('ide')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              innovationTab === 'ide'
                ? isDark
                  ? 'bg-white text-black shadow-md'
                  : 'bg-black text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>IDE Deep-Link &amp; PR Studio</span>
          </button>

          <button
            onClick={() => setInnovationTab('voice')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              innovationTab === 'voice'
                ? isDark
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-purple-600 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>AI Voice Bug Explainer</span>
          </button>

          <button
            onClick={() => setInnovationTab('sandbox')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              innovationTab === 'sandbox'
                ? isDark
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-pink-600 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual-Reality Split Sandbox</span>
          </button>

          <button
            onClick={() => setInnovationTab('radar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              innovationTab === 'radar'
                ? isDark
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-cyan-600 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Performance &amp; Memory Radar</span>
          </button>
        </div>

        {/* Dynamic Interactive Panel Container */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-md transition-all ${
          isDark ? 'bg-[#121422]/90 border-white/10' : 'bg-white border-black/10'
        }`}>
          {/* TAB 0: AUTONOMOUS AUTO-SHIELD IMMUNE SYSTEM */}
          {innovationTab === 'autoshield' && (
            <div className="space-y-6">
              {/* Live Mitigation Flash Banner */}
              {shieldFlash && (
                <div className="p-4 rounded-2xl bg-emerald-500 text-white font-mono text-xs shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white animate-bounce" />
                    </div>
                    <div>
                      <span className="font-bold block">Live Crash Intercepted &amp; Prevented in 1.1ms!</span>
                      <span className="text-[11px] opacity-90">Visitor encountered zero crash. Safe schema fallback rendered without page reload.</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-black/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    HTTP 200 Preserved
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold uppercase mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>0-Second Runtime Immunity</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    Autonomous Auto-Shield Immune System
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Immunize live client browsers against active crashes with zero server redeployment and sub-1.2ms latency overhead.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShieldArmed(!shieldArmed)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                      shieldArmed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${shieldArmed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{shieldArmed ? 'Status: ARMED' : 'Status: DISARMED'}</span>
                  </button>

                  <button
                    onClick={handleSimulateLandingShield}
                    disabled={shieldSimulating || !shieldArmed}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                      !shieldArmed
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : shieldSimulating
                        ? 'bg-emerald-700 text-white animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{shieldSimulating ? 'Mitigating...' : 'Simulate Visitor Crash Attempt'}</span>
                  </button>
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase">Crashes Prevented:</span>
                  <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                    <span>{shieldHits}</span>
                    <span className="text-xs text-emerald-400 font-normal">live</span>
                  </div>
                  <p className="text-[10px] text-white/50">Runtime AST traps fired</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase">Revenue Protected:</span>
                  <div className="text-2xl font-bold text-white">
                    ${(shieldHits * 49).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-white/50">Prevented checkout abandonments</p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-cyan-400 uppercase">Latency Overhead:</span>
                  <div className="text-2xl font-bold text-white">
                    &lt;1.2ms
                  </div>
                  <p className="text-[10px] text-white/50">Micro-interceptor speed</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <span className="text-[10px] text-purple-400 uppercase">Auto-Expire TTL:</span>
                  <div className="text-2xl font-bold text-white">
                    24h 00m
                  </div>
                  <p className="text-[10px] text-white/50">Cleansed upon PR merge</p>
                </div>
              </div>

              {/* Code Injection Preview */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-white/50 border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">1-Line Production HTML Hook</span>
                  </div>
                  <button
                    onClick={handleCopyShieldSnippet}
                    className="text-white/60 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    {shieldCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{shieldCopied ? 'Copied' : 'Copy Hook'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/80 border border-white/10 text-emerald-300 break-all select-all text-[11px]">
                  {`<script src="https://cdn.reprolens.com/shield/rpl_cf4a2650.js" async></script>`}
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Service Worker and AST trap wrap risky DOM property accesses with defensive schema guards. When permanent GitHub PR merges, the shield automatically de-registers.
                </p>
              </div>
            </div>
          )}
          {/* TAB 1: IDE DEEP-LINK & MANUAL PR STUDIO */}
          {innovationTab === 'ide' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-mono font-bold uppercase mb-1">
                    <Laptop className="w-4 h-4" />
                    <span>Instant Local Developer Dispatch</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    Launch Straight to Error Line in VS Code &amp; Cursor
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Skip searching through directory trees. ReproLens constructs exact line and column protocol URIs with zero manual hunting.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPatchDemo}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPatch ? 'Patch Copied!' : 'Copy Verified AST Patch'}</span>
                  </button>

                  <a
                    href="vscode://file/c:/workspace/ProjectsGrid.tsx:42:15"
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                      isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in VS Code</span>
                  </a>
                </div>
              </div>

              {/* Two Column Preview: URI Protocol + Safe Manual PR Studio Policy */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-black text-white font-mono text-xs space-y-3 border border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-white/50 border-b border-white/10 pb-2">
                    <span>Protocol URI Generator</span>
                    <span className="text-emerald-400 font-bold">URI Verified</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sky-300 break-all select-all">
                    vscode://file/c:/workspace/ProjectsGrid.tsx:42:15
                  </div>
                  <div className="text-[11px] text-white/60">
                    Cursor Alternative: <code className="text-purple-300">cursor://file/c:/workspace/ProjectsGrid.tsx:42:15</code>
                  </div>
                  <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    Jumps cursor directly to line 42, column 15 inside your local editor instance.
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-3 font-mono text-xs ${
                  isDark ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-black/[0.02] border-black/10 text-black'
                }`}>
                  <div className="flex items-center justify-between text-[11px] border-b pb-2 border-white/10">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Manual GitHub PR Studio
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Zero Auto-Push Safe
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-75 font-sans">
                    Your personal repositories and corporate Git branches are never modified automatically. ReproLens opens a manual review modal where you inspect the diff, choose the destination repo, and trigger the push only when you explicitly approve.
                  </p>
                  <div className="text-[11px] space-y-1.5 pt-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Full code diff inspection before committing
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Custom repository target selector
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Zero unsolicited GitHub writes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI VOICE BUG EXPLAINER */}
          {innovationTab === 'voice' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold uppercase mb-1">
                    <Volume2 className="w-4 h-4" />
                    <span>Executive &amp; On-Call Speech Synthesis</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    AI Voice Bug Explainer &amp; Audio RCA
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Listen to natural-speech briefings during daily standups, incident triage, or while on-call.
                  </p>
                </div>

                {/* Voice Speed Selector */}
                <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10 font-mono text-xs">
                  <span className="text-[10px] px-2 text-white/50">SPEED:</span>
                  {[1, 1.25, 1.5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setVoiceSpeed(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        voiceSpeed === s
                          ? 'bg-purple-500 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Controller & Animated Equalizer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <button
                    onClick={handleToggleVoiceDemo}
                    className={`w-full py-4 rounded-2xl font-mono text-xs font-bold tracking-wider transition flex items-center justify-center gap-3 cursor-pointer shadow-xl ${
                      voicePlaying
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {voicePlaying ? (
                      <>
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        <span>STOP AUDIO BRIEFING</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>PLAY 20-SEC AUDIO BRIEFING ({voiceSpeed}x)</span>
                      </>
                    )}
                  </button>

                  {/* 5-Bar Animated Equalizer */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/50 uppercase">Waveform Spectrum:</span>
                    <div className="flex items-end gap-1.5 h-8">
                      <span className={`w-2 bg-purple-400 rounded-full transition-all duration-150 ${voicePlaying ? 'h-7 animate-pulse' : 'h-2'}`} />
                      <span className={`w-2 bg-purple-400 rounded-full transition-all duration-200 ${voicePlaying ? 'h-5 animate-pulse' : 'h-3'}`} />
                      <span className={`w-2 bg-purple-400 rounded-full transition-all duration-100 ${voicePlaying ? 'h-8 animate-pulse' : 'h-2'}`} />
                      <span className={`w-2 bg-purple-400 rounded-full transition-all duration-300 ${voicePlaying ? 'h-6 animate-pulse' : 'h-3'}`} />
                      <span className={`w-2 bg-purple-400 rounded-full transition-all duration-150 ${voicePlaying ? 'h-4 animate-pulse' : 'h-2'}`} />
                    </div>
                  </div>
                </div>

                {/* Synced Audio Transcript Box */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-2 text-white">
                  <div className="flex items-center justify-between text-[11px] text-purple-400 border-b border-white/10 pb-2">
                    <span>Synchronized Live Transcript</span>
                    <span className="text-white/40">Web Speech API</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-sans pt-1">
                    "ReproLens diagnostic briefing. Critical TypeError detected in ProjectsGrid.tsx at line 42. State array was hydrated with undefined before API promise resolved. Recommended AST patch: optional chaining with empty array fallback."
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-white/50 pt-2 border-t border-white/10">
                    <span>Duration: 18.2s</span>
                    <span>Confidence: 94%</span>
                    <span>Status: Calibrated Executive RCA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUAL-REALITY SPLIT SANDBOX */}
          {innovationTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-pink-400 text-xs font-mono font-bold uppercase mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Live Component Isolation Engine</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    Dual-Reality Split Sandbox Simulator
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Test Reality A (unpatched crash) vs Reality B (AST healed fallback) live without refreshing your browser page.
                  </p>
                </div>

                <button
                  onClick={() => setSandboxFaultTriggered(!sandboxFaultTriggered)}
                  className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                    sandboxFaultTriggered
                      ? 'bg-amber-500 hover:bg-amber-600 text-black'
                      : 'bg-pink-600 hover:bg-pink-500 text-white'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>{sandboxFaultTriggered ? 'Reset Sandbox State' : 'Trigger Fault Payload'}</span>
                </button>
              </div>

              {/* Split Dual-Reality Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                {/* Reality A: Unpatched Broken State */}
                <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                    <span className="font-bold text-red-400">REALITY A: UNPATCHED</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {sandboxFaultTriggered ? 'CRASHED' : 'READY'}
                    </span>
                  </div>

                  {sandboxFaultTriggered ? (
                    <div className="space-y-2 p-3 bg-red-950/40 rounded-xl border border-red-500/40 text-red-200">
                      <div className="font-bold text-red-300">TypeError: Cannot read properties of undefined (reading 'items')</div>
                      <div className="text-[10px] text-red-300/70">at ProjectsGrid.tsx:42:15</div>
                      <div className="text-[10px] text-red-400 font-bold">Uncaught runtime failure. Component unmounted.</div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-white/60 text-center py-6">
                      Click "Trigger Fault Payload" above to inject unhandled null state.
                    </div>
                  )}
                </div>

                {/* Reality B: Healed AST Fallback State */}
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="font-bold text-emerald-400">REALITY B: AST HEALED</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {sandboxFaultTriggered ? 'HEALED & RESILIENT' : 'READY'}
                    </span>
                  </div>

                  {sandboxFaultTriggered ? (
                    <div className="space-y-2 p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40 text-emerald-200">
                      <div className="font-bold text-emerald-300">AST Fallback Interceptor Active</div>
                      <div className="text-[10px] text-emerald-300/80">items?.map(...) ?? [] executed gracefully.</div>
                      <div className="text-[10px] text-emerald-400 font-bold">Zero crash. Rendered 3 cached fallback items. 100% uptime preserved.</div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-white/60 text-center py-6">
                      Click "Trigger Fault Payload" to verify mathematical crash mitigation.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERFORMANCE & MEMORY LEAK RADAR */}
          {innovationTab === 'radar' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-1">
                    <Gauge className="w-4 h-4" />
                    <span>Real-Time Heap &amp; Frame Profiler</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    Performance &amp; Memory Leak Radar
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Detect memory leak velocity in MB/s, catch 60 FPS drops below stall line, and isolate blocking long tasks.
                  </p>
                </div>

                <button
                  onClick={() => setRadarSimulating(!radarSimulating)}
                  className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                    radarSimulating
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{radarSimulating ? 'Stop Telemetry Sweep' : 'Simulate Memory Leak Run'}</span>
                </button>
              </div>

              {/* Radar Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-cyan-400 uppercase">Leak Velocity:</span>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>{radarSimulating ? '+4.2 MB/s' : '+0.1 MB/s'}</span>
                    <TrendingDown className={`w-4 h-4 ${radarSimulating ? 'text-red-400 rotate-180' : 'text-emerald-400'}`} />
                  </div>
                  <p className="text-[10px] text-white/50">Heap delta over 10s sample window</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase">FPS Stalls (&lt;30 FPS):</span>
                  <div className="text-2xl font-bold text-white">
                    {radarSimulating ? '3 Dips Detected' : '0 Dips (Stable 60)'}
                  </div>
                  <p className="text-[10px] text-white/50">Main-thread frame render stalls</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <span className="text-[10px] text-purple-400 uppercase">Max Long Task Duration:</span>
                  <div className="text-2xl font-bold text-white">
                    {radarSimulating ? '78ms Blocker' : '14ms Normal'}
                  </div>
                  <p className="text-[10px] text-white/50">Tasks exceeding 50ms threshold</p>
                </div>
              </div>

              {/* SVG Area Chart Visualizer */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                  <span>JS Heap Allocation Timeline (10-Second Continuous Telemetry)</span>
                  <span className="text-cyan-400 font-bold">18 MB &rarr; 46 MB</span>
                </div>

                <svg viewBox="0 0 600 120" className="w-full h-28 overflow-visible">
                  <defs>
                    <linearGradient id="heapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path
                    d={
                      radarSimulating
                        ? 'M 0 100 Q 150 90, 300 60 T 600 20 L 600 120 L 0 120 Z'
                        : 'M 0 95 Q 150 90, 300 88 T 600 85 L 600 120 L 0 120 Z'
                    }
                    fill="url(#heapGrad)"
                    className="transition-all duration-700"
                  />
                  {/* Stroke Line */}
                  <path
                    d={
                      radarSimulating
                        ? 'M 0 100 Q 150 90, 300 60 T 600 20'
                        : 'M 0 95 Q 150 90, 300 88 T 600 85'
                    }
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="3"
                    className="transition-all duration-700"
                  />
                  {/* Critical 30 FPS Stall Line */}
                  <line x1="0" y1="70" x2="600" y2="70" stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="4 4" strokeWidth="1.5" />
                  <text x="10" y="66" fill="#F59E0B" fontSize="9" fontFamily="monospace">STALL LINE THRESHOLD</text>
                </svg>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CENTERPIECE: INTERACTIVE LIVE BUG TRIGGER & AUTO-REPLAY SANDBOX */}
      <InteractiveSandbox theme={theme} onDownloadExtension={handleTriggerDownload} />

      {/* SECTION: AUTONOMOUS N8N-STYLE WORKFLOW PIPELINE & SERVICES (FULL SCREEN EDGE-TO-EDGE) */}
      <section id="services" className={`relative z-10 py-16 px-2 sm:px-6 md:px-10 xl:px-12 w-full space-y-8 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <N8nWorkflowPipeline isDark={isDark} onOpenDashboard={onEnterDashboard} />
      </section>

      {/* SECTION 3: THE 4 REPROLENS AUTONOMOUS AGENTS */}
      <section id="agents" className={`relative z-10 py-24 px-6 md:px-12 max-w-6xl mx-auto space-y-12 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="space-y-3">
          <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>AUTONOMOUS BUG AGENTS</span>
          <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Specialized agents for every stage of bug investigation.
          </h2>
          <p className={`text-xs max-w-xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Each agent has specialized diagnostic capabilities: from telemetry scraping to deterministic browser replay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Agent 1: TELEMETRY RESEARCHER */}
          <div className={`rounded-3xl border backdrop-blur-sm overflow-hidden hover:shadow-xl transition group ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/75'
          }`}>
            <div className={`h-56 flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.03]'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/researcher-CvhqOuV6irGwBOnJoTGFlXdbyYBRjb.png"
                alt="Telemetry Researcher"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-pixel text-xs tracking-[0.2em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>RESEARCHER AGENT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">ACTIVE</span>
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>Web &amp; DOM Telemetry Collector</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                Autonomously listens to DOM clickstreams, form inputs, route navigations, failed network requests (HTTP 500), and console errors without slowing the user down.
              </p>
              <div className={`flex gap-6 pt-3 border-t text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>2.4M</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>sessions captured</span>
                </div>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>98.2%</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>event accuracy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent 2: DIAGNOSTIC CODER */}
          <div className={`rounded-3xl border backdrop-blur-sm overflow-hidden hover:shadow-xl transition group ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/75'
          }`}>
            <div className={`h-56 flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.03]'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/coder-9bItvCegU6TXUqbX3tUXGBAtvkBkXp.png"
                alt="Diagnostic Coder"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-pixel text-xs tracking-[0.2em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>CODER AGENT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">REASONING</span>
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>AI Root-Cause Reasoner &amp; Code Diff Fix</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                Correlates JavaScript exceptions with API payloads, separates observed facts from unverified hypotheses, and produces before/after code diffs with calibrated confidence.
              </p>
              <div className={`flex gap-6 pt-3 border-t text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>1.1M</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>fixes generated</span>
                </div>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>3.2s</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>avg analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent 3: CRASH ANALYST */}
          <div className={`rounded-3xl border backdrop-blur-sm overflow-hidden hover:shadow-xl transition group ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/75'
          }`}>
            <div className={`h-56 flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.03]'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/analyst-Ysxnqg7Fpy2cfA56PiIttv1KximMhT.png"
                alt="Crash Analyst"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-pixel text-xs tracking-[0.2em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>ANALYST AGENT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">MONITORING</span>
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>Crash Intelligence &amp; Regression Clusters</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                Groups recurring error signatures across browsers, monitors production failure rates, and tracks Mean Time to Resolution (MTTR) reductions.
              </p>
              <div className={`flex gap-6 pt-3 border-t text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>880K</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>bugs deduplicated</span>
                </div>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>78%</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>faster MTTR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent 4: PLAYWRIGHT EXECUTOR */}
          <div className={`rounded-3xl border backdrop-blur-sm overflow-hidden hover:shadow-xl transition group ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80 hover:border-white/20' : 'border-black/[0.08] bg-white/75'
          }`}>
            <div className={`h-56 flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.03]'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/executor-o1q6509qMLXMtpBIGo49vcgOu34sI1.png"
                alt="Playwright Executor"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`font-pixel text-xs tracking-[0.2em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>EXECUTOR AGENT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">STANDBY</span>
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>Deterministic Playwright Replayer</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                Spins up headless Chromium, configures matching viewport and network latency, reproduces the recorded failure step-by-step, and captures screenshot proofs.
              </p>
              <div className={`flex gap-6 pt-3 border-t text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>5.6M</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>replays executed</span>
                </div>
                <div>
                  <span className={`text-lg font-light block ${isDark ? 'text-white' : 'text-[#111]'}`}>99.9%</span>
                  <span className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>deterministic fidelity</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: REPRODUCTION WORKFLOW */}
      <section id="workflow" className={`relative z-10 py-24 px-6 md:px-12 max-w-6xl mx-auto space-y-12 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="space-y-3">
          <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>DETERMINISTIC WORKFLOW</span>
          <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            From user complaint to running Playwright test in four steps.
          </h2>
          <p className={`text-xs max-w-xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            How ReproLens isolates and reproduces real-world browser crashes deterministically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-2xl border backdrop-blur-sm space-y-4 ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`h-40 rounded-xl overflow-hidden flex items-center justify-center border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/define-5aafAmGBrxZpOqJ3XLHY3n3qzC2I5K.png"
                alt="Define"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`font-pixel text-xs tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 01</div>
            <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Capture Incident</h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Customer encounters failure. The Chrome Extension records DOM clicks, the failed HTTP 500 response, and unhandled TypeError.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm space-y-4 ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`h-40 rounded-xl overflow-hidden flex items-center justify-center border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/compose-5RT5VR4f1Y3GoFmovqTKLTG4UXp3g2.png"
                alt="Sanitize"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`font-pixel text-xs tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 02</div>
            <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Sanitize Evidence</h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Client-side Luhn algorithm detects sensitive credit cards and tokens, redacting them to [REDACTED] before transmission.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm space-y-4 ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`h-40 rounded-xl overflow-hidden flex items-center justify-center border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/test-zm8guZwxJHtwWsJ7XO4B0CF7GzlNK8.png"
                alt="Reproduce"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`font-pixel text-xs tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 03</div>
            <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Playwright Replay</h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Playwright launches Chromium at 1280x720, mocks the payment 500 response, and deterministically reproduces the exact failure.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm space-y-4 ${
            isDark ? 'border-white/[0.08] bg-[#12141F]/80' : 'border-black/[0.08] bg-white/70'
          }`}>
            <div className={`h-40 rounded-xl overflow-hidden flex items-center justify-center border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/deploy-an8fgHSLzniojkcmRyGGIFQUJF9T5J.png"
                alt="Guard in CI"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`font-pixel text-xs tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 04</div>
            <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111]'}`}>Guard in CI</h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/65' : 'text-black/65'}`}>
              Synthesizes checkout-resilience.spec.ts and exports a GitHub Actions workflow YAML to guarantee the bug never regresses.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: EXTENSION DOWNLOAD & 4-STEP ONBOARDING CENTERPIECE WITH CYBER RADAR ANIMATION */}
      <section
        id="download"
        className={`relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto space-y-12 border-t scroll-mt-24 overflow-hidden rounded-3xl my-8 transition-colors ${
          isDark
            ? 'border-white/[0.08] bg-gradient-to-b from-[#0c0d16] via-[#090a12] to-[#07080d]'
            : 'border-black/[0.08] bg-gradient-to-b from-stone-50 via-white to-stone-50'
        }`}
      >
        {/* Animated Cyber/Radar Background Effects (Dark Theme Animation) */}
        {isDark && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Glowing Radial Cyber Orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -top-12 -right-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-8 -left-16 w-80 h-80 bg-[#FF6D5A]/10 rounded-full blur-2xl" />

            {/* Cyber Matrix Coordinate Grid */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Continuous Laser Scanning Beam */}
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-[scanBeam_5s_linear_infinite]" />
          </div>
        )}

        {/* Section Header */}
        <div className="relative z-10 space-y-3 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Autonomous Client Defense</span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Install the ReproLens Extension in 30 Seconds.
          </h2>
          <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>
            Zero-overhead Manifest V3 client with autonomous error interception, flight recorder, and instant AI patch synthesis.
          </p>
        </div>

        {/* 2-Column Showcase: Download Centerpiece + Live Extension Bug Hunter Radar Preview */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Card 1: Official Download Box */}
          <div
            className={`backdrop-blur-md rounded-3xl border p-8 shadow-xl flex flex-col justify-between space-y-6 ${
              isDark ? 'bg-[#12141F]/90 border-white/[0.1] shadow-black/50' : 'bg-white/90 border-black/[0.1]'
            }`}
          >
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#111]'}`}>
                    reprolens-extension-v1.0.0.zip
                  </span>
                </div>
                <span className={`font-mono text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/50'}`}>
                  MV3 BUNDLE &bull; 8.1 KB
                </span>
              </div>

              <div className={`text-xs space-y-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                <p>
                  Equip your browser with a 45-second circular flight recorder, client-side credit card sanitizer, and automated error diagnostics.
                </p>
                <div className={`p-3 rounded-xl border text-[11px] font-mono ${isDark ? 'bg-black/30 border-white/10 text-emerald-400' : 'bg-stone-100 border-black/10 text-emerald-700'}`}>
                  ● Silent 0.2ms interceptor • No source map leakage
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                onClick={handleTriggerDownload}
                className={`w-full py-4 px-6 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-3 transition transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider ${
                  isDark ? 'bg-white hover:bg-white/90 text-black shadow-white/10' : 'bg-[#111] hover:bg-black text-white'
                }`}
              >
                {downloadStarted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>DOWNLOAD STARTED! CHECK DOWNLOADS</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>DOWNLOAD EXTENSION BUNDLE (.ZIP)</span>
                  </>
                )}
              </button>

              <div className={`flex flex-wrap items-center justify-center gap-4 text-xs font-mono pt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Manifest V3 Certified
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

          {/* Card 2: LIVE EXTENSION BUG HUNTER & CHAOS SIMULATOR */}
          <div
            className={`backdrop-blur-md rounded-3xl border p-6 md:p-8 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-b from-[#0e1220]/95 to-[#090b14]/95 border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)]'
                : 'bg-white/95 border-blue-500/30'
            }`}
          >
            {/* Ambient Animated Radar Background (Subtle cybernetic grid & sweeping glow behind card) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(59,130,246,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div
                className="absolute -top-16 -right-16 w-80 h-80 rounded-full origin-center animate-[radarSweep_3.5s_linear_infinite]"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(59, 130, 246, 0.45) 0deg, rgba(59, 130, 246, 0) 70deg, transparent 360deg)',
                }}
              />
            </div>

            {/* Header with Title and Dynamic Badge */}
            <div className="relative z-10 flex items-center justify-between border-b pb-3 border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                <span className="font-mono text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Extension Live Bug Hunter
                </span>
              </div>

              {/* Dynamic Status Pill */}
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full transition-all border ${
                  showcasePhase === 0
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : showcasePhase === 1
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse'
                    : showcasePhase === 2
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {showcasePhase === 0 && '● RADAR ACTIVE'}
                {showcasePhase === 1 && 'FATAL CRASH DETECTED'}
                {showcasePhase === 2 && 'AI SYNTHESIZING FIX'}
                {showcasePhase === 3 && 'BUG AUTO-SOLVED'}
              </span>
            </div>

            {/* Diagnostic Log & Live AI Patch Box */}
            <div className="relative z-10 p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    showcasePhase === 0
                      ? 'bg-blue-400'
                      : showcasePhase === 1
                      ? 'bg-rose-400 animate-ping'
                      : showcasePhase === 2
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="font-bold text-white">
                  {showcasePhase === 0 && 'DOM Clickstream & Fetch Listener Running'}
                  {showcasePhase === 1 && 'Crash: TypeError: Cannot read properties of undefined'}
                  {showcasePhase === 2 && 'AST Reasoner: Isolating Unsafe Property Access'}
                  {showcasePhase === 3 && 'Runtime Safe Fallback Injected (100% Non-Breaking)'}
                </span>
              </div>

              <div className="text-[11px] text-white/60">
                {showcasePhase === 0 && 'Autonomous flight recorder buffering last 45 seconds of user interactions.'}
                {showcasePhase === 1 && 'Uncaught Exception on line 42 inside cart checkout event listener.'}
                {showcasePhase === 2 && 'Generating AST patch with optional chaining: items?.map(...) ?? []'}
                {showcasePhase === 3 && 'Bug solved without crashing browser tab. Telemetry logged to ReproLens.'}
              </div>

              {showcasePhase === 3 && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  <code>// Auto-Injected Diff:
- const subtotal = cart.items.reduce(...)
+ const subtotal = (cart?.items ?? []).reduce(...)</code>
                </div>
              )}
            </div>

            {/* Interactive Chaos Simulator Controls (Professional Modern Toggles) */}
            <div className="relative z-10 p-3.5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-2 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/10 pb-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider">Chaos Simulator (Any Site)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  QA RUNTIME
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {/* Toggle 1: Slow 3G */}
                <div
                  onClick={() => setDemoSlow3G(!demoSlow3G)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white/90 text-[11px]">Slow 3G Network Latency</div>
                    <div className="text-[10px] text-white/40">+2.5s simulated connection delay</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${demoSlow3G ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${demoSlow3G ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Toggle 2: Force 500 */}
                <div
                  onClick={() => setDemoForce500(!demoForce500)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white/90 text-[11px]">Force API HTTP 500 Drop</div>
                    <div className="text-[10px] text-white/40">Drop fetch responses with status 500</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${demoForce500 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${demoForce500 ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Toggle 3: Flight Recorder */}
                <div
                  onClick={() => setDemoFlightRecorder(!demoFlightRecorder)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white/90 text-[11px]">Black-Box Flight Recorder</div>
                    <div className="text-[10px] text-white/40">Continuous 45s circular buffer</div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${demoFlightRecorder ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${demoFlightRecorder ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Interactive Button to Test the Cycle */}
            <button
              onClick={() => setShowcasePhase(1)}
              className="relative z-10 w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Crash &amp; Watch Auto-Fix</span>
            </button>
          </div>
        </div>

        {/* 4-Step Interactive Guide */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
          <div
            onClick={() => setActiveStep(1)}
            className={`p-6 rounded-2xl border transition cursor-pointer space-y-3 ${
              activeStep === 1
                ? (isDark ? 'bg-white/10 border-white text-white shadow-lg' : 'bg-white border-black shadow-md')
                : (isDark ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/20' : 'bg-white/50 border-black/[0.08] hover:border-black/20')
            }`}
          >
            <div className="flex items-center justify-between font-mono">
              <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 01</span>
              {activeStep === 1 && <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white' : 'text-black'}`}>ACTIVE</span>}
            </div>
            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111]'}`}>Download &amp; Unzip</h4>
            <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>Download the zip bundle and extract it to a local folder.</p>
          </div>

          <div
            onClick={() => setActiveStep(2)}
            className={`p-6 rounded-2xl border transition cursor-pointer space-y-3 ${
              activeStep === 2
                ? (isDark ? 'bg-white/10 border-white text-white shadow-lg' : 'bg-white border-black shadow-md')
                : (isDark ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/20' : 'bg-white/50 border-black/[0.08] hover:border-black/20')
            }`}
          >
            <div className="flex items-center justify-between font-mono">
              <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 02</span>
              {activeStep === 2 && <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white' : 'text-black'}`}>ACTIVE</span>}
            </div>
            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111]'}`}>Developer Mode</h4>
            <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>Open <code className={`font-mono ${isDark ? 'text-white bg-white/10 px-1 rounded' : 'text-black'}`}>chrome://extensions</code> and toggle Developer Mode ON.</p>
          </div>

          <div
            onClick={() => setActiveStep(3)}
            className={`p-6 rounded-2xl border transition cursor-pointer space-y-3 ${
              activeStep === 3
                ? (isDark ? 'bg-white/10 border-white text-white shadow-lg' : 'bg-white border-black shadow-md')
                : (isDark ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/20' : 'bg-white/50 border-black/[0.08] hover:border-black/20')
            }`}
          >
            <div className="flex items-center justify-between font-mono">
              <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 03</span>
              {activeStep === 3 && <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white' : 'text-black'}`}>ACTIVE</span>}
            </div>
            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111]'}`}>Load Unpacked</h4>
            <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>Click "Load unpacked" in Chrome and select the extracted folder.</p>
          </div>

          <div
            onClick={() => setActiveStep(4)}
            className={`p-6 rounded-2xl border transition cursor-pointer space-y-3 ${
              activeStep === 4
                ? (isDark ? 'bg-white/10 border-white text-white shadow-lg' : 'bg-white border-black shadow-md')
                : (isDark ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/20' : 'bg-white/50 border-black/[0.08] hover:border-black/20')
            }`}
          >
            <div className="flex items-center justify-between font-mono">
              <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>STEP 04</span>
              {activeStep === 4 && <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white' : 'text-black'}`}>ACTIVE</span>}
            </div>
            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111]'}`}>Pin &amp; Enter Dashboard</h4>
            <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>Pin the icon. Click <strong>"Open Dashboard"</strong> inside the popup to access your studio.</p>
          </div>
        </div>

        {/* Active Step Details */}
        <div className={`max-w-5xl mx-auto backdrop-blur-md rounded-2xl border p-8 space-y-4 ${
          isDark ? 'bg-[#12141F]/90 border-white/[0.08]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>Folder Structure Inside Archive:</span>
                <button
                  onClick={handleTriggerDownload}
                  className={`text-xs font-bold underline flex items-center gap-1 cursor-pointer ${isDark ? 'text-white' : 'text-[#111]'}`}
                >
                  <span>Download .zip</span>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={`p-4 rounded-xl border font-mono text-xs space-y-1 ${
                isDark ? 'bg-black/40 border-white/[0.06] text-white/80' : 'bg-black/[0.02] border-black/[0.06] text-black/80'
              }`}>
                <div><strong>extension/</strong></div>
                <div className="pl-4">├── <strong>manifest.json</strong> <span className={isDark ? 'text-white/40' : 'text-black/50'}>(Manifest V3 spec)</span></div>
                <div className="pl-4">├── <strong>content.js</strong> <span className={isDark ? 'text-white/40' : 'text-black/50'}>(Telemetry listener &amp; client Luhn scrubber)</span></div>
                <div className="pl-4">├── <strong>background.js</strong> <span className={isDark ? 'text-white/40' : 'text-black/50'}>(Service worker)</span></div>
                <div className="pl-4">├── <strong>popup.html</strong> &amp; <strong>popup.js</strong> <span className={isDark ? 'text-white/40' : 'text-black/50'}>(Popup controller with Dashboard launcher)</span></div>
                <div className="pl-4">└── <strong>icons/</strong> <span className={isDark ? 'text-white/40' : 'text-black/50'}>(Lens icons 16, 48, 128)</span></div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>Browser Extensions Manager:</span>
                <button
                  onClick={handleCopyExtensionsUrl}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white'
                  }`}
                >
                  {copiedUrl ? 'Copied chrome://extensions' : 'Copy chrome://extensions'}
                </button>
              </div>
              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Paste <code className={`font-mono px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>chrome://extensions</code> in a new tab, then switch the <strong>Developer mode</strong> toggle in the top-right corner to <strong>ON</strong>.
              </p>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>Load Into Browser:</span>
              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Click <strong>"Load unpacked"</strong> in the top-left toolbar and select the extracted <code className={`font-mono px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>extension</code> folder. Chrome will immediately install and enable the extension!
              </p>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>Pin &amp; Enter Dashboard:</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">Extension Controlled Access</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Click the puzzle icon in Chrome and pin ReproLens. Click the ReproLens icon in your toolbar, and click <strong className={isDark ? 'text-white' : 'text-black'}>"OPEN DASHBOARD"</strong> to enter your telemetry and reproduction workspace!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: INTERACTIVE PRIVACY SHIELD TESTBED */}
      <section id="privacy" className={`relative z-10 py-24 px-6 md:px-12 max-w-6xl mx-auto space-y-12 border-t scroll-mt-24 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="space-y-3">
          <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>DATA SANITIZATION ENGINE</span>
          <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Client-Side Privacy Sandbox.
          </h2>
          <p className={`text-xs max-w-xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Type customer credentials below. Watch ReproLens scrub them locally in real-time before network persistence.
          </p>
        </div>

        <div className={`backdrop-blur-md rounded-3xl border p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-sm ${
          isDark ? 'bg-[#12141F]/80 border-white/[0.08]' : 'bg-white/80 border-black/[0.08]'
        }`}>
          {/* Input Side */}
          <div className="space-y-4">
            <span className={`text-xs font-bold uppercase font-mono flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <Terminal className={`w-3.5 h-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} /> User Typed in Browser Input:
            </span>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>Customer Email</label>
              <input
                type="text"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${
                  isDark ? 'bg-[#0B0C14] border-white/15 text-white focus:border-white' : 'bg-[#F5F4F0] border-black/15 text-[#111] focus:border-black'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>Credit Card (Luhn-Valid)</label>
              <input
                type="text"
                value={testCard}
                onChange={(e) => setTestCard(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${
                  isDark ? 'bg-[#0B0C14] border-white/15 text-white focus:border-white' : 'bg-[#F5F4F0] border-black/15 text-[#111] focus:border-black'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>Password or Auth Token</label>
              <input
                type="text"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${
                  isDark ? 'bg-[#0B0C14] border-white/15 text-white focus:border-white' : 'bg-[#F5F4F0] border-black/15 text-[#111] focus:border-black'
                }`}
              />
            </div>
          </div>

          {/* Sanitized Output Side */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase text-emerald-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> What ReproLens Backend &amp; AI Receives:
            </span>

            <div className="p-5 rounded-2xl bg-black text-white font-mono text-xs space-y-3 shadow-lg border border-white/10">
              <div>
                <span className="text-white/40 text-[10px] uppercase">email:</span>
                <div className="text-emerald-400 font-bold bg-white/5 p-2 rounded-lg border border-white/10 mt-1">
                  [REDACTED]
                </div>
              </div>

              <div>
                <span className="text-white/40 text-[10px] uppercase">cardNumber:</span>
                <div className="text-emerald-400 font-bold bg-white/5 p-2 rounded-lg border border-white/10 mt-1">
                  [REDACTED]
                </div>
              </div>

              <div>
                <span className="text-white/40 text-[10px] uppercase">password:</span>
                <div className="text-emerald-400 font-bold bg-white/5 p-2 rounded-lg border border-white/10 mt-1">
                  [REDACTED]
                </div>
              </div>
            </div>
            <p className={`text-[11px] font-mono ${isDark ? 'text-white/50' : 'text-black/60'}`}>
              Credentials never reach persistent storage or external AI reasoning services unmasked.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7: DOUBLE MARQUEE TICKER RIBBON */}
      <div className={`relative z-10 py-10 overflow-hidden border-y backdrop-blur-sm space-y-3 ${
        isDark ? 'border-white/[0.08] bg-[#0E101A]/60' : 'border-black/[0.08] bg-white/40'
      }`}>
        <div className={`animate-marquee whitespace-nowrap flex gap-4 text-xs font-mono uppercase tracking-widest ${
          isDark ? 'text-white/50' : 'text-black/50'
        }`}>
          {marqueeItemsRow1.map((item, idx) => (
            <span key={idx} className="flex items-center gap-4">
              <span>{item}</span>
              <span className={isDark ? 'text-white/20' : 'text-black/20'}>&bull;</span>
            </span>
          ))}
        </div>
        <div className={`animate-marquee whitespace-nowrap flex gap-4 text-xs font-mono uppercase tracking-widest ${
          isDark ? 'text-white/40' : 'text-black/40'
        }`} style={{ animationDirection: 'reverse' }}>
          {marqueeItemsRow2.map((item, idx) => (
            <span key={idx} className="flex items-center gap-4">
              <span>{item}</span>
              <span className={isDark ? 'text-white/20' : 'text-black/20'}>&bull;</span>
            </span>
          ))}
        </div>
      </div>

      {/* SECTION 8: LIVE RIGHT NOW TABLE */}
      <section id="live" className="relative z-10 py-24 px-6 md:px-12 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>LIVE RIGHT NOW</span>
            <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
              Diagnostic agents working autonomously.
            </h2>
            <p className={`text-xs max-w-xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              At any moment, autonomous agents are investigating bug incidents across production applications — no human in the loop.
            </p>
          </div>

          <div className={`flex items-center space-x-2 text-xs font-mono ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span><strong>3,847</strong> agents active globally</span>
          </div>
        </div>

        {/* Live Table */}
        <div className={`backdrop-blur-md rounded-2xl border overflow-hidden shadow-sm ${
          isDark ? 'bg-[#12141F]/80 border-white/[0.08]' : 'bg-white/80 border-black/[0.08]'
        }`}>
          <div className={`grid grid-cols-12 px-6 py-3.5 border-b text-[10px] font-mono uppercase tracking-wider ${
            isDark ? 'bg-white/[0.02] border-white/[0.06] text-white/40' : 'bg-black/[0.02] border-black/[0.06] text-black/50'
          }`}>
            <div className="col-span-3 sm:col-span-2">AGENT</div>
            <div className="col-span-6 sm:col-span-7">TASK</div>
            <div className="hidden sm:block sm:col-span-1">REGION</div>
            <div className="col-span-3 sm:col-span-2 text-right">STATUS</div>
          </div>

          <div className={`divide-y text-xs font-mono ${isDark ? 'divide-white/[0.04]' : 'divide-black/[0.04]'}`}>
            {liveTasks.map((t) => (
              <div key={t.id} className={`grid grid-cols-12 px-6 py-4 items-center transition ${
                isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]'
              }`}>
                <div className={`col-span-3 sm:col-span-2 font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#111]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/50' : 'bg-black/40'}`} />
                  <span>{t.id}</span>
                </div>
                <div className={`col-span-6 sm:col-span-7 truncate pr-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {t.task}
                </div>
                <div className={`hidden sm:block sm:col-span-1 uppercase text-[11px] ${isDark ? 'text-white/40' : 'text-black/50'}`}>
                  {t.region}
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: DEVELOPER EXPERIENCE (CODE TERMINAL) */}
      <section className={`relative z-10 py-24 px-6 md:px-12 max-w-6xl mx-auto space-y-12 border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="space-y-3">
          <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>DEVELOPER EXPERIENCE</span>
          <h2 className={`text-4xl sm:text-5xl font-light tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Built for developers. Loved by teams.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Tab options */}
          <div className="lg:col-span-4 space-y-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('install')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'install'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 01</div>
              <div className="text-sm">Install Extension &amp; SDK</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>One command to get started</div>
            </button>

            <button
              onClick={() => setActiveTab('define')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'define'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 02</div>
              <div className="text-sm">Define Client Shield</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>Luhn &amp; credential masking</div>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'memory'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 03</div>
              <div className="text-sm">Playwright Replayer</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>Deterministic browser execution</div>
            </button>

            <button
              onClick={() => setActiveTab('deploy')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'deploy'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 04</div>
              <div className="text-sm">CI/CD Regression Guard</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>Push to GitHub Actions</div>
            </button>

            <button
              onClick={() => setActiveTab('vscode')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'vscode'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 05</div>
              <div className="text-sm">IDE Deep-Link Dispatch</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>VS Code / Cursor protocol jump</div>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'voice'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 06</div>
              <div className="text-sm">AI Voice Audio RCA</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>30s synthesized standup brief</div>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                activeTab === 'radar'
                  ? (isDark ? 'bg-white/10 border-white text-white shadow-sm font-bold' : 'bg-white border-black text-[#111] shadow-sm font-bold')
                  : (isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]' : 'bg-white/40 border-black/[0.06] text-black/60 hover:bg-white/70')
              }`}
            >
              <div className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Step 07</div>
              <div className="text-sm">Performance Radar</div>
              <div className={`text-[11px] mt-1 ${isDark ? 'text-white/40' : 'text-black/50'}`}>Heap velocity &amp; 60 FPS drops</div>
            </button>
          </div>

          {/* Right: Code Block */}
          <div className="lg:col-span-8 bg-[#111] text-white rounded-2xl p-6 font-mono text-xs shadow-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-white/50 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-white font-bold ml-2">terminal — reprolens</span>
              </div>
              <span>TypeScript / Node.js</span>
            </div>

            <pre className="text-white/90 overflow-x-auto leading-relaxed text-xs">
              {activeTab === 'install' && `# Install the ReproLens Web Client SDK\nnpm install @reprolens/sdk\n\n# Or load unpacked extension in chrome://extensions\ncurl -O http://localhost:8000/download/extension.zip\nunzip reprolens-extension-v1.0.0.zip`}
              {activeTab === 'define' && `import { initReproLens } from '@reprolens/sdk';\n\ninitReproLens({\n  apiKey: 'rpl_prod_live_enterprise_99',\n  endpoint: 'http://localhost:8000/api/v1/ingest',\n  maskLuhnCards: true,\n  stripAuthHeaders: true\n});`}
              {activeTab === 'memory' && `// Playwright Autonomous Replay\nimport { chromium } from 'playwright';\n\nconst browser = await chromium.launch({ headless: true });\nconst page = await browser.newPage({ viewport: { width: 1280, height: 720 } });\nawait page.goto('http://localhost:3000/checkout');\nawait page.click('button#pay-now'); // Reproduces HTTP 500 error`}
              {activeTab === 'deploy' && `// .github/workflows/reprolens-guard.yml\nname: ReproLens Regression Guard\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npx playwright test tests/reprolens/`}
              {activeTab === 'vscode' && `// 1-Click IDE Deep-Link Protocol Dispatch\nimport { launchInEditor } from '@reprolens/ide';\n\n// Jump directly to root cause in VS Code or Cursor\nwindow.location.href = 'vscode://file/c:/workspace/ProjectsGrid.tsx:42:15';\n\n// Clipboard Verified AST Patch applied cleanly\nawait navigator.clipboard.writeText(\n  "const safeItems = items?.map((item) => item.title) ?? [];"\n);`}
              {activeTab === 'voice' && `// AI Voice Natural Audio Synthesizer\nimport { playVoiceRCA } from '@reprolens/voice';\n\n// Generates calibrated 30s executive audio brief for on-call triage\nconst briefing = await playVoiceRCA({\n  bugId: 'cf4a2650',\n  playbackRate: 1.25,\n  voice: 'natural_executive'\n});`}
              {activeTab === 'radar' && `// Real-Time Memory Leak & FPS Radar\nimport { initRadar } from '@reprolens/radar';\n\ninitRadar({\n  targetFps: 60,\n  stallFpsThreshold: 30,\n  maxLeakVelocityMbPerSec: 4.0,\n  longTaskThresholdMs: 50\n});`}
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION 11: START BUILDING YOUR BUG AGENT WORKFORCE (ANIMATED SHOWCASE) */}
      <section className={`relative py-32 px-6 md:px-12 lg:px-20 border-t overflow-hidden ${
        isDark ? 'border-white/[0.08] bg-[#090A0F]' : 'border-black/[0.06] bg-[#F5F4F0]'
      }`}>
        {/* Ambient Radial Pulsing Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[700px] h-[400px] rounded-full blur-[130px] transition-all duration-1000 ${
            isDark ? 'bg-cyan-500/10 animate-pulse-slow' : 'bg-amber-500/10 animate-pulse-slow'
          }`} />
        </div>

        {/* Animated Background Image from v0 agentic architecture */}
        <img
          src="/images/footer.png"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom pointer-events-none select-none animate-footer-float"
          style={{
            opacity: isDark ? 0.4 : 0.85,
            mixBlendMode: isDark ? 'screen' : 'multiply'
          }}
        />

        {/* Progressive Blur Mask */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to top, transparent 0%, black 55%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 55%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)'
          }}
        />

        {/* Dynamic Gradient Blend for Dark & Light Themes */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'linear-gradient(to top, rgb(9,10,15) 0%, rgba(9,10,15,0.92) 18%, rgba(9,10,15,0.55) 35%, transparent 55%)'
              : 'linear-gradient(to top, rgb(245,244,240) 0%, rgba(245,244,240,0.92) 18%, rgba(245,244,240,0.55) 35%, transparent 55%)'
          }}
        />

        {/* Interactive Content */}
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          <span className={`font-pixel text-xs tracking-[0.25em] uppercase ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            DEPLOY INTELLIGENCE
          </span>

          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Start building your<br />bug agent workforce.
          </h2>

          <p className={`text-sm leading-relaxed max-w-lg mx-auto ${isDark ? 'text-white/60' : 'text-black/55'}`}>
            Join thousands of engineering teams deploying AI agents that capture telemetry, triage exceptions, and reproduce bugs around the clock.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleTriggerDownload}
              className={`px-8 py-3.5 text-xs font-bold rounded-xl shadow-lg transition tracking-widest uppercase cursor-pointer flex items-center gap-2 ${
                isDark ? 'bg-white hover:bg-white/90 text-black shadow-white/10' : 'bg-[#111] hover:bg-black text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD EXTENSION (.ZIP)</span>
            </button>

            <a
              href="#download"
              className={`px-6 py-3.5 text-xs font-mono font-medium rounded-xl border transition ${
                isDark
                  ? 'border-white/15 text-white/80 hover:bg-white/5 hover:text-white'
                  : 'border-black/15 text-black/70 hover:bg-black/5 hover:text-black'
              }`}
            >
              VIEW 30-SEC INSTALL GUIDE &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`relative z-10 border-t backdrop-blur-sm py-16 px-6 md:px-12 ${
        isDark ? 'border-white/[0.08] bg-[#090A0F]/90' : 'border-black/[0.08] bg-[#F5F4F0]/90'
      }`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 text-xs font-mono">
          <div className="space-y-2">
            <span className={`font-pixel text-sm tracking-[0.25em] font-bold ${isDark ? 'text-white' : 'text-black'}`}>REPROLENS</span>
            <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>Autonomous Bug Investigation &amp; Deterministic Reproduction Platform</p>
            <div className={`text-[10px] pt-4 ${isDark ? 'text-white/40' : 'text-black/40'}`}>&copy; 2026 ReproLens. All rights reserved.</div>
          </div>

          <div className={`flex flex-wrap gap-12 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            <div className="space-y-2">
              <span className={`font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Product</span>
              <div><a href="#platform" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Platform</a></div>
              <div><a href="#agents" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Agents</a></div>
              <div><a href="#workflow" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Workflow</a></div>
              <div><a href="#download" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Extension Hub</a></div>
              <div><a href="#privacy" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Privacy Shield</a></div>
            </div>

            <div className="space-y-2">
              <span className={`font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Resources</span>
              <div><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Swagger API (:8000)</a></div>
              <div><button onClick={handleTriggerDownload} className={`cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Download Extension</button></div>
            </div>

            <div className="space-y-2">
              <span className={`font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Security</span>
              <div><span className="text-emerald-400 font-bold">● Client Luhn Shield Active</span></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/50'}>Zero PII Transmitted</span></div>
              <div><span className={isDark ? 'text-white/40' : 'text-black/50'}>Air-Gapped Heuristics</span></div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
