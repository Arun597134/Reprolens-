import React from 'react';
import { RefreshCw, ExternalLink, Globe, Workflow } from 'lucide-react';
import { Project } from '../types';

interface Props {
  projects: Project[];
  selectedProject?: Project;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onGoToLanding?: () => void;
}

export const Navbar: React.FC<Props> = ({
  projects,
  selectedProject,
  onRefresh,
  isRefreshing,
  onGoToLanding
}) => {
  return (
    <header className="h-16 border-b border-black/[0.08] bg-[#F5F4F0]/80 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-black/50">Target Project:</span>
        <div className="flex items-center space-x-2 bg-white/90 border border-black/10 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-[#111] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">{selectedProject?.name || 'Arun M portfolio'}</span>
          <span className="text-[10px] text-black/45 ml-1">
            ({selectedProject?.api_key || 'rpl_3b40c1052e5b1070bd90ee0900d884af'})
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-[11px] font-mono text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Capture Engine: <strong className="font-bold">Listening (:8000)</strong></span>
        </div>

        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-black/5 text-[#111] text-xs font-mono font-bold border border-black/10 transition shadow-sm cursor-pointer"
            title="Open Website & Autonomous n8n Workflow Hub"
          >
            <Workflow className="w-3.5 h-3.5 text-black" />
            <span>Website &amp; Hub</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#111] hover:bg-black text-white text-xs font-mono font-bold transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
