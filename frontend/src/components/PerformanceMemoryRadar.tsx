import React, { useState, useEffect } from 'react';
import {
  Activity, Cpu, HardDrive, AlertTriangle, ShieldCheck, Zap,
  TrendingUp, TrendingDown, Clock, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { BugReport, PerformanceRadarData } from '../types';
import { api } from '../api';

interface Props {
  bug: BugReport;
}

export const PerformanceMemoryRadar: React.FC<Props> = ({ bug }) => {
  const [radar, setRadar] = useState<PerformanceRadarData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRadar = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPerformanceRadar(bug.id);
      setRadar(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch performance telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, [bug.id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3 font-mono text-xs text-black/60 bg-white/80 rounded-3xl border border-black/[0.08]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p>Analyzing browser heap memory &amp; frame-rate telemetry...</p>
      </div>
    );
  }

  if (error || !radar) {
    return (
      <div className="p-8 text-center space-y-3 font-mono text-xs text-rose-800 bg-rose-50 rounded-3xl border border-rose-200">
        <p>Could not load Performance Radar: {error}</p>
        <button
          onClick={fetchRadar}
          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  const memorySamples = radar.memory_samples || [];
  const fpsSamples = radar.fps_samples || [];
  const maxHeap = Math.max(...memorySamples.map((s) => s.heap_used_mb), 40);
  const minHeap = Math.min(...memorySamples.map((s) => s.heap_used_mb), 10);
  const heapRange = Math.max(maxHeap - minHeap, 10);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 160;
  const padding = 20;

  // Compute SVG polyline points for Memory Graph
  const memoryPoints = memorySamples
    .map((s, idx) => {
      const x = padding + (idx / Math.max(memorySamples.length - 1, 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - ((s.heap_used_mb - minHeap) / heapRange) * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Compute SVG polyline points for FPS Graph
  const fpsPoints = fpsSamples
    .map((s, idx) => {
      const x = padding + (idx / Math.max(fpsSamples.length - 1, 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - (s.fps / 65) * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const riskColor =
    radar.memory_leak_risk === 'CRITICAL'
      ? 'text-rose-700 bg-rose-100 border-rose-300'
      : radar.memory_leak_risk === 'MODERATE'
      ? 'text-amber-700 bg-amber-100 border-amber-300'
      : 'text-emerald-700 bg-emerald-100 border-emerald-300';

  return (
    <div className="space-y-6 font-mono text-[#111]">
      {/* Header Bar */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide">
              Performance &amp; Memory Leak Radar
            </h2>
          </div>
          <p className="text-xs text-black/55 mt-0.5">
            Real-time JS Heap allocation, UI thread long tasks (&gt;50ms), and FPS dip detection
          </p>
        </div>

        <button
          onClick={fetchRadar}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-black/70 border border-black/10 transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Heap Memory */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-black/55">
            <span>JS Heap Allocated</span>
            <HardDrive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-[#111] tracking-tight">
            {radar.current_heap_mb} <span className="text-xs font-normal text-black/50">MB</span>
          </div>
          <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (radar.current_heap_mb / 250) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-black/50 font-bold">
            <span>Peak: {radar.peak_heap_mb} MB</span>
            <span>Limit: {radar.heap_limit_mb} MB</span>
          </div>
        </div>

        {/* Metric 2: Average FPS */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-black/55">
            <span>Frame Rate (FPS)</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#111] tracking-tight">
            {radar.avg_fps} <span className="text-xs font-normal text-black/50">FPS</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px]">
            {radar.fps_dips_count > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                {radar.fps_dips_count} UI freeze dip(s)
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Smooth 60 FPS profile
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Memory Leak Risk */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-black/55">
            <span>Memory Leak Risk</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold tracking-tight">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskColor}`}>
              {radar.memory_leak_risk}
            </span>
          </div>
          <p className="text-[10px] text-black/50">
            Growth Velocity: <b className="text-black">+{radar.leak_velocity_mb_per_min} MB/min</b>
          </p>
        </div>

        {/* Metric 4: Long Tasks */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-black/55">
            <span>UI Thread Blockers</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-[#111] tracking-tight">
            {radar.long_tasks.length} <span className="text-xs font-normal text-black/50">&gt;50ms</span>
          </div>
          <p className="text-[10px] text-black/50">
            {radar.long_tasks.length > 0 ? 'Main-thread stalls isolated' : '0 Long tasks captured'}
          </p>
        </div>
      </div>

      {/* Visual Graphs: Memory & FPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Timeline Graph */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-black/[0.08] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="font-bold text-[#111]">JS Heap Allocation Timeline</span>
            </div>
            <span className="text-[10px] text-black/50 font-bold">MB vs Session Elapsed (ms)</span>
          </div>

          <div className="relative bg-[#FAFAF8] rounded-2xl border border-black/[0.06] p-3">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dotted horizontal grid lines */}
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E5E7EB" strokeDasharray="3 3" />
              <line
                x1={padding}
                y1={svgHeight / 2}
                x2={svgWidth - padding}
                y2={svgHeight / 2}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <line
                x1={padding}
                y1={svgHeight - padding}
                x2={svgWidth - padding}
                y2={svgHeight - padding}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />

              {/* Area fill */}
              {memorySamples.length > 1 && (
                <polygon
                  points={`${padding},${svgHeight - padding} ${memoryPoints} ${svgWidth - padding},${svgHeight - padding}`}
                  fill="url(#memGradient)"
                />
              )}

              {/* Line */}
              {memorySamples.length > 1 && (
                <polyline
                  points={memoryPoints}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {memorySamples.map((s, idx) => {
                const x = padding + (idx / Math.max(memorySamples.length - 1, 1)) * (svgWidth - padding * 2);
                const y = svgHeight - padding - ((s.heap_used_mb - minHeap) / heapRange) * (svgHeight - padding * 2);
                const isSpike = idx === memorySamples.length - 2;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isSpike ? 5 : 3}
                    className={isSpike ? 'fill-rose-600 stroke-white stroke-2 animate-ping' : 'fill-indigo-600'}
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[10px] text-black/50 font-bold">
            <span>T+0ms (Session Start)</span>
            <span className="text-rose-600 font-bold">&bull; Crash Event Spike</span>
            <span>T+{memorySamples[memorySamples.length - 1]?.timestamp_offset_ms || 10000}ms</span>
          </div>
        </div>

        {/* FPS Stability Graph */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-black/[0.08] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="font-bold text-[#111]">Frame Rate &amp; Freeze Radar</span>
            </div>
            <span className="text-[10px] text-black/50 font-bold">FPS vs Session Elapsed</span>
          </div>

          <div className="relative bg-[#FAFAF8] rounded-2xl border border-black/[0.06] p-3">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="fpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 30 FPS Dotted Threshold */}
              <line
                x1={padding}
                y1={svgHeight - padding - (30 / 65) * (svgHeight - padding * 2)}
                x2={svgWidth - padding}
                y2={svgHeight - padding - (30 / 65) * (svgHeight - padding * 2)}
                stroke="#F43F5E"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text
                x={svgWidth - padding - 85}
                y={svgHeight - padding - (30 / 65) * (svgHeight - padding * 2) - 4}
                className="text-[9px] fill-rose-600 font-bold"
              >
                30 FPS Stall Line
              </text>

              {/* Area fill */}
              {fpsSamples.length > 1 && (
                <polygon
                  points={`${padding},${svgHeight - padding} ${fpsPoints} ${svgWidth - padding},${svgHeight - padding}`}
                  fill="url(#fpsGradient)"
                />
              )}

              {/* Line */}
              {fpsSamples.length > 1 && (
                <polyline
                  points={fpsPoints}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {fpsSamples.map((s, idx) => {
                const x = padding + (idx / Math.max(fpsSamples.length - 1, 1)) * (svgWidth - padding * 2);
                const y = svgHeight - padding - (s.fps / 65) * (svgHeight - padding * 2);
                const isDip = s.fps < 30;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isDip ? 5 : 3}
                    className={isDip ? 'fill-rose-600 stroke-white stroke-2' : 'fill-emerald-600'}
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[10px] text-black/50 font-bold">
            <span>60 FPS Target</span>
            <span className="text-rose-600 font-bold">&bull; Frame Drop isolated at crash trigger</span>
            <span>Target Sustained</span>
          </div>
        </div>
      </div>

      {/* Long Tasks Table & AI Memory Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Long Tasks List */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-md rounded-3xl border border-black/[0.08] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#111]">Main-Thread Long Tasks:</span>
            <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full font-bold">
              {radar.long_tasks.length} Captured
            </span>
          </div>

          <div className="space-y-2">
            {radar.long_tasks.length === 0 ? (
              <p className="text-xs text-black/50 italic py-4 text-center">
                No long tasks (&gt;50ms) detected in this execution window.
              </p>
            ) : (
              radar.long_tasks.map((task, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700">+{task.duration_ms} ms</span>
                    <span className="text-[10px] text-black/50">T+{task.timestamp_offset_ms}ms</span>
                  </div>
                  <p className="text-[11px] text-black/75 truncate">{task.culprit}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Memory & Performance Diagnostic */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl border border-black/[0.08] p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#111]">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Autonomous Memory &amp; Performance Diagnostic</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-xs text-indigo-950 leading-relaxed space-y-2">
            <p className="font-sans leading-relaxed text-[12px]">{radar.ai_diagnostic}</p>
            <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-[11px] text-indigo-800 font-bold">
              <span>Leak Velocity: {radar.leak_velocity_mb_per_min} MB/min</span>
              <span>Cleaned by Dual-Reality B AST Patch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
