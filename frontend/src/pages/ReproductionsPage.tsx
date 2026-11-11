import React from 'react';
import { PlayCircle, CheckCircle, AlertTriangle, ArrowRight, Laptop } from 'lucide-react';
import { BugReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  bugs: BugReport[];
  onSelectBug: (bugId: string) => void;
}

export const ReproductionsPage: React.FC<Props> = ({ bugs, onSelectBug }) => {
  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Playwright Browser Reproductions</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated headless browser executions validating customer bug recreation under identical viewports
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800/80">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              onClick={() => onSelectBug(bug.id)}
              className="p-5 hover:bg-slate-850/60 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <StatusBadge status={bug.status} type="status" />
                  <span className="text-xs text-slate-400 font-mono">{bug.url}</span>
                </div>
                <h3 className="font-bold text-sm text-white">{bug.title}</h3>
                <p className="text-xs text-slate-400 font-mono line-clamp-1">{bug.error_message}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBug(bug.id);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition self-end md:self-auto"
              >
                <PlayCircle className="w-3.5 h-3.5 text-brand-400" />
                <span>Replay Console &rarr;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
