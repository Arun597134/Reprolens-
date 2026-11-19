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
    <div className="space-y-6 p-8 max-w-7xl mx-auto text-[#111]">
      <div>
        <h1 className="text-3xl font-light text-[#111] tracking-tight">AI Case File Investigations</h1>
        <p className="text-xs text-black/55 mt-1 font-mono">
          Root cause analysis distinguishing observed facts, causal inferences, and unverified hypotheses
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 font-mono">
        {bugs.map((bug) => (
          <div
            key={bug.id}
            onClick={() => onSelectBug(bug.id)}
            className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center space-x-2.5">
                <StatusBadge status={bug.severity} type="severity" />
                <StatusBadge status={bug.status} type="status" />
                <span className="text-xs font-mono text-black/60 font-bold">{bug.error_type}</span>
              </div>

              <h3 className="font-bold text-base text-[#111] hover:text-blue-600 transition">
                {bug.title}
              </h3>

              <p className="text-xs text-black/70 font-mono line-clamp-1 bg-black/[0.02] p-2.5 rounded-xl border border-black/[0.06]">
                {bug.error_message}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectBug(bug.id);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm self-end md:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Review AI Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
