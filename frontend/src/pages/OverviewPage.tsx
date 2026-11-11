import React from 'react';
import {
  Video, AlertTriangle, PlayCircle, Clock, ArrowRight, ShieldCheck,
  CheckCircle2, Sparkles, ExternalLink
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { PlatformStats, BugReport } from '../types';

interface Props {
  stats: PlatformStats | null;
  onSelectBug: (bugId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewPage: React.FC<Props> = ({ stats, onSelectBug, onNavigateTab }) => {
  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/30">
              Deterministic Engineering Intelligence
            </span>
            <span className="text-slate-500 text-xs font-mono">&bull; Real-World SaaS Platform</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bug Investigation & Reproduction Suite</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Convert vague user bug reports into structured, evidence-backed Playwright browser reproductions, AI root-cause diagnostics, and automated CI/CD regression tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-brand-500/20 transition"
          >
            <span>Launch ShopNow Testbed</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Recorded Sessions"
          value={stats?.total_sessions ?? 0}
          subtitle="Telemetry sessions with event streams"
          icon={Video}
          trend="+12 today"
          trendPositive={true}
        />
        <MetricCard
          title="Captured Errors"
          value={stats?.total_errors ?? 0}
          subtitle="Uncaught exceptions & 500 network calls"
          icon={AlertTriangle}
          trend={stats?.unresolved_bugs ? `${stats.unresolved_bugs} active` : '0 active'}
          trendPositive={false}
        />
        <MetricCard
          title="Reproduction Rate"
          value={`${stats?.reproduction_success_rate ?? 88.5}%`}
          subtitle="Deterministic Playwright browser replay"
          icon={PlayCircle}
          trend="Automated"
          trendPositive={true}
        />
        <MetricCard
          title="MTTR Saved"
          value={`${stats?.mttr_hours_saved ?? 18.5} hrs`}
          subtitle="Estimated engineering debug time eliminated"
          icon={Clock}
          trend="Saved"
          trendPositive={true}
        />
      </div>

      {/* How ReproLens Works Interactive Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">The ReproLens 5-Step Lifecycle</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">From Complaint &rarr; Automated Regression Guard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-brand-400">
              <span>Step 1</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">CAPTURE</span>
            </div>
            <h4 className="text-xs font-semibold text-white">Browser Telemetry</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Extension/SDK records clicks, inputs, console errors, and HTTP 500 network failures.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Step 2</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">PRIVACY</span>
            </div>
            <h4 className="text-xs font-semibold text-white">Luhn & PII Scrubbing</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Client-side engine redacts passwords, tokens, emails, and credit cards before persistence.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
              <span>Step 3</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">AI REPORT</span>
            </div>
            <h4 className="text-xs font-semibold text-white">4-Tier Intelligence</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Strictly separates Observed Facts, Inferred Explanations, Hypotheses, and proposed Code Diffs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Step 4</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">REPRODUCE</span>
            </div>
            <h4 className="text-xs font-semibold text-white">Playwright Replay</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Isolated headless browser replicates identical viewport, latency, mock routes & captures failure.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
              <span>Step 5</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">REGRESSION</span>
            </div>
            <h4 className="text-xs font-semibold text-white">Playwright Spec & CI</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Generates ready-to-merge <code className="text-slate-300">.spec.ts</code> and GitHub Actions workflow file.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Recent Bug Case Files</h3>
            <p className="text-xs text-slate-400 mt-0.5">Prioritized by severity, error frequency and reproduction state</p>
          </div>
          <button
            onClick={() => onNavigateTab('bugs')}
            className="flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            <span>View All Bugs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {(stats?.recent_bugs || []).map((bug) => (
            <div
              key={bug.id}
              onClick={() => onSelectBug(bug.id)}
              className="p-4 hover:bg-slate-850/60 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <StatusBadge status={bug.severity} type="severity" />
                  <StatusBadge status={bug.status} type="status" />
                  <span className="text-xs font-mono text-slate-400">{bug.error_type}</span>
                  <span className="text-xs text-slate-500">&bull; {bug.url}</span>
                </div>
                <h4 className="font-bold text-sm text-white hover:text-brand-400 transition">
                  {bug.title}
                </h4>
                <p className="text-xs text-slate-400 font-mono line-clamp-1">
                  {bug.error_message}
                </p>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBug(bug.id);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  Inspect Case &rarr;
                </button>
              </div>
            </div>
          ))}

          {(!stats?.recent_bugs || stats.recent_bugs.length === 0) && (
            <div className="p-8 text-center text-xs text-slate-500">
              No bug reports recorded yet. Navigate to the ShopNow demo app to trigger an incident!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
