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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">Repro<span className="text-brand-400">Lens</span></span>
              <span className="block text-[10px] text-slate-500 font-mono -mt-1">v1.0.0-PRO</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Engine Online" />
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-950/80 text-red-400 border border-red-800/60 text-[10px] font-bold rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Quick Link to Demo */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-850/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy Engine</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">ACTIVE</span>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700/60 transition"
        >
          <span>Open ShopNow Demo</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </aside>
  );
};
