import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Folder, Code2, Sparkles, Terminal, X, ArrowUpRight } from 'lucide-react';
import { BugReport, Investigation } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bug: BugReport;
  investigation?: Investigation | null;
}

export const VsCodeDeepLinkModal: React.FC<Props> = ({ isOpen, onClose, bug, investigation }) => {
  const [workspaceRoot, setWorkspaceRoot] = useState<string>(() => {
    return localStorage.getItem('reprolens_vscode_root') || 'c:/Users/WELCOME/OneDrive/Desktop/Raprolens';
  });
  const [targetFile, setTargetFile] = useState<string>('src/App.tsx');
  const [lineNumber, setLineNumber] = useState<number>(1);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [editorType, setEditorType] = useState<'vscode' | 'cursor'>('vscode');

  // Extract file & line from stack trace or investigation
  useEffect(() => {
    if (!isOpen) return;

    let detectedFile = 'src/App.tsx';
    let detectedLine = 1;

    // 1. Check investigation recommendation
    if (investigation?.fix_recommendations && investigation.fix_recommendations.length > 0) {
      const rec = investigation.fix_recommendations[0];
      const p = rec.file_path || rec.file;
      if (p) {
        detectedFile = p.replace(/^[/\\]+/, '');
      }
    }

    // 2. Fallback to parse stack trace
    if (bug.stack_trace) {
      const match = bug.stack_trace.match(/at\s+.*?(?:\/|\\|\()([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+):(\d+)/);
      if (match) {
        detectedFile = match[1].replace(/^[/\\]+/, '');
        detectedLine = parseInt(match[2], 10) || 1;
      }
    }

    setTargetFile(detectedFile);
    setLineNumber(detectedLine);
  }, [isOpen, bug, investigation]);

  if (!isOpen) return null;

  // Extract patch content
  const patchCode = (() => {
    if (investigation?.evidence?.staged_patch?.patched_content) {
      return investigation.evidence.staged_patch.patched_content;
    }
    if (investigation?.fix_recommendations && investigation.fix_recommendations.length > 0) {
      const rec = investigation.fix_recommendations[0];
      return (rec as any).replacement || rec.diff || '';
    }
    return `// ReproLens Verified Patch for ${bug.error_type}\n// Target: ${targetFile}:${lineNumber}\n// Guard unhydrated state or handle network drop\n`;
  })();

  const normalizedRoot = workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '');
  const cleanTarget = targetFile.replace(/\\/g, '/').replace(/^\/+/, '');
  const fullPath = `${normalizedRoot}/${cleanTarget}`;
  const deepLinkUri = `${editorType}://file/${fullPath}:${lineNumber}:1`;

  const handleSaveRoot = (val: string) => {
    setWorkspaceRoot(val);
    localStorage.setItem('reprolens_vscode_root', val);
  };

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(patchCode);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLinkUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunchEditor = () => {
    handleCopyPatch();
    window.location.href = deepLinkUri;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-black/[0.1] max-w-xl w-full p-6 space-y-5 shadow-2xl text-[#111] font-mono">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              {editorType === 'vscode' ? (
                <Code2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111]">
                Open in {editorType === 'vscode' ? 'VS Code' : 'Cursor IDE'}
              </h2>
              <p className="text-xs text-black/55">
                Jump directly to <code className="font-bold text-black">{targetFile}:{lineNumber}</code> with verified patch in clipboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Selector */}
        <div className="flex items-center gap-2 p-1 bg-black/[0.04] rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setEditorType('vscode')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              editorType === 'vscode' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-black/60 hover:text-black'
            }`}
          >
            Visual Studio Code (`vscode://`)
          </button>
          <button
            type="button"
            onClick={() => setEditorType('cursor')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              editorType === 'cursor' ? 'bg-white shadow-xs text-purple-600 font-bold' : 'text-black/60 hover:text-black'
            }`}
          >
            Cursor Editor (`cursor://`)
          </button>
        </div>

        {/* Path Settings */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">
              Local Project Root Directory:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workspaceRoot}
                onChange={(e) => handleSaveRoot(e.target.value)}
                placeholder="e.g. C:/Users/WELCOME/OneDrive/Desktop/Raprolens"
                className="flex-1 bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-[#111] focus:outline-none focus:border-black"
              />
            </div>
            <p className="text-[10px] text-black/50 mt-1">Saved locally in browser storage for instant 1-click jumps.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">Target Source File:</label>
              <input
                type="text"
                value={targetFile}
                onChange={(e) => setTargetFile(e.target.value)}
                className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-[#111] focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-black/60 mb-1">Line Number:</label>
              <input
                type="number"
                value={lineNumber}
                onChange={(e) => setLineNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-[#111] focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Patch Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-black/70">
            <span>Verified Patch Replacement (Auto-Copies on Jump):</span>
            <button
              onClick={handleCopyPatch}
              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              {copiedPatch ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPatch ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-black/[0.04] border border-black/[0.08] text-[11px] text-black/85 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono">
            {patchCode}
          </pre>
        </div>

        {/* Deep Link Preview */}
        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-[11px] text-blue-900 flex items-center justify-between gap-2">
          <span className="truncate">{deepLinkUri}</span>
          <button onClick={handleCopyLink} className="text-blue-700 hover:text-blue-950 p-1 shrink-0" title="Copy URI">
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-black/60 hover:text-black transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunchEditor}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch {editorType === 'vscode' ? 'VS Code' : 'Cursor'} &amp; Copy Patch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
