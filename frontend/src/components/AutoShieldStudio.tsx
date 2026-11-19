import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Zap, Check, Copy, Clock,
  Activity, DollarSign, Users, Code2, Terminal, ExternalLink,
  Lock, RefreshCw, AlertTriangle, Layers, Laptop
} from 'lucide-react';
import { AutoShieldData } from '../types';
import { api } from '../api';

interface Props {
  bugId: string;
  isDark?: boolean;
}

export const AutoShieldStudio: React.FC<Props> = ({ bugId, isDark = false }) => {
  const [shieldData, setShieldData] = useState<AutoShieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedCodeTab, setCopiedCodeTab] = useState<'hook' | 'sw' | 'edge' | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'hook' | 'sw' | 'edge'>('hook');
  const [simulationFlash, setSimulationFlash] = useState(false);

  const fetchShield = async () => {
    try {
      setLoading(true);
      const data = await api.getAutoShield(bugId);
      setShieldData(data);
    } catch (err) {
      console.error('Failed to load Auto-Shield data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShield();
  }, [bugId]);

  const handleToggle = async () => {
    if (!shieldData) return;
    try {
      setToggling(true);
      const nextState = !shieldData.is_armed;
      const updated = await api.toggleAutoShield(bugId, nextState);
      setShieldData(updated);
    } catch (err) {
      console.error('Failed to toggle Auto-Shield:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleSimulateHit = async () => {
    if (!shieldData) return;
    try {
      setSimulating(true);
      const updated = await api.simulateAutoShieldHit(bugId, 'us-east-1');
      setShieldData(updated);
      setSimulationFlash(true);
      setTimeout(() => setSimulationFlash(false), 2400);
    } catch (err) {
      console.error('Failed to simulate Auto-Shield mitigation:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopyCode = (text: string, tab: 'hook' | 'sw' | 'edge') => {
    navigator.clipboard.writeText(text);
    setCopiedCodeTab(tab);
    setTimeout(() => setCopiedCodeTab(null), 2000);
  };

  if (loading && !shieldData) {
    return (
      <div className="p-12 text-center font-mono text-xs text-black/50 space-y-3">
        <Activity className="w-5 h-5 mx-auto animate-spin text-emerald-500" />
        <p>Loading Autonomous Auto-Shield Runtime State...</p>
      </div>
    );
  }

  if (!shieldData) {
    return (
      <div className="p-8 text-center text-xs font-mono text-black/50">
        Unable to load Auto-Shield state for this incident.
      </div>
    );
  }

  const isArmed = shieldData.is_armed;

  return (
    <div className="space-y-6">
      {/* Simulation Flash Notification Banner */}
      {simulationFlash && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-mono text-xs shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white animate-bounce" />
            </div>
            <div>
              <span className="font-bold block">Live Crash Intercepted &amp; Prevented in 1.1ms!</span>
              <span className="text-[11px] opacity-90">Visitor encountered zero crash. Safe fallback rendered without page reload.</span>
            </div>
          </div>
          <span className="text-[10px] bg-black/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            HTTP 200 Preserved
          </span>
        </div>
      )}

      {/* Main Immunity Status Command Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm transition-all ${
        isArmed
          ? 'bg-gradient-to-br from-emerald-950/15 via-white to-emerald-950/5 border-emerald-500/30'
          : 'bg-gradient-to-br from-amber-950/10 via-white to-stone-50 border-amber-500/30'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-sm ${
                isArmed
                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isArmed ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <span>SHIELD STATUS: {shieldData.status}</span>
              </span>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/5 text-black/60 border border-black/10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Auto-Expire TTL: 20h 46m remaining</span>
              </span>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-800 border border-cyan-500/20 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-600" />
                <span>Overhead: &lt;{shieldData.latency_overhead_ms}ms</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight flex items-center gap-2.5">
                <span>Autonomous Auto-Shield Immune System</span>
                {isArmed && <ShieldCheck className="w-6 h-6 text-emerald-600" />}
              </h2>
              <p className="text-xs text-black/65 mt-1 max-w-2xl leading-relaxed font-sans">
                {shieldData.ai_immunity_summary}
              </p>
            </div>
          </div>

          {/* Action Center: Toggle Arm / Disarm + Simulator Button */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={handleSimulateHit}
              disabled={simulating || !isArmed}
              className={`px-5 py-3 rounded-2xl text-xs font-mono font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                !isArmed
                  ? 'bg-black/5 text-black/30 border border-black/10 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
              title="Test the Auto-Shield by simulating a live user encountering the crash"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Simulating Crash Intercept...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Simulate Visitor Crash Attempt</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`px-5 py-3 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer border shadow-sm flex items-center justify-center space-x-2 ${
                isArmed
                  ? 'bg-white hover:bg-red-50 text-red-600 border-red-300'
                  : 'bg-[#111] hover:bg-black text-white border-black'
              }`}
            >
              {toggling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isArmed ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Disarm Shield</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Arm Auto-Shield</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Prevention Telemetry Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/45 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Crashes Prevented
          </span>
          <div className="text-3xl font-light text-emerald-700 tracking-tight">
            {shieldData.crashes_prevented.toLocaleString()}
          </div>
          <p className="text-[11px] font-mono text-black/55">Real-time runtime exceptions suppressed</p>
        </div>

        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/45 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" /> Visitors Shielded
          </span>
          <div className="text-3xl font-light text-[#111] tracking-tight">
            {shieldData.visitors_shielded.toLocaleString()}
          </div>
          <p className="text-[11px] font-mono text-black/55">Unique visitor sessions protected</p>
        </div>

        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/45 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Revenue Saved
          </span>
          <div className="text-3xl font-light text-amber-800 tracking-tight">
            ${shieldData.revenue_saved_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] font-mono text-black/55">Averted checkout checkout drop-offs</p>
        </div>

        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/45 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Zero Redeploy
          </span>
          <div className="text-3xl font-light text-purple-800 tracking-tight">
            0 sec
          </div>
          <p className="text-[11px] font-mono text-black/55">Protection active with 0 server restarts</p>
        </div>
      </div>

      {/* 3-Layer Defense Mechanics & Live Code Exporter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: How Auto-Shield Works */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl border border-black/[0.08] bg-white space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-[#111] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>3-Layer Autonomous Immunity Architecture</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] space-y-1">
                <div className="font-bold text-[#111] flex items-center justify-between">
                  <span>Layer 1: DOM Exception Trap</span>
                  <span className="text-[10px] text-emerald-600 font-bold">In-Memory</span>
                </div>
                <p className="text-[11px] text-black/65 font-sans leading-relaxed">
                  Catches the unhandled TypeError before window.onerror unmounts React components, preventing the white screen of death.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] space-y-1">
                <div className="font-bold text-[#111] flex items-center justify-between">
                  <span>Layer 2: AST Resilient Fallback</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Synthesized</span>
                </div>
                <p className="text-[11px] text-black/65 font-sans leading-relaxed">
                  Injects the AI-verified defensive schema fallback (empty array / cached items) directly into state hydrating pipelines.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] space-y-1">
                <div className="font-bold text-[#111] flex items-center justify-between">
                  <span>Layer 3: Network Interceptor</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Service Worker</span>
                </div>
                <p className="text-[11px] text-black/65 font-sans leading-relaxed">
                  Catches HTTP 500 server crashes in-flight and returns clean HTTP 200 defensive JSON to client rendering logic.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-700" /> Temporary Immunity Guarantee
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed font-sans">
                Auto-Shield serves as an emergency stopgap. Once your team merges the permanent GitHub PR, Auto-Shield automatically disarms cleanly with zero residual overhead.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Code Exporter & Live Ingestion Snippets */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#111] text-white rounded-2xl p-6 font-mono text-xs shadow-xl border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveCodeTab('hook')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    activeCodeTab === 'hook' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  HTML Script Hook
                </button>
                <button
                  onClick={() => setActiveCodeTab('sw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    activeCodeTab === 'sw' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Service Worker (sw.js)
                </button>
                <button
                  onClick={() => setActiveCodeTab('edge')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    activeCodeTab === 'edge' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Edge Middleware
                </button>
              </div>

              <button
                onClick={() => {
                  const content =
                    activeCodeTab === 'hook'
                      ? shieldData.injected_hook_code
                      : activeCodeTab === 'sw'
                      ? shieldData.service_worker_code
                      : shieldData.edge_middleware_code;
                  handleCopyCode(content, activeCodeTab);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCodeTab === activeCodeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-white/50">
              {activeCodeTab === 'hook' && 'Direct in-memory script hook. Add to your app header or load via Tag Manager:'}
              {activeCodeTab === 'sw' && 'Client network proxy interceptor. Save as reprolens-shield.sw.js in public root:'}
              {activeCodeTab === 'edge' && 'Cloudflare Workers or Next.js edge routing hook:'}
            </div>

            <pre className="text-white/90 overflow-x-auto leading-relaxed text-xs bg-black/50 p-4 rounded-xl border border-white/5 max-h-72">
              {activeCodeTab === 'hook' && shieldData.injected_hook_code}
              {activeCodeTab === 'sw' && shieldData.service_worker_code}
              {activeCodeTab === 'edge' && shieldData.edge_middleware_code}
            </pre>
          </div>
        </div>
      </div>

      {/* Live Prevention Audit Stream */}
      <div className="p-6 rounded-2xl border border-black/[0.08] bg-white space-y-4 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-[#111]">Live Auto-Shield Prevention Log</h3>
          </div>
          <span className="text-[11px] text-black/50">Real-time edge event stream</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-black/[0.04]">
          {shieldData.recent_mitigations.map((item) => (
            <div key={item.id} className="pt-2.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> [{item.timestamp_iso}]
                  </span>
                  <span className="text-black/60">{item.visitor_ip_masked}</span>
                  <span className="text-black/40 text-[10px]">&rarr;</span>
                  <span className="text-[#111] font-bold truncate max-w-xs">{item.route}</span>
                </div>
                <p className="text-[11px] text-black/70 font-sans">{item.action_taken}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {item.mitigation_latency_ms}ms overhead
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/5 text-black/60 font-bold uppercase">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
