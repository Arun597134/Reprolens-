import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Code2 } from 'lucide-react';
import { BugReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  bugs: BugReport[];
  onSelectBug: (bugId: string) => void;
}

export const InvestigationsPage: React.FC<Props> = ({ bugs, onSelectBug }) => {
  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Case File Investigations</h1>
        <p className="text-xs text-slate-400 mt-1">
          Root cause analysis distinguishing observed facts, causal inferences, and unverified hypotheses
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bugs.map((bug) => (
          <div
            key={bug.id}
            onClick={() => onSelectBug(bug.id)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center space-x-2.5">
                <StatusBadge status={bug.severity} type="severity" />
                <StatusBadge status={bug.status} type="status" />
                <span className="text-xs font-mono text-slate-400">{bug.error_type}</span>
              </div>

              <h3 className="font-bold text-base text-white hover:text-brand-400 transition">
                {bug.title}
              </h3>

              <p className="text-xs text-slate-400 font-mono line-clamp-1 bg-slate-950/70 p-2 rounded border border-slate-800">
                {bug.error_message}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectBug(bug.id);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600/15 hover:bg-brand-600/25 text-brand-400 text-xs font-bold rounded-lg border border-brand-500/30 transition self-end md:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review AI Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
