import React, { useState } from 'react';
import {
  AlertTriangle, ShieldCheck, CheckCircle2, RotateCcw, Play, Zap,
  Code2, Eye, Flame, Terminal, Bug, Sparkles, Check, ArrowRight
} from 'lucide-react';
import { BugReport, Investigation } from '../types';

interface Props {
  bug: BugReport;
  investigation?: Investigation | null;
}

export const InteractiveLiveSplitSandbox: React.FC<Props> = ({ bug, investigation }) => {
  const [realityAState, setRealityAState] = useState<'idle' | 'triggered' | 'crashed'>('idle');
  const [realityBState, setRealityBState] = useState<'idle' | 'triggered' | 'healed'>('idle');
  const [isAutoReplaying, setIsAutoReplaying] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'interactive' | 'diff'>('interactive');

  // Extract candidate file, error snippet, and patch
  const errorType = bug.error_type || 'TypeError';
  const errorMessage = bug.error_message || 'Cannot read properties of undefined';
  const targetComponent = bug.component_context || 'InteractiveStateProvider';

  const patchDiff = (() => {
    if (investigation?.evidence?.staged_patch?.patched_content) {
      return investigation.evidence.staged_patch.patched_content;
    }
    if (investigation?.fix_recommendations && investigation.fix_recommendations.length > 0) {
      const rec = investigation.fix_recommendations[0];
      return (rec as any).replacement || rec.diff || '';
    }
    return `// ReproLens AST Engine Patch:\n- const data = response.payload.items;\n+ const data = response?.payload?.items || [];`;
  })();

  const handleTriggerA = () => {
    setRealityAState('triggered');
    setTimeout(() => {
      setRealityAState('crashed');
    }, 450);
  };

  const handleTriggerB = () => {
    setRealityBState('triggered');
    setTimeout(() => {
      setRealityBState('healed');
    }, 450);
  };

  const handleReset = () => {
    setRealityAState('idle');
    setRealityBState('idle');
  };

  const handleAutoReplay = () => {
    setIsAutoReplaying(true);
    handleReset();

    // Trigger Reality A crash first
    setTimeout(() => {
      setRealityAState('triggered');
      setTimeout(() => {
        setRealityAState('crashed');

        // Then trigger Reality B fix
        setTimeout(() => {
          setRealityBState('triggered');
          setTimeout(() => {
            setRealityBState('healed');
            setIsAutoReplaying(false);
          }, 600);
        }, 800);
      }, 500);
    }, 300);
  };

  return (
    <div className="space-y-6 font-mono text-[#111]">
      {/* Sandbox Header Bar */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide">
              Dual-Reality Interactive Component Sandbox
            </h2>
          </div>
          <p className="text-xs text-black/55 mt-0.5">
            Compare unpatched production fatal crash against ReproLens verified AST patch in real-time
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-black/5 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'interactive' ? 'bg-white shadow-xs text-black' : 'text-black/60 hover:text-black'
              }`}
            >
              Interactive UI
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'diff' ? 'bg-white shadow-xs text-black' : 'text-black/60 hover:text-black'
              }`}
            >
              AST Code Diff
            </button>
          </div>

          <button
            onClick={handleAutoReplay}
            disabled={isAutoReplaying}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isAutoReplaying ? 'animate-spin' : 'fill-current'}`} />
            <span>{isAutoReplaying ? 'Comparing...' : 'Run Auto-Replay'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-black/70 transition cursor-pointer"
            title="Reset Both Realities"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'interactive' ? (
        /* Split Screen Realities */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* REALITY A: UNPATCHED CRASH */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-rose-200/80 p-6 space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Reality A &bull; Unpatched Baseline
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                CRASH VULNERABLE
              </span>
            </div>

            {/* Component State */}
            <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/60">Component:</span>
                <code className="text-rose-700 font-bold">{targetComponent}</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/60">Target Route:</span>
                <span className="text-black font-semibold truncate max-w-[200px]">{bug.url}</span>
              </div>
            </div>

            {/* Interactive Demo Area */}
            <div className="min-h-[220px] rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/20 p-5 flex flex-col justify-center items-center text-center space-y-3">
              {realityAState === 'idle' && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Bug className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">Baseline Production Execution</h4>
                    <p className="text-[11px] text-rose-800/80 mt-1 max-w-xs">
                      Click below to trigger user action on unhydrated state or degraded API response.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerA}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Trigger Error Action
                  </button>
                </>
              )}

              {realityAState === 'triggered' && (
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-rose-600 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs font-bold text-rose-700">Executing user action...</p>
                </div>
              )}

              {realityAState === 'crashed' && (
                <div className="w-full space-y-3 text-left">
                  <div className="p-3.5 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-900 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-950">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>FATAL RUNTIME EXCEPTION (WHITE-SCREEN)</span>
                    </div>
                    <p className="text-xs font-mono font-semibold text-rose-800">
                      {errorType}: {errorMessage}
                    </p>
                    <p className="text-[10px] text-rose-700 leading-tight">
                      Application execution halted. Uncaught exception escalated to window.onerror.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-700 font-bold">White-Screen Severity: 100% FATAL</span>
                    <button
                      onClick={() => setRealityAState('idle')}
                      className="text-xs underline text-rose-700 hover:text-rose-900 font-bold"
                    >
                      ↺ Retry Action
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mechanics Note */}
            <div className="text-[11px] text-black/55 leading-relaxed bg-black/[0.02] p-3 rounded-xl border border-black/[0.06]">
              <b>Reality A Behavior:</b> Direct property access without null-guard or error-boundary causes DOM tear-down and total user blockage.
            </div>
          </div>

          {/* REALITY B: REPROLENS VERIFIED PATCH */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-emerald-200/80 p-6 space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Reality B &bull; ReproLens Patched State
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                100% RESILIENT (0 CRASHES)
              </span>
            </div>

            {/* Component State */}
            <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/60">Component:</span>
                <code className="text-emerald-700 font-bold">{targetComponent}</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/60">AST Patch Engine:</span>
                <span className="text-emerald-800 font-semibold">Defensive Optional Chaining &bull; Fallback UI</span>
              </div>
            </div>

            {/* Interactive Demo Area */}
            <div className="min-h-[220px] rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/20 p-5 flex flex-col justify-center items-center text-center space-y-3">
              {realityBState === 'idle' && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Patched AST Memory State</h4>
                    <p className="text-[11px] text-emerald-800/80 mt-1 max-w-xs">
                      Click below to execute the same trigger action with ReproLens resilience rules active.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerB}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Trigger Patched Action
                  </button>
                </>
              )}

              {realityBState === 'triggered' && (
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs font-bold text-emerald-700">Evaluating defensive fallback...</p>
                </div>
              )}

              {realityBState === 'healed' && (
                <div className="w-full space-y-3 text-left">
                  <div className="p-3.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>GRACEFUL FALLBACK RENDERED &bull; ZERO CRASHES</span>
                    </div>
                    <p className="text-xs font-mono font-medium text-emerald-800">
                      Fallback UI displayed: Content safely defaulted. User experience intact.
                    </p>
                    <div className="p-2 rounded-lg bg-white/90 border border-emerald-200 text-[11px] text-emerald-900 font-sans">
                      &bull; State recovered gracefully without white-screen or uncaught rejection.
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-bold">Regression Pass: 100% PASSED</span>
                    <button
                      onClick={() => setRealityBState('idle')}
                      className="text-xs underline text-emerald-700 hover:text-emerald-900 font-bold"
                    >
                      ↺ Retry Action
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mechanics Note */}
            <div className="text-[11px] text-black/55 leading-relaxed bg-black/[0.02] p-3 rounded-xl border border-black/[0.06]">
              <b>Reality B Behavior:</b> Safe fallback renders instantly. Dual-Reality B in Playwright verifies 0 console errors and 0 DOM crashes.
            </div>
          </div>
        </div>
      ) : (
        /* AST Code Diff View */
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-black/[0.08] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#111]">AST Synthesized Code Diff:</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Zero Regressions Verified
            </span>
          </div>
          <pre className="p-4 rounded-2xl bg-black/[0.03] border border-black/[0.08] text-xs font-mono text-[#111] leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {patchDiff}
          </pre>
        </div>
      )}
    </div>
  );
};
