import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Shield, Activity, AlertTriangle, CheckCircle2,
  Eye, Terminal, FastForward, Volume2, VolumeX, Check, Lock
} from 'lucide-react';
import { ParticleCanvas } from './ParticleCanvas';

interface CinematicIntroProps {
  onComplete: () => void;
}

type IntroPhase =
  | 'workflow'    // 0: Clean node graph running
  | 'zoom_error'  // 1: Camera zooms to failing node with incident crash
  | 'lens_scan'   // 2: ReproLens optical aperture locks & scrubs/scans
  | 'rectify'     // 3: AI synthesizes Playwright spec & auto-heals
  | 'title'       // 4: Editorial REPROLENS title drop & website-matched precision loader
  | 'exit';       // 5: Smooth reveal into LandingPage

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<IntroPhase>('workflow');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanY, setScanY] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Subtle ambient Web Audio synthesizer
  const playSfx = (type: 'click' | 'alert' | 'scan' | 'resolved' | 'boom') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.setValueAtTime(140, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'scan') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'resolved') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (type === 'boom') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.5);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Fail quietly if audio context restricted
    }
  };

  // ESC shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete]);

  // Choreographed Timeline (Tight, snappy ~13.5s total)
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('zoom_error');
      playSfx('alert');
    }, 2000);

    const t2 = setTimeout(() => {
      setPhase('lens_scan');
      playSfx('scan');
    }, 4300);

    const t3 = setTimeout(() => {
      setPhase('rectify');
      playSfx('resolved');
    }, 7000);

    const t4 = setTimeout(() => {
      setPhase('title');
      playSfx('boom');
    }, 9500);

    const t5 = setTimeout(() => {
      setPhase('exit');
    }, 13400);

    const t6 = setTimeout(() => {
      onComplete();
    }, 14100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  // Smooth scanline sweep during lens_scan
  useEffect(() => {
    if (phase !== 'lens_scan') return;
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      // Oscillate 0 -> 100 smoothly
      const pct = Math.min(100, (elapsed / 2200) * 100);
      setScanY(pct);
      if (pct < 100) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Smooth architectural loading bar during 'title' phase (0 -> 100%)
  useEffect(() => {
    if (phase !== 'title') return;
    let start: number | null = null;
    let raf: number;
    const duration = 3400; // Matches title phase duration cleanly
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const eased = 1 - Math.pow(1 - Math.min(1, elapsed / duration), 3); // Cubic ease-out
      setProgress(Math.round(eased * 100));
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const isErrorOrScan = phase === 'zoom_error' || phase === 'lens_scan';
  const isRectified = phase === 'rectify';
  const isZoomed = phase === 'zoom_error' || phase === 'lens_scan' || phase === 'rectify';

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#090A0F] text-white flex flex-col justify-between overflow-hidden select-none transition-all duration-700 ease-out ${
        phase === 'exit' ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* NATIVE WEBSITE PARTICLE BACKGROUND */}
      <ParticleCanvas theme="dark" />

      {/* SUBTLE ARCHITECTURAL DOT MATRIX OVERLAY */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)'
        }}
      />

      {/* AMBIENT VIGNETTE GLOW (Restrained Linear/Vercel Obsidian Style) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: isErrorOrScan
            ? 'radial-gradient(circle at 55% 50%, rgba(239, 68, 68, 0.12) 0%, transparent 55%)'
            : isRectified
            ? 'radial-gradient(circle at 55% 50%, rgba(16, 185, 129, 0.12) 0%, transparent 55%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 60%)'
        }}
      />

      {/* FLOATING GLASS HEADER - IDENTICAL TO MAIN WEBSITE NAVBAR */}
      <div className="relative z-30 pt-5 px-4 w-[95%] max-w-[1360px] mx-auto">
        <header
          className="flex items-center justify-between px-6 py-3 rounded-2xl border border-white/[0.1]"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: 'rgba(12, 14, 22, 0.78)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shadow-sm">
              <span className="font-pixel text-[11px]">R</span>
            </div>
            <span className="font-pixel text-xs tracking-[0.25em] font-extrabold text-white">
              REPROLENS
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/60">
              <span className={`w-1.5 h-1.5 rounded-full ${isErrorOrScan ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{phase === 'title' ? 'RUNTIME READY' : 'PIPELINE TELEMETRY'}</span>
            </span>
          </div>

          {/* Right: Sound & Skip Pill */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playSfx('click');
              }}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition flex items-center gap-1.5 text-[11px] font-mono cursor-pointer"
              title="Toggle Ambient Audio"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
              <span className="hidden sm:inline">{soundEnabled ? 'AUDIO ON' : 'AUDIO OFF'}</span>
            </button>

            <button
              onClick={onComplete}
              className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-[11px] font-mono font-bold tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span>SKIP INTRO</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/10 text-black/70">ESC</span>
              <FastForward className="w-3 h-3" />
            </button>
          </div>
        </header>
      </div>

      {/* ========================================================= */}
      {/* CENTERSTAGE: WORKFLOW GRAPH -> ZOOM -> OPTICAL LENS       */}
      {/* ========================================================= */}
      <main className="relative z-20 flex-1 flex items-center justify-center overflow-hidden px-4">
        {phase !== 'title' && phase !== 'exit' && (
          <div className="w-full flex items-center justify-center">
            {/* Responsive scaled 900x340 Architectural Graph Canvas */}
            <div className="transform scale-[0.42] sm:scale-[0.68] md:scale-[0.88] lg:scale-100 transition-transform duration-500">
              <div
                className="relative w-[900px] h-[340px] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transformOrigin: '595px 170px',
                  transform: isZoomed ? 'scale(1.38)' : 'scale(1)'
                }}
              >
                {/* SVG PRECISION HAIRLINE WIRES & ANIMATED SIGNALS */}
                <svg viewBox="0 0 900 340" className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* Connector 1: Node 1 -> Node 2 */}
                  <path
                    id="wire-1"
                    d="M 210 170 L 270 170"
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="1.5"
                  />
                  <circle r="2.5" fill="#ffffff">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path="M 210 170 L 270 170" />
                  </circle>

                  {/* Connector 2: Node 2 -> Node 3 */}
                  <path
                    id="wire-2"
                    d="M 440 170 L 500 170"
                    fill="none"
                    stroke={
                      isErrorOrScan
                        ? 'rgba(239,68,68,0.65)'
                        : isRectified
                        ? 'rgba(16,185,129,0.75)'
                        : 'rgba(255,255,255,0.22)'
                    }
                    strokeWidth={isErrorOrScan || isRectified ? '2' : '1.5'}
                    strokeDasharray={isErrorOrScan ? '4 4' : 'none'}
                  />
                  {!isErrorOrScan && (
                    <circle r="2.5" fill={isRectified ? '#10B981' : '#ffffff'}>
                      <animateMotion dur="1.1s" repeatCount="indefinite" path="M 440 170 L 500 170" />
                    </circle>
                  )}

                  {/* Connector 3: Node 3 -> DB Ledger */}
                  <path
                    d="M 690 170 C 718 170, 718 92 745 92"
                    fill="none"
                    stroke={
                      isErrorOrScan
                        ? 'rgba(239,68,68,0.2)'
                        : isRectified
                        ? 'rgba(16,185,129,0.65)'
                        : 'rgba(255,255,255,0.15)'
                    }
                    strokeWidth="1.5"
                  />
                  {isRectified && (
                    <circle r="2.5" fill="#10B981">
                      <animateMotion dur="1s" repeatCount="indefinite" path="M 690 170 C 718 170, 718 92, 745 92" />
                    </circle>
                  )}

                  {/* Connector 4: Node 3 -> Telemetry Sink */}
                  <path
                    d="M 690 170 C 718 170, 718 247 745 247"
                    fill="none"
                    stroke={
                      isErrorOrScan
                        ? 'rgba(239,68,68,0.2)'
                        : isRectified
                        ? 'rgba(16,185,129,0.65)'
                        : 'rgba(255,255,255,0.15)'
                    }
                    strokeWidth="1.5"
                  />
                  {isRectified && (
                    <circle r="2.5" fill="#10B981">
                      <animateMotion dur="1s" repeatCount="indefinite" path="M 690 170 C 718 170, 718 247, 745 247" />
                    </circle>
                  )}
                </svg>

                {/* NODE 1: WEBHOOK TRIGGER */}
                <div
                  className={`absolute left-[40px] top-[115px] w-[170px] h-[110px] rounded-2xl border border-white/[0.08] bg-[#12141F]/90 backdrop-blur-xl p-4 flex flex-col justify-between transition-opacity duration-500 ${
                    isZoomed ? 'opacity-30' : 'opacity-100'
                  }`}
                  style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/80">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-pixel text-[9px] text-white/50">01_INGRESS</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Checkout Click</div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">POST /v1/pay</div>
                  </div>
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#12141F] border border-white/40" />
                </div>

                {/* NODE 2: AUTH VALIDATOR */}
                <div
                  className={`absolute left-[270px] top-[115px] w-[170px] h-[110px] rounded-2xl border border-white/[0.08] bg-[#12141F]/90 backdrop-blur-xl p-4 flex flex-col justify-between transition-opacity duration-500 ${
                    isZoomed ? 'opacity-40' : 'opacity-100'
                  }`}
                  style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
                >
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#12141F] border border-white/40" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/80">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-pixel text-[9px] text-white/50">02_AUTH</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">200 OK</span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Session Guard</div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">JWT Validated</div>
                  </div>
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#12141F] border border-white/40" />
                </div>

                {/* NODE 3: TARGET FAILING NODE (Payment Gateway) */}
                <div
                  className={`absolute left-[500px] top-[95px] w-[190px] h-[150px] rounded-2xl border backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-500 z-10 ${
                    isErrorOrScan
                      ? 'border-red-500/70 bg-[#1B0E12]/95 shadow-[0_0_50px_rgba(239,68,68,0.22)]'
                      : isRectified
                      ? 'border-emerald-500/60 bg-[#0D1A15]/95 shadow-[0_0_45px_rgba(16,185,129,0.2)]'
                      : 'border-white/[0.14] bg-[#141624]/95 shadow-2xl'
                  }`}
                >
                  {/* Green Shockwave when resolved */}
                  {isRectified && (
                    <div className="absolute inset-0 rounded-2xl border border-emerald-400/50 animate-shockwave pointer-events-none" />
                  )}

                  <div
                    className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border ${
                      isErrorOrScan ? 'bg-red-500 border-red-300' : isRectified ? 'bg-emerald-500 border-emerald-300' : 'bg-[#141624] border-white/50'
                    }`}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                          isErrorOrScan
                            ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : isRectified
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-white/[0.07] border-white/10 text-white'
                        }`}
                      >
                        {isErrorOrScan ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : isRectified ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="font-pixel text-[9px] text-white/50">03_WORKER</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                        isErrorOrScan
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : isRectified
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {isErrorOrScan ? 'ERR_500' : isRectified ? 'PATCHED' : 'ACTIVE'}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white">Stripe Charge API</div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">/checkout/payment</div>
                  </div>

                  {/* Live Diagnostic Box inside Node (matches Sandbox style) */}
                  <div
                    className={`rounded-lg px-2.5 py-1.5 text-[9px] font-mono border ${
                      isErrorOrScan
                        ? 'bg-red-950/60 border-red-500/30 text-red-300'
                        : isRectified
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                        : 'bg-black/40 border-white/[0.06] text-white/50'
                    }`}
                  >
                    {isErrorOrScan ? (
                      <span>TypeError: session_id undef</span>
                    ) : isRectified ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400 inline" /> Playwright test verified
                      </span>
                    ) : (
                      <span>Awaiting response stream...</span>
                    )}
                  </div>

                  <div
                    className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border ${
                      isErrorOrScan ? 'bg-red-500 border-red-300' : isRectified ? 'bg-emerald-500 border-emerald-300' : 'bg-[#141624] border-white/50'
                    }`}
                  />
                </div>

                {/* NODE 4A: DB LEDGER */}
                <div
                  className={`absolute left-[745px] top-[45px] w-[145px] h-[95px] rounded-2xl border border-white/[0.08] bg-[#12141F]/90 backdrop-blur-xl p-3.5 flex flex-col justify-between transition-opacity duration-500 ${
                    isErrorOrScan ? 'opacity-25' : isZoomed ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#12141F] border border-white/40" />
                  <span className="font-pixel text-[8px] text-white/40">04_POSTGRES</span>
                  <div>
                    <div className="text-[11px] font-medium text-white">Order Ledger</div>
                    <div className="text-[9px] font-mono text-emerald-400/80 mt-0.5 flex items-center gap-1">
                      {isRectified ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>COMMITTED</span>
                        </>
                      ) : (
                        'STANDBY'
                      )}
                    </div>
                  </div>
                </div>

                {/* NODE 4B: TELEMETRY DISPATCH */}
                <div
                  className={`absolute left-[745px] top-[200px] w-[145px] h-[95px] rounded-2xl border border-white/[0.08] bg-[#12141F]/90 backdrop-blur-xl p-3.5 flex flex-col justify-between transition-opacity duration-500 ${
                    isErrorOrScan ? 'opacity-25' : isZoomed ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#12141F] border border-white/40" />
                  <span className="font-pixel text-[8px] text-white/40">05_REPLAY</span>
                  <div>
                    <div className="text-[11px] font-medium text-white">CI Guard Spec</div>
                    <div className="text-[9px] font-mono text-white/50 mt-0.5 flex items-center gap-1">
                      {isRectified ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>0 PII LEAKED</span>
                        </>
                      ) : (
                        'IDLE'
                      )}
                    </div>
                  </div>
                </div>

                {/* ================================================= */}
                {/* MONOCHROME ARCHITECTURAL REPROLENS OPTICAL SCANNER */}
                {/* ================================================= */}
                {(phase === 'lens_scan' || phase === 'rectify') && (
                  <div className="absolute left-[455px] top-[30px] w-[280px] h-[280px] pointer-events-none z-30 flex items-center justify-center animate-in fade-in zoom-in-90 duration-500">
                    {/* Outer Rotating Architectural Ring */}
                    <div
                      className="absolute inset-0 rounded-full border border-white/25 border-dashed"
                      style={{ animation: 'spin 18s linear infinite' }}
                    />

                    {/* Precision Lens Glass Ring */}
                    <div
                      className={`absolute inset-4 rounded-full border transition-colors duration-500 ${
                        phase === 'rectify' ? 'border-emerald-400/60' : 'border-white/40'
                      }`}
                      style={{
                        animation: 'spin 12s linear infinite reverse',
                        boxShadow:
                          phase === 'rectify'
                            ? '0 0 40px rgba(16,185,129,0.2), inset 0 0 24px rgba(16,185,129,0.1)'
                            : '0 0 40px rgba(255,255,255,0.08), inset 0 0 24px rgba(255,255,255,0.05)'
                      }}
                    />

                    {/* Fine Crosshairs */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-full h-[1px] bg-white" />
                      <div className="absolute h-full w-[1px] bg-white" />
                    </div>

                    {/* Optical Viewfinder Corner Brackets */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-white/60" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/60" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/60" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-white/60" />

                    {/* Laser Scanline */}
                    <div
                      className={`absolute inset-x-4 h-[2px] transition-colors ${
                        phase === 'rectify'
                          ? 'bg-emerald-400 shadow-[0_0_16px_#10B981]'
                          : 'bg-white shadow-[0_0_16px_#ffffff]'
                      }`}
                      style={{
                        top: `${Math.min(92, Math.max(8, scanY))}%`
                      }}
                    />

                    {/* Top Floating Frosted Pill (Matches Website Navbar aesthetic) */}
                    <div className="absolute -top-9 px-3.5 py-1.5 rounded-full border border-white/15 bg-[#0C0E16]/90 backdrop-blur-xl shadow-2xl flex items-center space-x-2">
                      <Eye className={`w-3 h-3 ${phase === 'rectify' ? 'text-emerald-400' : 'text-white'}`} />
                      <span className="font-pixel text-[9px] tracking-[0.2em] text-white/90">
                        {phase === 'rectify' ? 'REPROLENS // RECTIFIED' : 'REPROLENS // LOCKING OPTICS'}
                      </span>
                    </div>

                    {/* Bottom Sanitization Status Badge */}
                    <div className="absolute -bottom-9 px-3 py-1 rounded-lg border border-white/10 bg-[#0C0E16]/90 backdrop-blur-xl text-[9px] font-mono text-white/70 flex items-center space-x-2">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>
                        {phase === 'rectify'
                          ? 'SYNTHESIZED: checkout-resilience.spec.ts'
                          : `SCRUBBING PII & DOM TREE • ${Math.round(scanY)}%`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 5: WEBSITE-NATIVE REPROLENS TITLE + PRECISION LOADER*/}
        {/* ========================================================= */}
        {(phase === 'title' || phase === 'exit') && (
          <div className="relative z-20 flex flex-col items-center justify-center text-center max-w-2xl w-full px-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Brand Emblem Matching Website Hero */}
            <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)] mb-6">
              <span className="font-pixel text-lg">R</span>
            </div>

            <span className="font-pixel text-[11px] tracking-[0.28em] text-white/50 uppercase mb-3">
              // REPROLENS AUTONOMOUS BUG INTELLIGENCE
            </span>

            {/* Website-Consistent Light-Weight Display Headline */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-tight text-white leading-none mb-4">
              REPROLENS
            </h1>

            <p className="text-xs sm:text-sm text-white/55 font-light max-w-md leading-relaxed mb-10">
              Deterministic session telemetry, zero-PII client sanitization, and automated Playwright replay synthesis.
            </p>

            {/* WEBSITE-MATCHED ARCHITECTURAL PROGRESS CARD */}
            <div
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#12141F]/85 backdrop-blur-xl p-5 space-y-4 text-left"
              style={{
                boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)'
              }}
            >
              {/* Header row with monochrome status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-pixel text-[10px] tracking-[0.2em] text-white/75 uppercase">
                    {progress < 35
                      ? 'BOOTING CHROME MV3 ENGINE'
                      : progress < 75
                      ? 'HYDRATING SANDBOX WORKSPACE'
                      : progress < 100
                      ? 'SYNCING AGENT WORKFORCE'
                      : 'ENVIRONMENT NOMINAL'}
                  </span>
                </div>
                <span className="font-mono text-xs font-medium text-white tabular-nums">
                  {progress.toString().padStart(3, '0')}%
                </span>
              </div>

              {/* Ultra-Sleek Precision Hairline Progress Bar */}
              <div className="space-y-2">
                <div className="relative h-[3px] w-full bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100 ease-out"
                    style={{
                      width: `${progress}%`,
                      boxShadow: '0 0 14px rgba(255, 255, 255, 0.85)'
                    }}
                  />
                </div>

                {/* Precision Architectural Ruler Ticks */}
                <div className="flex justify-between items-center text-[9px] font-mono text-white/30 px-0.5">
                  <span>00</span>
                  <span className={progress >= 25 ? 'text-white/60 transition-colors' : ''}>25</span>
                  <span className={progress >= 50 ? 'text-white/60 transition-colors' : ''}>50</span>
                  <span className={progress >= 75 ? 'text-white/60 transition-colors' : ''}>75</span>
                  <span className={progress === 100 ? 'text-emerald-400 font-bold transition-colors' : ''}>100</span>
                </div>
              </div>

              {/* Sub-modules Ready Chips matching Landing Page badges */}
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-white/60">
                  <Check className={`w-3 h-3 ${progress >= 30 ? 'text-emerald-400' : 'text-white/20'}`} />
                  <span className={progress >= 30 ? 'text-white/85' : 'text-white/30'}>Telemetry</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-white/60">
                  <Check className={`w-3 h-3 ${progress >= 65 ? 'text-emerald-400' : 'text-white/20'}`} />
                  <span className={progress >= 65 ? 'text-white/85' : 'text-white/30'}>Edge Scrub</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-white/60">
                  <Check className={`w-3 h-3 ${progress >= 95 ? 'text-emerald-400' : 'text-white/20'}`} />
                  <span className={progress >= 95 ? 'text-white/85' : 'text-white/30'}>Playwright</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM SUBTLE TELEMETRY BAR (Matches Website Aesthetic) */}
      <footer className="relative z-20 px-6 pb-5 max-w-[1360px] w-[95%] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0C0E16]/70 backdrop-blur-md text-[11px] font-mono text-white/50">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span>
              {phase === 'workflow' && 'pipeline.orchestrator: executing production workflow nodes...'}
              {phase === 'zoom_error' && 'exception.caught: HTTP 500 at POST /checkout/payment (session_id undefined)'}
              {phase === 'lens_scan' && 'reprolens.optic: intercepting DOM snapshot & scrubbing PII vectors...'}
              {phase === 'rectify' && 'playwright.guard: test_checkout_resilience.spec.ts verified • workflow healed'}
              {(phase === 'title' || phase === 'exit') && 'reprolens.core: initializing developer experience workspace...'}
            </span>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <span className="hidden md:inline">STAGE: {phase.toUpperCase()}</span>
            <span className="text-emerald-400">0% PII LEAKAGE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
