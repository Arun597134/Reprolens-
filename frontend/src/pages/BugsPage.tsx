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
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bug Reports & Case Files</h1>
          <p className="text-xs text-slate-400 mt-1">
            Correlated runtime exceptions, network drops, and user journey diagnostics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search bugs, exceptions, routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 w-64"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
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
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="reproduced">Reproduced</option>
            <option value="regression_ready">Regression Ready</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800/80">
          {filtered.map((bug) => (
            <div
              key={bug.id}
              onClick={() => onSelectBug(bug.id)}
              className="p-5 hover:bg-slate-850/60 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-4xl">
                <div className="flex items-center space-x-2.5">
                  <StatusBadge status={bug.severity} type="severity" />
                  <StatusBadge status={bug.status} type="status" />
                  <span className="text-xs font-mono text-brand-400 font-semibold">{bug.error_type}</span>
                  <span className="text-xs text-slate-500">&bull; {bug.url}</span>
                </div>

                <h3 className="font-bold text-base text-white hover:text-brand-400 transition">
                  {bug.title}
                </h3>

                <p className="text-xs text-slate-400 font-mono line-clamp-2 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  {bug.error_message}
                </p>

                <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                  <span>Captured: {new Date(bug.created_at).toLocaleString()}</span>
                  {bug.component_context && <span>Target: <code className="text-slate-400">{bug.component_context}</code></span>}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBug(bug.id);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 text-xs font-bold rounded-lg border border-brand-500/30 transition shadow-sm"
                >
                  <span>Investigate Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-500">
              No bug reports matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
