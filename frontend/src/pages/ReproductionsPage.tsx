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
    <div className="space-y-6 p-8 max-w-7xl mx-auto text-[#111]">
      <div>
        <h1 className="text-3xl font-light text-[#111] tracking-tight">Playwright Browser Reproductions</h1>
        <p className="text-xs text-black/55 mt-1 font-mono">
          Automated headless browser executions validating customer bug recreation under identical viewports
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl overflow-hidden shadow-sm font-mono">
        <div className="divide-y divide-black/[0.06]">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              onClick={() => onSelectBug(bug.id)}
              className="p-5 hover:bg-black/[0.02] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <StatusBadge status={bug.status} type="status" />
                  <span className="text-xs text-black/55 font-mono">{bug.url}</span>
                </div>
                <h3 className="font-bold text-sm text-[#111]">{bug.title}</h3>
                <p className="text-xs text-black/65 font-mono line-clamp-1">{bug.error_message}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBug(bug.id);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm self-end md:self-auto"
              >
                <PlayCircle className="w-3.5 h-3.5 text-white" />
                <span>Replay Console &rarr;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
