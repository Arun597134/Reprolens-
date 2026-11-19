import React from 'react';
import {
  LayoutDashboard, FolderGit2, Video, Bug, Sparkles, PlayCircle,
  FileCheck2, Settings, ShieldCheck, Terminal, ExternalLink
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unresolvedCount?: number;
}

export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, unresolvedCount = 0 }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'sessions', label: 'Sessions Replay', icon: Video },
    { id: 'bugs', label: 'Bug Reports', icon: Bug, count: unresolvedCount },
    { id: 'investigations', label: 'AI Investigations', icon: Sparkles },
    { id: 'reproductions', label: 'Playwright Replay', icon: PlayCircle },
    { id: 'regression-tests', label: 'Regression Tests', icon: FileCheck2 },
    { id: 'settings', label: 'Settings & SDK', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#F5F4F0] border-r border-black/[0.08] flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-black/[0.08] flex items-center justify-between px-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#111] flex items-center justify-center text-white font-bold shadow-sm">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#111]">Repro<span className="text-black/50">Lens</span></span>
              <span className="block text-[10px] text-black/45 font-mono -mt-1 tracking-wider">v1.0.0-PRO</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Engine Online" />
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-black/45 uppercase tracking-widest font-mono">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-sm font-semibold'
                    : 'text-black/70 hover:text-black hover:bg-black/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-black/50'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-black/[0.08] space-y-3">
        <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.06] space-y-1.5">
          <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-black/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Telemetry Privacy</span>
          </div>
          <p className="text-[10px] text-black/55 font-mono leading-relaxed">
            Luhn &amp; PII auto-scrubbing active on all streams.
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-black/45 px-1">
          <span>FastAPI Engine</span>
          <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">8000 OK</span>
        </div>
      </div>
    </aside>
  );
};
