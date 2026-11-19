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
      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-[#111]">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 text-[#111] border border-black/10 font-mono">
              Autonomous Bug Reproduction Engine
            </span>
            <span className="text-black/45 text-xs font-mono">&bull; Enterprise Live Telemetry</span>
          </div>
          <h1 className="text-3xl font-light text-[#111] tracking-tight">Bug Investigation &amp; Reproduction Suite</h1>
          <p className="text-xs text-black/60 max-w-2xl font-mono leading-relaxed">
            Convert user friction and runtime exceptions into deterministic Playwright browser reproductions, AI root-cause diagnostics, and automated regression tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://arun-m-portfolio.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#111] hover:bg-black text-white text-xs font-mono font-bold rounded-xl shadow-sm transition"
          >
            <span>Launch Live App</span>
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

      {/* 5-Step Lifecycle Pipeline */}
      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm text-[#111]">
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-black" />
            <h2 className="text-xs font-bold text-[#111] tracking-wide uppercase font-mono">The ReproLens 5-Step Lifecycle</h2>
          </div>
          <span className="text-xs text-black/45 font-mono">From Ingest &rarr; Automated Regression Guard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-black">
              <span>Step 1</span>
              <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full text-black/60">CAPTURE</span>
            </div>
            <h4 className="text-xs font-bold text-[#111] font-mono">Browser Telemetry</h4>
            <p className="text-[11px] text-black/60 leading-relaxed font-mono">
              Extension/SDK records clicks, inputs, console errors, and HTTP network failures.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-emerald-700">
              <span>Step 2</span>
              <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-800">PRIVACY</span>
            </div>
            <h4 className="text-xs font-bold text-[#111] font-mono">Luhn &amp; PII Scrub</h4>
            <p className="text-[11px] text-black/60 leading-relaxed font-mono">
              Client-side engine redacts passwords, tokens, emails, and credit cards before persistence.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-indigo-700">
              <span>Step 3</span>
              <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-800">AI REPORT</span>
            </div>
            <h4 className="text-xs font-bold text-[#111] font-mono">4-Tier Intelligence</h4>
            <p className="text-[11px] text-black/60 leading-relaxed font-mono">
              Separates Observed Facts, Inferred Explanations, Hypotheses, and proposed Code Diffs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-amber-700">
              <span>Step 4</span>
              <span className="text-[10px] bg-amber-50 px-2 py-0.5 rounded-full text-amber-800">REPRODUCE</span>
            </div>
            <h4 className="text-xs font-bold text-[#111] font-mono">Playwright Replay</h4>
            <p className="text-[11px] text-black/60 leading-relaxed font-mono">
              Isolated headless browser replicates viewport, latency, mocks routes &amp; captures failure.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-mono text-purple-700">
              <span>Step 5</span>
              <span className="text-[10px] bg-purple-50 px-2 py-0.5 rounded-full text-purple-800">REGRESSION</span>
            </div>
            <h4 className="text-xs font-bold text-[#111] font-mono">CI/CD &amp; Auto-PR</h4>
            <p className="text-[11px] text-black/60 leading-relaxed font-mono">
              Generates ready-to-merge Playwright spec and creates GitHub PR automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl overflow-hidden shadow-sm text-[#111]">
        <div className="p-5 border-b border-black/[0.08] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#111] font-mono">Recent Bug Case Files</h3>
            <p className="text-xs text-black/55 mt-0.5 font-mono">Prioritized by severity, error frequency and reproduction state</p>
          </div>
          <button
            onClick={() => onNavigateTab('bugs')}
            className="flex items-center space-x-1 text-xs text-[#111] hover:text-black font-bold font-mono underline"
          >
            <span>View All Bugs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-black/[0.06]">
          {(stats?.recent_bugs || []).map((bug) => (
            <div
              key={bug.id}
              onClick={() => onSelectBug(bug.id)}
              className="p-5 hover:bg-black/[0.02] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <StatusBadge status={bug.severity} type="severity" />
                  <StatusBadge status={bug.status} type="status" />
                  <span className="text-xs font-mono text-black/60">{bug.error_type}</span>
                  <span className="text-xs text-black/45 font-mono">&bull; {bug.url}</span>
                </div>
                <h4 className="font-bold text-sm text-[#111] hover:text-blue-600 transition font-mono">
                  {bug.title}
                </h4>
                <p className="text-xs text-black/60 font-mono line-clamp-1">
                  {bug.error_message}
                </p>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBug(bug.id);
                  }}
                  className="px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-mono font-bold rounded-xl transition shadow-sm"
                >
                  Inspect Case &rarr;
                </button>
              </div>
            </div>
          ))}

          {(!stats?.recent_bugs || stats.recent_bugs.length === 0) && (
            <div className="p-8 text-center text-xs text-black/50 font-mono">
              No bug reports recorded yet. Stream events via extension or SDK!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
