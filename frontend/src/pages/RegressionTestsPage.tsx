import React from 'react';
import { FileCheck2, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { BugReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  bugs: BugReport[];
  onSelectBug: (bugId: string) => void;
}

export const RegressionTestsPage: React.FC<Props> = ({ bugs, onSelectBug }) => {
  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Regression Test Suite</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated `@playwright/test` specifications guarding against failure regressions in CI/CD
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
                <StatusBadge status={bug.status === 'reproduced' ? 'regression_ready' : bug.status} type="status" />
                <span className="text-xs font-mono text-slate-400">Framework: @playwright/test</span>
              </div>
              <h3 className="font-bold text-sm text-white">
                Regression Guard: {bug.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Verifies resilient UI error boundaries when <code className="text-slate-300">{bug.url}</code> experiences API degradation.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectBug(bug.id);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600/15 hover:bg-brand-600/25 text-brand-400 text-xs font-bold rounded-lg border border-brand-500/30 transition self-end md:self-auto"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Inspect & Execute Test &rarr;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
