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
    <div className="space-y-6 p-8 max-w-7xl mx-auto text-[#111]">
      <div>
        <h1 className="text-3xl font-light text-[#111] tracking-tight">AI Regression Test Suite</h1>
        <p className="text-xs text-black/55 mt-1 font-mono">
          Automated `@playwright/test` specifications guarding against failure regressions in CI/CD
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
                <StatusBadge status={bug.status === 'reproduced' ? 'regression_ready' : bug.status} type="status" />
                <span className="text-xs font-mono text-black/55 font-bold">Framework: @playwright/test</span>
              </div>
              <h3 className="font-bold text-base text-[#111] hover:text-blue-600 transition">
                Regression Guard: {bug.title}
              </h3>
              <p className="text-xs text-black/65 font-mono">
                Verifies resilient UI error boundaries when <code className="text-[#111] font-bold">{bug.url}</code> experiences API degradation.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectBug(bug.id);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm self-end md:self-auto"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Inspect &amp; Execute Test &rarr;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
