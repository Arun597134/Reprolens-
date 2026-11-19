import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, FastForward, AlertTriangle, Globe, MousePointer,
  Activity, Terminal, Wifi, ShieldAlert, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { TelemetryEvent } from '../types';

interface Props {
  events: TelemetryEvent[];
  initialUrl?: string;
  errorMessage?: string;
  onJumpToEvent?: (eventId: string) => void;
}

interface NormalizedEvent {
  id: string;
  type: string;
  relTimeMs: number;
  relTimeSec: number;
  label: string;
  color: string;
  raw: TelemetryEvent;
  x?: number;
  y?: number;
  isCrash: boolean;
}

export const TimeTravelPlayer: React.FC<Props> = ({
  events,
  initialUrl = 'https://app.local',
  errorMessage,
  onJumpToEvent,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'console' | 'network'>('details');

  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Normalize timestamps relative to first event
  const { normalized, totalDurationSec, crashIndex } = useMemo(() => {
    if (!events || events.length === 0) {
      return { normalized: [], totalDurationSec: 10, crashIndex: -1 };
    }

    const getEventMs = (ev: any) => {
      if (typeof ev.timestamp_offset_ms === 'number' && ev.timestamp_offset_ms > 0) {
        return ev.timestamp_offset_ms;
      }
      const raw = ev.timestamp || ev.created_at;
      return raw ? new Date(raw).getTime() : 0;
    };

    const sorted = [...events].sort((a, b) => getEventMs(a) - getEventMs(b));
    const firstMs = getEventMs(sorted[0]);
    let cIdx = -1;

    const normList: NormalizedEvent[] = sorted.map((ev: any, idx) => {
      let ms = 0;
      if (typeof ev.timestamp_offset_ms === 'number' && ev.timestamp_offset_ms > 0) {
        ms = ev.timestamp_offset_ms;
      } else {
        ms = Math.max(0, getEventMs(ev) - firstMs);
      }
      const sec = ms / 1000;
      const p = ev.payload || {};

      const isCrash =
        ev.event_type === 'js_exception' ||
        ev.event_type === 'console_error' ||
        (ev.event_type === 'network_request' && (p.status >= 500 || p.status === 0));

      if (isCrash && cIdx === -1) {
        cIdx = idx;
      }

      let color = '#3B82F6'; // blue default
      let label = ev.event_type;

      if (ev.event_type === 'click') {
        color = '#2563EB';
        label = `Click on <${p.tag_name || p.selector || 'button'}>`;
      } else if (ev.event_type === 'rage_click') {
        color = '#DC2626';
        label = `Rage Click (${p.count || 3}x fast)`;
      } else if (ev.event_type === 'network_request') {
        color = p.status >= 400 ? '#EF4444' : '#F59E0B';
        label = `${p.method || 'GET'} ${p.url || ''} [${p.status || 200}]`;
      } else if (isCrash) {
        color = '#E11D48';
        label = p.message || p.error || 'Exception thrown';
      } else if (ev.event_type === 'navigation') {
        color = '#10B981';
        label = `Navigated to ${p.url || ''}`;
      }

      return {
        id: ev.id,
        type: ev.event_type,
        relTimeMs: ms,
        relTimeSec: sec,
        label,
        color,
        raw: ev,
        x: p.x || p.clientX || (idx * 55) % 480 + 80,
        y: p.y || p.clientY || (idx * 35) % 240 + 60,
        isCrash,
      };
    });

    const maxSec = Math.max(normList[normList.length - 1]?.relTimeSec || 0, 5);
    // Pad end with 1.5 seconds for visual wrap up
    const duration = Math.ceil(maxSec + 1.5);

    return { normalized: normList, totalDurationSec: duration, crashIndex: cIdx };
  }, [events]);

  const crashEvent = crashIndex >= 0 ? normalized[crashIndex] : null;

  // Active event at current timestamp
  const activeEvent = useMemo(() => {
    if (normalized.length === 0) return null;
    let found = normalized[0];
    for (const ev of normalized) {
      if (ev.relTimeSec <= currentTimeSec) {
        found = ev;
      } else {
        break;
      }
    }
    return found;
  }, [normalized, currentTimeSec]);

  // Logs up to current timestamp
  const visibleLogs = useMemo(() => {
    return normalized.filter(
      (e) =>
        e.relTimeSec <= currentTimeSec &&
        (e.type.includes('console') || e.type.includes('exception') || e.type === 'rage_click')
    );
  }, [normalized, currentTimeSec]);

  // Network requests up to current timestamp
  const visibleNetwork = useMemo(() => {
    return normalized.filter((e) => e.relTimeSec <= currentTimeSec && e.type === 'network_request');
  }, [normalized, currentTimeSec]);

  // Animation Loop for real-time playback
  useEffect(() => {
    if (!isPlaying) {
      lastTickRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const tick = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const deltaSec = ((now - lastTickRef.current) / 1000) * speed;
      lastTickRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDurationSec) {
          setIsPlaying(false);
          return totalDurationSec;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speed, totalDurationSec]);

  const handlePlayPause = () => {
    if (currentTimeSec >= totalDurationSec) {
      setCurrentTimeSec(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentTimeSec(0);
    setIsPlaying(false);
  };

  const handleJumpToCrash = () => {
    if (crashEvent) {
      setCurrentTimeSec(Math.max(0, crashEvent.relTimeSec - 0.2));
      setIsPlaying(false);
      if (onJumpToEvent) onJumpToEvent(crashEvent.id);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const activePayload = activeEvent?.raw.payload || {};
  const isPostCrash = crashEvent && currentTimeSec >= crashEvent.relTimeSec;

  return (
    <div className="bg-white/95 rounded-3xl border border-black/10 overflow-hidden shadow-xl backdrop-blur-md">
      {/* Top Controls Header */}
      <div className="px-6 py-4 bg-[#141416] text-white flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center shadow">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-tight">Time-Travel Telemetry Player</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-emerald-400">
                Deterministic Sync
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-mono">
              Replaying {normalized.length} user events • Scrub timeline to inspect DOM state
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {crashEvent && (
            <button
              onClick={handleJumpToCrash}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-mono font-bold shadow transition animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Jump to Crash Point ({formatTime(crashEvent.relTimeSec)})</span>
            </button>
          )}

          <div className="flex items-center bg-white/10 rounded-xl p-0.5 text-xs font-mono">
            {([1, 2, 4] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  speed === spd ? 'bg-white text-black font-bold shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Viewport Simulator + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-black/10">
        {/* Left: Simulated Browser Canvas Viewport */}
        <div className="lg:col-span-7 bg-[#0E0F12] p-5 flex flex-col justify-between relative min-h-[360px] overflow-hidden select-none">
          {/* Simulated Browser URL bar */}
          <div className="bg-[#1C1E24] rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono text-white/70 border border-white/5 shadow-sm">
            <div className="flex items-center space-x-2 truncate">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate text-white/90 text-[11px]">
                {activePayload.url || initialUrl}
              </span>
            </div>
            <span className="text-[10px] text-white/40 shrink-0 ml-2">
              t={formatTime(currentTimeSec)}
            </span>
          </div>

          {/* Simulated Page Content Area */}
          <div className="my-auto py-6 flex flex-col items-center justify-center relative">
            {/* Virtual DOM card representing target element */}
            <div
              className={`w-full max-w-md p-5 rounded-2xl border transition-all duration-300 shadow-2xl ${
                isPostCrash
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : 'bg-[#181A20] border-white/10 text-white/90'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-white/40 mb-3 border-b border-white/5 pb-2">
                <span className="uppercase tracking-wider">Simulated Viewport State</span>
                <span className="text-indigo-400 font-bold">{activeEvent?.type || 'idle'}</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-white/90">
                  {activePayload.target_text ||
                    activePayload.component ||
                    activePayload.selector ||
                    'Application Active Window'}
                </div>
                <div className="text-[11px] font-mono text-white/60 bg-black/40 rounded-xl p-2.5 border border-white/5 truncate">
                  Selector: <span className="text-amber-300">{activePayload.selector || 'body > #app'}</span>
                </div>
                {activePayload.semantic_summary && (
                  <div className="text-[11px] text-indigo-200/90 bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2 font-mono">
                    Observed: {activePayload.semantic_summary}
                  </div>
                )}
              </div>

              {/* Crash Overlay within viewport when crashed */}
              {isPostCrash && (
                <div className="mt-4 p-3 rounded-xl bg-rose-600/20 border border-rose-500/80 text-rose-300 text-xs font-mono space-y-1 animate-in fade-in duration-300">
                  <div className="flex items-center space-x-1.5 font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Runtime Crash Triggered</span>
                  </div>
                  <p className="text-[11px] text-rose-200 leading-snug break-all">
                    {errorMessage || activePayload.message || 'Fatal JavaScript Unhandled Exception'}
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Animated Cursor Indicator */}
            {activeEvent && (
              <div
                className="absolute pointer-events-none transition-all duration-200 ease-out flex items-center space-x-1.5"
                style={{
                  left: `${Math.min(85, Math.max(10, (activeEvent.x || 150) / 6))} %`,
                  top: `${Math.min(80, Math.max(15, (activeEvent.y || 100) / 4))} %`,
                }}
              >
                <div className="relative">
                  <MousePointer className="w-5 h-5 text-indigo-400 drop-shadow-lg -rotate-45" />
                  {activeEvent.type.includes('click') && (
                    <span className="absolute -inset-2 rounded-full border-2 border-indigo-400 animate-ping opacity-75" />
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-black/80 text-[10px] font-mono text-white/80 border border-white/10 shadow-md whitespace-nowrap">
                  {activeEvent.type}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Viewport Status Ribbon */}
          <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pt-2 border-t border-white/5">
            <span className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isPostCrash ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{isPostCrash ? 'State: Crashed (Halted)' : 'State: Healthy'}</span>
            </span>
            <span>Viewport: 1440 × 900</span>
          </div>
        </div>

        {/* Right: Synchronized Event Inspector Panel */}
        <div className="lg:col-span-5 bg-white p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
              <div className="flex space-x-1">
                {(['details', 'console', 'network'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition ${
                      activeTab === tab
                        ? 'bg-[#111] text-white'
                        : 'bg-black/[0.04] text-black/60 hover:text-black'
                    }`}
                  >
                    {tab === 'details' ? 'Inspector' : tab === 'console' ? `Console (${visibleLogs.length})` : `Network (${visibleNetwork.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: Event Details */}
            {activeTab === 'details' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.08]">
                  <span className="text-[10px] uppercase font-mono font-bold text-black/40 block mb-1">
                    Event at Current Millisecond
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#111]">{activeEvent?.type || 'None'}</span>
                    <span className="text-[11px] font-mono text-black/50">{formatTime(currentTimeSec)}</span>
                  </div>
                  <p className="text-xs text-black/80 mt-1 font-mono break-all">{activeEvent?.label}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-black/40 block">
                    Telemetry Payload Snapshot
                  </span>
                  <div className="bg-[#141416] text-emerald-400 p-3 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed border border-black/10">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(activePayload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Console Stream */}
            {activeTab === 'console' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono text-[11px]">
                {visibleLogs.length === 0 ? (
                  <p className="text-black/40 p-4 text-center text-xs">No console logs before this timestamp.</p>
                ) : (
                  visibleLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-xl border flex items-start space-x-2 ${
                        log.isCrash
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-black/[0.02] border-black/[0.06] text-black/80'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 shrink-0 mt-0.5 text-black/40" />
                      <div className="truncate">
                        <span className="text-[10px] text-black/40 mr-1.5">[{formatTime(log.relTimeSec)}]</span>
                        <span>{log.label}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: Network Requests */}
            {activeTab === 'network' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono text-[11px]">
                {visibleNetwork.length === 0 ? (
                  <p className="text-black/40 p-4 text-center text-xs">No network calls before this timestamp.</p>
                ) : (
                  visibleNetwork.map((net) => {
                    const st = net.raw.payload?.status || 200;
                    return (
                      <div
                        key={net.id}
                        className="p-2 rounded-xl bg-black/[0.02] border border-black/[0.06] flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Wifi className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate text-black/80 text-[11px]">{net.label}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st >= 500
                              ? 'bg-rose-100 text-rose-700'
                              : st >= 400
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {st}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-black/40 pt-2 border-t border-black/[0.06] flex items-center justify-between">
            <span>Inspector State: Live</span>
            <span>Events: {normalized.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom Timeline Scrubber Bar */}
      <div className="p-5 bg-[#F9F8F5] space-y-3">
        {/* Scrubber Progress Slider */}
        <div className="relative group">
          {/* Timeline Track with Event Pin Markers */}
          <div className="relative h-4 flex items-center">
            {/* Background Track */}
            <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden relative">
              <div
                className="h-full bg-[#111] transition-all duration-75"
                style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
              />
            </div>

            {/* Event Markers along the timeline */}
            {normalized.map((ev) => {
              const posPercent = (ev.relTimeSec / totalDurationSec) * 100;
              return (
                <button
                  key={ev.id}
                  onClick={() => {
                    setCurrentTimeSec(ev.relTimeSec);
                    if (onJumpToEvent) onJumpToEvent(ev.id);
                  }}
                  title={`[${formatTime(ev.relTimeSec)}] ${ev.label}`}
                  className={`absolute w-2.5 h-4 -top-1 rounded transition-transform hover:scale-150 ${
                    ev.isCrash ? 'bg-rose-600 z-20 animate-pulse' : 'bg-black/40 hover:bg-black z-10'
                  }`}
                  style={{ left: `calc(${posPercent}% - 5px)` }}
                />
              );
            })}

            {/* Native Slider input for smooth dragging */}
            <input
              type="range"
              min={0}
              max={totalDurationSec}
              step={0.05}
              value={currentTimeSec}
              onChange={(e) => {
                setCurrentTimeSec(parseFloat(e.target.value));
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-2xl bg-[#111] hover:bg-black text-white flex items-center justify-center shadow transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-2.5 rounded-2xl bg-white border border-black/15 text-black/70 hover:text-black hover:border-black transition"
              title="Restart from 00:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="text-xs font-mono font-bold text-black/80 px-3 py-1.5 rounded-xl bg-white border border-black/10">
              <span>{formatTime(currentTimeSec)}</span>
              <span className="text-black/40 mx-1">/</span>
              <span className="text-black/50">{formatTime(totalDurationSec)}</span>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-[11px] text-black/40 mr-1 uppercase font-bold">Markers:</span>
            {normalized.slice(0, 5).map((ev, i) => (
              <button
                key={ev.id}
                onClick={() => setCurrentTimeSec(ev.relTimeSec)}
                className="px-2 py-1 rounded-lg bg-white border border-black/10 text-black/70 hover:text-black hover:border-black text-[10px] transition"
              >
                {ev.type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
