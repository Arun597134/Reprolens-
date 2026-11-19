import React, { useState } from 'react';
import { Video, AlertCircle, CheckCircle, Search, Laptop, Smartphone } from 'lucide-react';
import { SessionSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  sessions: SessionSummary[];
  onSelectSession: (sessionId: string) => void;
}

export const SessionsPage: React.FC<Props> = ({ sessions, onSelectSession }) => {
  const [filter, setFilter] = useState<'all' | 'errors' | 'clean'>('all');
  const [search, setSearch] = useState('');

  const filtered = sessions.filter((s) => {
    if (filter === 'errors' && s.error_count === 0) return false;
    if (filter === 'clean' && s.error_count > 0) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.session_token.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        s.browser_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#111] tracking-tight">Recorded Telemetry Sessions</h1>
          <p className="text-xs text-black/55 mt-1 font-mono">
            Full chronological DOM interactions, network waterfalls, and console error traces
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
            <input
              type="text"
              placeholder="Search by URL, browser, session..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-black/15 rounded-xl pl-9 pr-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black w-64 shadow-sm"
            />
          </div>

          <div className="flex bg-white border border-black/15 rounded-xl p-0.5 text-xs font-mono shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'all' ? 'bg-[#111] text-white shadow-sm' : 'text-black/60 hover:text-black'}`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'errors' ? 'bg-rose-600 text-white shadow-sm' : 'text-black/60 hover:text-black'}`}
            >
              Errors ({sessions.filter((s) => s.error_count > 0).length})
            </button>
            <button
              onClick={() => setFilter('clean')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'clean' ? 'bg-emerald-600 text-white shadow-sm' : 'text-black/60 hover:text-black'}`}
            >
              Clean ({sessions.filter((s) => s.error_count === 0).length})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl overflow-hidden shadow-sm text-[#111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/[0.02] border-b border-black/[0.08] text-[10px] uppercase tracking-wider text-black/50">
              <tr>
                <th className="py-3 px-4">Session Token</th>
                <th className="py-3 px-4">URL Route</th>
                <th className="py-3 px-4">Browser &amp; OS</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Incidents</th>
                <th className="py-3 px-4">Recorded At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {filtered.map((s) => (
                <tr
                  key={s.id || s.session_token}
                  onClick={() => onSelectSession(s.id)}
                  className="hover:bg-black/[0.02] transition cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-bold text-[#111] flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-black/50" />
                    <span className="truncate max-w-[150px]">{s.session_token}</span>
                  </td>
                  <td className="py-3.5 px-4 text-black/70 max-w-[200px] truncate">{s.url}</td>
                  <td className="py-3.5 px-4 text-black/60">
                    {s.browser_name} &bull; {s.os_name}
                  </td>
                  <td className="py-3.5 px-4 text-black/80 font-bold">{(s.duration_ms / 1000).toFixed(1)}s</td>
                  <td className="py-3.5 px-4">
                    {s.error_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]">
                        <AlertCircle className="w-3 h-3" />
                        {s.error_count} Errors
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                        <CheckCircle className="w-3 h-3" /> Clean
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-black/50">
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession(s.id);
                      }}
                      className="px-3.5 py-1.5 bg-[#111] hover:bg-black text-white text-[11px] font-bold rounded-xl transition shadow-sm cursor-pointer"
                    >
                      Replay &rarr;
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black/45">
                    No sessions match the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
