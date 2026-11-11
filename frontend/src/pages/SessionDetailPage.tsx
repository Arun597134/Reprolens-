import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Laptop, Smartphone, AlertTriangle, ShieldCheck,
  MousePointer, FileText, Globe, Terminal, ArrowUpRight
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'clicks' | 'network' | 'errors'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getSessionDetail(sessionId).then((data) => {
      if (mounted) {
        setSession(data);
        if (data.events.length > 0) {
          // Select first error event by default or last event
          const firstErr = data.events.find((e) => e.event_type === 'js_exception' || e.event_type === 'console_error');
          setSelectedEvent(firstErr || data.events[data.events.length - 1]);
        }
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [sessionId]);

  if (loading || !session) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading session telemetry and event waterfall...
      </div>
    );
  }

  const filteredEvents = session.events.filter((e) => {
    if (activeFilter === 'clicks') return e.event_type === 'click';
    if (activeFilter === 'network') return e.event_type === 'network_request';
    if (activeFilter === 'errors') return e.event_type === 'js_exception' || e.event_type === 'console_error';
    return true;
  });

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
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

      {/* Environment specs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500">Browser & OS</span>
          <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
            {session.viewport_w < 500 ? <Smartphone className="w-4 h-4 text-slate-400" /> : <Laptop className="w-4 h-4 text-slate-400" />}
            <span>{session.browser_name} / {session.os_name}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500">Viewport Dimensions</span>
          <div className="text-sm font-semibold text-white mt-1 font-mono">
            {session.viewport_w} &times; {session.viewport_h} px
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500">Session Duration</span>
          <div className="text-sm font-semibold text-white mt-1">
            {(session.duration_ms / 1000).toFixed(1)} seconds
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500">Total Incidents</span>
          <div className="text-sm font-semibold text-red-400 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{session.error_count} Failures Captured</span>
          </div>
        </div>
      </div>

      {/* Main Timeline & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline Event Waterfall (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-850/80">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Event Sequence</span>
              <span className="text-[11px] text-slate-400">({filteredEvents.length} events)</span>
            </div>
            <div className="flex bg-slate-900 border border-slate-800 rounded-md p-0.5 text-[11px]">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2 py-0.5 rounded ${activeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('clicks')}
                className={`px-2 py-0.5 rounded ${activeFilter === 'clicks' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              >
                Clicks
              </button>
              <button
                onClick={() => setActiveFilter('network')}
                className={`px-2 py-0.5 rounded ${activeFilter === 'network' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              >
                Network
              </button>
              <button
                onClick={() => setActiveFilter('errors')}
                className={`px-2 py-0.5 rounded ${activeFilter === 'errors' ? 'bg-red-950/80 text-red-400' : 'text-slate-400'}`}
              >
                Errors
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {filteredEvents.map((evt, idx) => {
              const isSelected = selectedEvent?.id === evt.id;
              const offsetSec = (evt.timestamp_offset_ms / 1000).toFixed(1);
              const isError = evt.event_type === 'js_exception' || evt.event_type === 'console_error' || (evt.event_type === 'network_request' && evt.payload.status >= 400);

              return (
                <div
                  key={evt.id || idx}
                  onClick={() => setSelectedEvent(evt)}
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
                        {evt.event_type === 'navigation' && `Route changed to ${evt.payload.url}`}
                        {evt.event_type === 'input' && `Filled field "${evt.payload.name || evt.payload.selector}" with value: ${evt.payload.value}`}
                        {evt.event_type === 'network_request' && `${evt.payload.method} ${evt.payload.url}`}
                        {evt.event_type === 'js_exception' && (evt.payload.message || 'Uncaught JavaScript Error')}
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

        {/* Selected Event Telemetry Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="p-3 border-b border-slate-800 bg-slate-850/80 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Payload Inspector</span>
            <span className="text-[10px] font-mono text-slate-400">OFFSET: +{(selectedEvent?.timestamp_offset_ms ?? 0) / 1000}s</span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {selectedEvent ? (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Event Classification</span>
                  <div className="text-sm font-bold text-white font-mono uppercase">{selectedEvent.event_type}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Sanitization Status</span>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Luhn Credit Card & PII Scrubber Confirmed Safe</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Payload Data JSON</span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-xs text-slate-500">
                Select an event from the timeline to inspect diagnostic telemetry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
