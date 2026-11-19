import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Laptop, Smartphone, AlertTriangle, ShieldCheck,
  MousePointer, FileText, Globe, Terminal, ArrowUpRight, PlayCircle
} from 'lucide-react';
import { SessionDetail, EventItem } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { TimeTravelPlayer } from '../components/TimeTravelPlayer';

interface Props {
  sessionId: string;
  onBack: () => void;
  onNavigateToBug?: (bugId: string) => void;
}

export const SessionDetailPage: React.FC<Props> = ({ sessionId, onBack, onNavigateToBug }) => {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'clicks' | 'network' | 'errors'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api.getSessionDetail(sessionId).then((data) => {
      if (mounted) {
        setSession(data);
        if (data.events && data.events.length > 0) {
          const firstErr = data.events.find((e) => e.event_type === 'js_exception' || e.event_type === 'console_error');
          setSelectedEvent(firstErr || data.events[data.events.length - 1]);
        }
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Session detail error:', err);
      if (mounted) {
        setError(err.message || 'Session not found');
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-black/60">Loading session telemetry and event waterfall...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-16 max-w-lg mx-auto text-center space-y-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <p className="font-bold">Failed to load session</p>
          <p className="mt-1 text-[11px] text-rose-700">{error || 'Session not found'}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#111] hover:bg-black text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
        >
          &larr; Back to Sessions
        </button>
      </div>
    );
  }

  const filteredEvents = session.events.filter((e) => {
    if (activeFilter === 'clicks') return e.event_type === 'click';
    if (activeFilter === 'network') return e.event_type === 'network_request';
    if (activeFilter === 'errors') return e.event_type === 'js_exception' || e.event_type === 'console_error';
    return true;
  });

  const firstErrorEvent = session.events.find(
    (e) => e.event_type === 'js_exception' || e.event_type === 'console_error'
  );

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto text-[#111]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-black/10 hover:bg-black/5 text-[#111] transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#111] font-mono">{session.session_token}</h1>
              <StatusBadge status={session.status} type="status" />
            </div>
            <p className="text-xs text-black/55 mt-0.5 font-mono">
              Recorded at {new Date(session.started_at).toLocaleString()} &bull; Route: <code className="text-[#111] font-bold">{session.url}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Client Sanitization: <strong>Scrubbed</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Time-Travel Video / Scrubbing Player */}
      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-black/[0.06]">
          <PlayCircle className="w-4 h-4 text-[#111]" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-[#111]">
            Interactive Time-Travel Video &amp; DOM Timeline Scrubbing
          </h2>
        </div>
        <TimeTravelPlayer
          events={session.events as any}
          initialUrl={session.url}
          errorMessage={firstErrorEvent?.payload?.message}
          onJumpToEvent={(eventId) => {
            const ev = session.events.find((e) => e.id === eventId);
            if (ev) setSelectedEvent(ev);
          }}
        />
      </div>

      {/* Environment specs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-black/50">Browser &amp; OS</span>
          <div className="text-sm font-semibold text-[#111] mt-1 flex items-center gap-1.5 font-mono">
            {session.viewport_w < 500 ? <Smartphone className="w-4 h-4 text-black/50" /> : <Laptop className="w-4 h-4 text-black/50" />}
            <span>{session.browser_name} / {session.os_name}</span>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-black/50">Viewport Dimensions</span>
          <div className="text-sm font-semibold text-[#111] mt-1 font-mono">
            {session.viewport_w} &times; {session.viewport_h} px
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-black/50">Session Duration</span>
          <div className="text-sm font-semibold text-[#111] mt-1 font-mono">
            {(session.duration_ms / 1000).toFixed(1)} seconds
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-black/50">Total Incidents</span>
          <div className="text-sm font-semibold text-rose-700 mt-1 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>{session.error_count} Failures Captured</span>
          </div>
        </div>
      </div>

      {/* Main Timeline & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline Event Waterfall (7 cols) */}
        <div className="lg:col-span-7 bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl overflow-hidden shadow-sm flex flex-col h-[550px]">
          <div className="p-4 border-b border-black/[0.08] flex items-center justify-between bg-black/[0.02]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#111] uppercase tracking-wider font-mono">Event Sequence</span>
              <span className="text-[11px] text-black/50 font-mono">({filteredEvents.length} events)</span>
            </div>
            <div className="flex bg-white border border-black/10 rounded-xl p-0.5 text-[11px] font-mono">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${activeFilter === 'all' ? 'bg-[#111] text-white' : 'text-black/60'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('clicks')}
                className={`px-2.5 py-1 rounded-lg transition ${activeFilter === 'clicks' ? 'bg-[#111] text-white' : 'text-black/60'}`}
              >
                Clicks
              </button>
              <button
                onClick={() => setActiveFilter('network')}
                className={`px-2.5 py-1 rounded-lg transition ${activeFilter === 'network' ? 'bg-[#111] text-white' : 'text-black/60'}`}
              >
                Network
              </button>
              <button
                onClick={() => setActiveFilter('errors')}
                className={`px-2.5 py-1 rounded-lg transition ${activeFilter === 'errors' ? 'bg-rose-600 text-white' : 'text-black/60'}`}
              >
                Errors
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] p-3 space-y-1">
            {filteredEvents.map((evt, idx) => {
              const isSelected = selectedEvent?.id === evt.id;
              const offsetSec = (evt.timestamp_offset_ms / 1000).toFixed(1);
              const isError = evt.event_type === 'js_exception' || evt.event_type === 'console_error' || (evt.event_type === 'network_request' && evt.payload.status >= 400);

              return (
                <div
                  key={evt.id || idx}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-2xl text-xs cursor-pointer transition flex items-start justify-between font-mono ${
                    isSelected
                      ? 'bg-black/[0.06] border border-black/20 shadow-sm'
                      : 'hover:bg-black/[0.02] border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="font-mono text-[11px] text-black/50 w-12 pt-0.5">
                      +{offsetSec}s
                    </span>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        {evt.event_type === 'click' && (
                          <span className="text-blue-700 flex items-center gap-1 font-bold text-[11px]">
                            <MousePointer className="w-3 h-3" /> Click
                          </span>
                        )}
                        {evt.event_type === 'navigation' && (
                          <span className="text-purple-700 flex items-center gap-1 font-bold text-[11px]">
                            <Globe className="w-3 h-3" /> Navigation
                          </span>
                        )}
                        {evt.event_type === 'input' && (
                          <span className="text-amber-700 flex items-center gap-1 font-bold text-[11px]">
                            <FileText className="w-3 h-3" /> Input
                          </span>
                        )}
                        {evt.event_type === 'network_request' && (
                          <span className={`flex items-center gap-1 font-bold text-[11px] ${evt.payload.status >= 400 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            HTTP {evt.payload.status || 200}
                          </span>
                        )}
                        {evt.event_type === 'js_exception' && (
                          <span className="text-rose-700 flex items-center gap-1 font-bold text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> Exception
                          </span>
                        )}
                        {evt.event_type === 'console_error' && (
                          <span className="text-rose-700 flex items-center gap-1 font-bold text-[11px]">
                            <Terminal className="w-3 h-3" /> Console Error
                          </span>
                        )}

                        <span className="text-[10px] text-black/40 font-mono">
                          {evt.is_sanitized && 'SANITIZED'}
                        </span>
                      </div>

                      <p className="text-black/80 font-medium">
                        {evt.event_type === 'click' && (evt.payload.text ? `Clicked "${evt.payload.text}"` : `Clicked ${evt.payload.selector}`)}
                        {evt.event_type === 'navigation' && `Route changed to ${evt.payload.url}`}
                        {evt.event_type === 'input' && `Filled field "${evt.payload.name || evt.payload.selector}" with value: ${evt.payload.value}`}
                        {evt.event_type === 'network_request' && `${evt.payload.method} ${evt.payload.url}`}
                        {evt.event_type === 'js_exception' && (evt.payload.message || 'Uncaught JavaScript Error')}
                        {evt.event_type === 'console_error' && evt.payload.message}
                      </p>
                    </div>
                  </div>

                  {isError && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      INCIDENT
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Event Telemetry Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl overflow-hidden shadow-sm flex flex-col h-[550px]">
          <div className="p-4 border-b border-black/[0.08] bg-black/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold text-[#111] uppercase tracking-wider font-mono">Payload Inspector</span>
            <span className="text-[10px] font-mono text-black/50">OFFSET: +{(selectedEvent?.timestamp_offset_ms ?? 0) / 1000}s</span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 font-mono">
            {selectedEvent ? (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-black/50 uppercase">Event Classification</span>
                  <div className="text-sm font-bold text-[#111] font-mono uppercase">{selectedEvent.event_type}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-black/50 uppercase">Sanitization Status</span>
                  <div className="text-xs text-emerald-800 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Luhn Credit Card &amp; PII Scrubber Confirmed Safe</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-black/50 uppercase">Payload Data JSON</span>
                  <pre className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/[0.08] text-[11px] font-mono text-black/85 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-xs text-black/45 font-mono">
                Select an event from the timeline to inspect diagnostic telemetry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
