import React from 'react';
import { RefreshCw, Download, Globe, Terminal, Sparkles, ExternalLink } from 'lucide-react';
import { Project } from '../types';

interface Props {
  projects: Project[];
  selectedProject?: Project;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onGoToLanding: () => void;
}

export const Navbar: React.FC<Props> = ({ projects, selectedProject, onRefresh, isRefreshing, onGoToLanding }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold text-slate-400">Project:</span>
        <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>{selectedProject?.name || 'ShopNow E-Commerce'}</span>
          <span className="text-[10px] font-mono text-slate-400 ml-1">({selectedProject?.api_key || 'rpl_shopnow_demo_key_99'})</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Switch to Enterprise Portal / Download Center */}
        <button
          onClick={onGoToLanding}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-brand-400 hover:text-brand-300 text-xs font-semibold border border-brand-500/30 transition shadow-sm"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Enterprise Portal & Download Hub</span>
        </button>

        <a
          href="http://localhost:8000/download/extension.zip"
          download="reprolens-extension-v1.0.0.zip"
          className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700/80 transition"
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          <span>Extension .zip</span>
        </a>

        <div className="flex items-center space-x-2 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50 text-[11px] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Capture Engine: <strong className="text-emerald-400">Listening (:8000)</strong></span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700/70 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
