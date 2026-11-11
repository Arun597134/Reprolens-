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
          <h1 className="text-2xl font-bold text-white tracking-tight">Recorded Telemetry Sessions</h1>
          <p className="text-xs text-slate-400 mt-1">Full chronological DOM interactions, network waterfalls, and console error traces</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by URL, browser, session..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 w-64"
            />
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition ${filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-3 py-1 rounded-md font-medium transition ${filter === 'errors' ? 'bg-red-950/80 text-red-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Errors Only ({sessions.filter((s) => s.error_count > 0).length})
            </button>
            <button
              onClick={() => setFilter('clean')}
              className={`px-3 py-1 rounded-md font-medium transition ${filter === 'clean' ? 'bg-emerald-950/80 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Clean ({sessions.filter((s) => s.error_count === 0).length})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-850/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
            <tr>
              <th className="py-3 px-4">Session Token</th>
              <th className="py-3 px-4">Initial Route</th>
              <th className="py-3 px-4">Environment</th>
              <th className="py-3 px-4">Viewport</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Errors</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((s) => (
              <tr
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className="hover:bg-slate-850/60 transition cursor-pointer"
              >
                <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                  <div className="flex items-center space-x-2">
                    <Video className="w-3.5 h-3.5 text-brand-400" />
                    <span>{s.session_token}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-300 font-mono max-w-xs truncate">
                  {s.url || '/'}
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    {s.viewport_w < 500 ? (
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{s.browser_name} ({s.os_name})</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">
                  {s.viewport_w} &times; {s.viewport_h}
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  {(s.duration_ms / 1000).toFixed(1)}s
                </td>
                <td className="py-3.5 px-4">
                  {s.error_count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-400 font-semibold bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded text-[11px]">
                      <AlertCircle className="w-3 h-3" />
                      {s.error_count} {s.error_count === 1 ? 'Error' : 'Errors'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px]">
                      <CheckCircle className="w-3 h-3" /> Clean
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/60 font-semibold transition">
                    Replay &rarr;
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No sessions match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
