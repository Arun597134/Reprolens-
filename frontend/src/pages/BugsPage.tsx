import React, { useState } from 'react';
import { Bug, Search, Filter, AlertTriangle, ArrowRight } from 'lucide-react';
import { BugReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  bugs: BugReport[];
  onSelectBug: (bugId: string) => void;
}

export const BugsPage: React.FC<Props> = ({ bugs, onSelectBug }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filtered = bugs.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (severityFilter !== 'all' && b.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.error_message.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.error_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto text-[#111]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#111] tracking-tight">Bug Reports &amp; Case Files</h1>
          <p className="text-xs text-black/55 mt-1 font-mono">
            Correlated runtime exceptions, network drops, and user journey diagnostics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
            <input
              type="text"
              placeholder="Search bugs, exceptions, routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-black/15 rounded-xl pl-9 pr-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black w-64 shadow-sm"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-[#111] focus:outline-none focus:border-black shadow-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-[#111] focus:outline-none focus:border-black shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="reproduced">Reproduced</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-black/[0.06]">
          {filtered.map((bug) => (
            <div
              key={bug.id}
              onClick={() => onSelectBug(bug.id)}
              className="p-5 hover:bg-black/[0.02] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <StatusBadge status={bug.severity} type="severity" />
                  <StatusBadge status={bug.status} type="status" />
                  <span className="text-xs font-bold text-black/70">{bug.error_type}</span>
                  <span className="text-xs text-black/45">&bull; {bug.url}</span>
                </div>
                <h4 className="font-bold text-sm text-[#111] hover:text-blue-600 transition">
                  {bug.title}
                </h4>
                <p className="text-xs text-black/60 line-clamp-1">
                  {bug.error_message}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-black/45 pt-1">
                  <span>Reported: {new Date(bug.created_at).toLocaleString()}</span>
                  {bug.session_id && <span>Session: <strong className="text-black/70">{bug.session_id}</strong></span>}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBug(bug.id);
                  }}
                  className="px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Inspect Case &rarr;
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-16 text-center text-xs text-black/45 font-mono">
              No bug reports found matching the filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
