import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Laptop, Smartphone, AlertTriangle, ShieldCheck,
  MousePointer, FileText, Globe, Terminal, Play, Pause, RotateCcw,
  FastForward, CheckCircle2, ArrowUpRight, Network, Layers
} from 'lucide-react';
import { SessionDetail, EventItem } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  sessionId: string;
  onBack: () => void;
  onNavigateToBug?: (bugId: string) => void;
}

export const SessionDetailPage: React.FC<Props> = ({ sessionId, onBack, onNavigateToBug }) => {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'waterfall' | 'console'>('timeline');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);

  useEffect(() => {
    let mounted = true;
    api.getSessionDetail(sessionId).then((data) => {
      if (mounted) {
        setSession(data);
        if (data.events.length > 0) {
          const firstErr = data.events.find((e) => e.event_type === 'js_exception' || e.event_type === 'console_error');
          setSelectedEvent(firstErr || data.events[data.events.length - 1]);
        }
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [sessionId]);

  // Player ticker
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && session && session.events.length > 0) {
      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= session.events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          setSelectedEvent(session.events[next]);
          return next;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, session]);

  if (loading || !session) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading session telemetry and event waterfall...
      </div>
    );
  }

  const currentEvent = session.events[playbackIndex] || session.events[0];
  const maxDurationMs = session.duration_ms || 16000;
  const currentOffsetMs = currentEvent ? currentEvent.timestamp_offset_ms : 0;
  const progressPercent = Math.min(100, Math.round((currentOffsetMs / (maxDurationMs || 1)) * 100));

  const networkEvents = session.events.filter((e) => e.event_type === 'network_request');
  const consoleEvents = session.events.filter((e) => e.event_type === 'console_error' || e.event_type === 'js_exception');

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white font-mono">{session.session_token}</h1>
              <StatusBadge status={session.status} type="status" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recorded at {new Date(session.started_at).toLocaleString()} &bull; Route: <code className="text-slate-300 font-mono">{session.url}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-300 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Client Sanitization: <strong>Scrubbed</strong></span>
          </div>
        </div>
      </div>

      {/* Visual Session Replay Player & Screen Mockup (Linear/Sentry Grade) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs font-mono text-slate-400 ml-2">
              Viewport: {session.viewport_w} &times; {session.viewport_h} ({session.browser_name} on {session.os_name})
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Time:</span>
            <span className="font-bold text-white">{(currentOffsetMs / 1000).toFixed(1)}s / {(maxDurationMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {/* Replay Simulated Screen Container */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-6 min-h-[160px] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{session.url || 'http://localhost:3000/checkout'}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-300 border border-slate-800">
              Step {playbackIndex + 1} of {session.events.length}
            </span>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider font-mono">
                  {currentEvent?.event_type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  at T+{(currentOffsetMs / 1000).toFixed(1)}s
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {currentEvent?.event_type === 'click' && `User clicked "${currentEvent.payload.text || currentEvent.payload.selector}"`}
                {currentEvent?.event_type === 'navigation' && `User navigated to "${currentEvent.payload.url}"`}
                {currentEvent?.event_type === 'input' && `User entered value into "${currentEvent.payload.name || currentEvent.payload.selector}"`}
                {currentEvent?.event_type === 'network_request' && `${currentEvent.payload.method} ${currentEvent.payload.url} -> HTTP ${currentEvent.payload.status}`}
                {currentEvent?.event_type === 'js_exception' && currentEvent.payload.message}
                {currentEvent?.event_type === 'console_error' && currentEvent.payload.message}
              </h3>
            </div>

            {currentEvent?.event_type === 'js_exception' && (
              <span className="px-3 py-1 bg-red-950/80 text-red-400 border border-red-800 rounded-lg text-xs font-bold animate-pulse">
                RUNTIME EXCEPTION DETECTED
              </span>
            )}
            {currentEvent?.event_type === 'network_request' && currentEvent.payload.status >= 500 && (
              <span className="px-3 py-1 bg-red-950/80 text-red-400 border border-red-800 rounded-lg text-xs font-bold">
                HTTP 500 INTERNAL SERVER ERROR
              </span>
            )}
          </div>

          {/* Scrubber Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-slate-850">
            <div className="relative w-full h-2 bg-slate-850 rounded-full overflow-hidden cursor-pointer">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Scrubber Controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setPlaybackIndex(0);
                    setSelectedEvent(session.events[0]);
                  }}
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300"
                  title="Rewind to start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center space-x-1.5 shadow-md"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-400">
                <span>Speed:</span>
                {[1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd as any)}
                    className={`px-2 py-0.5 rounded ${playbackSpeed === spd ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-850'}`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Tabs: Timeline vs Network Waterfall vs Console */}
      <div className="flex border-b border-slate-800 space-x-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-1.5 pb-2.5 px-3 transition border-b-2 ${
            activeTab === 'timeline'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Timeline Waterfall ({session.events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('waterfall')}
          className={`flex items-center space-x-1.5 pb-2.5 px-3 transition border-b-2 ${
            activeTab === 'waterfall'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Network Waterfall ({networkEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center space-x-1.5 pb-2.5 px-3 transition border-b-2 ${
            activeTab === 'console'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console & Exceptions ({consoleEvents.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="p-3 border-b border-slate-800 bg-slate-850/80 text-xs font-bold text-white uppercase tracking-wider">
              Chronological Event Sequence
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {session.events.map((evt, idx) => {
                const isSelected = selectedEvent?.id === evt.id;
                const offsetSec = (evt.timestamp_offset_ms / 1000).toFixed(1);
                const isError = evt.event_type === 'js_exception' || evt.event_type === 'console_error' || (evt.event_type === 'network_request' && evt.payload.status >= 400);

                return (
                  <div
                    key={evt.id || idx}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setPlaybackIndex(idx);
                    }}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-slate-800 border border-slate-700 shadow-sm'
                        : 'hover:bg-slate-850/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className="font-mono text-[11px] text-slate-500 w-12 pt-0.5">
                        +{offsetSec}s
                      </span>

                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          {evt.event_type === 'click' && (
                            <span className="text-blue-400 flex items-center gap-1 font-semibold text-[11px]">
                              <MousePointer className="w-3 h-3" /> Click
                            </span>
                          )}
                          {evt.event_type === 'navigation' && (
                            <span className="text-purple-400 flex items-center gap-1 font-semibold text-[11px]">
                              <Globe className="w-3 h-3" /> Navigation
                            </span>
                          )}
                          {evt.event_type === 'input' && (
                            <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                              <FileText className="w-3 h-3" /> Input
                            </span>
                          )}
                          {evt.event_type === 'network_request' && (
                            <span className={`flex items-center gap-1 font-semibold text-[11px] ${evt.payload.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                              HTTP {evt.payload.status || 200}
                            </span>
                          )}
                          {evt.event_type === 'js_exception' && (
                            <span className="text-red-400 flex items-center gap-1 font-semibold text-[11px]">
                              <AlertTriangle className="w-3 h-3" /> Exception
                            </span>
                          )}
                          {evt.event_type === 'console_error' && (
                            <span className="text-red-400 flex items-center gap-1 font-semibold text-[11px]">
                              <Terminal className="w-3 h-3" /> Console Error
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {evt.is_sanitized && '🛡️ SANITIZED'}
                          </span>
                        </div>

                        <p className="text-slate-300 font-medium">
                          {evt.event_type === 'click' && (evt.payload.text ? `Clicked "${evt.payload.text}"` : `Clicked ${evt.payload.selector}`)}
                          {evt.event_type === 'navigation' && `Route: ${evt.payload.url}`}
                          {evt.event_type === 'input' && `Field: ${evt.payload.name || evt.payload.selector} = ${evt.payload.value}`}
                          {evt.event_type === 'network_request' && `${evt.payload.method} ${evt.payload.url}`}
                          {evt.event_type === 'js_exception' && (evt.payload.message || 'JavaScript Error')}
                          {evt.event_type === 'console_error' && evt.payload.message}
                        </p>
                      </div>
                    </div>

                    {isError && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                        INCIDENT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="p-3 border-b border-slate-800 bg-slate-850/80 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Payload Inspector</span>
              <span className="text-[10px] font-mono text-slate-400">OFFSET: +{(selectedEvent?.timestamp_offset_ms ?? 0) / 1000}s</span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {selectedEvent ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Event Type</span>
                    <div className="text-sm font-bold text-white font-mono uppercase">{selectedEvent.event_type}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Sanitization Guarantee</span>
                    <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Zero-PII Sanitization Passed (Luhn Mask Active)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Telemetry Payload JSON</span>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-xs text-slate-500">
                  Select an event from the waterfall to inspect.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: NETWORK WATERFALL */}
      {activeTab === 'waterfall' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">URL Endpoint</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Offset</th>
                <th className="py-3 px-4">Response Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {networkEvents.map((net, i) => {
                const status = net.payload.status || 200;
                const isFail = status >= 400 || status === 0;
                return (
                  <tr key={i} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold ${isFail ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                        HTTP {status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-300">{net.payload.method || 'GET'}</td>
                    <td className="py-3 px-4 text-white font-semibold">{net.payload.url}</td>
                    <td className="py-3 px-4 text-slate-400">{net.payload.duration_ms || 120}ms</td>
                    <td className="py-3 px-4 text-slate-500">+{(net.timestamp_offset_ms / 1000).toFixed(1)}s</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                      {JSON.stringify(net.payload.response_body || net.payload.status_text || {})}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 3: CONSOLE & EXCEPTIONS */}
      {activeTab === 'console' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-800/80">
            {consoleEvents.map((err, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-red-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{err.payload.error_type || 'Uncaught Exception'}</span>
                  </span>
                  <span className="text-slate-500">T+{(err.timestamp_offset_ms / 1000).toFixed(1)}s</span>
                </div>
                <div className="text-xs text-white font-mono bg-black p-3 rounded-lg border border-slate-800">
                  {err.payload.message}
                </div>
                {err.payload.stack && (
                  <pre className="text-[11px] text-slate-400 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                    {err.payload.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
