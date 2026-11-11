import React, { useState } from 'react';
import { FolderGit2, Plus, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';
import { Project } from '../types';
import { api } from '../api';

interface Props {
  projects: Project[];
  onRefresh: () => void;
}

export const ProjectsPage: React.FC<Props> = ({ projects, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    try {
      await api.createProject({ name, website_url: url });
      setName('');
      setUrl('');
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project and all its recorded sessions?')) {
      try {
        await api.deleteProject(id);
        onRefresh();
      } catch (err: any) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Projects</h1>
          <p className="text-xs text-slate-400 mt-1">Manage instrumented websites, ingest API keys, and privacy policies</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-brand-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{proj.name}</h3>
                  <a href={proj.website_url} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-brand-400 flex items-center gap-1">
                    <span>{proj.website_url}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleDelete(proj.id)}
                className="text-slate-500 hover:text-red-400 p-1 transition"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Project API Key</label>
              <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate mr-2">{proj.api_key}</span>
                <button
                  onClick={() => handleCopy(proj.api_key)}
                  className="text-slate-400 hover:text-white"
                  title="Copy Key"
                >
                  {copiedKey === proj.api_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Created: {new Date(proj.created_at).toLocaleDateString()}</span>
              <span className="text-emerald-400 font-semibold">Active Ingestion</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Instrument New Project</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme SaaS Webapp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Target Website URL</label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:3000 or https://myapp.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
                >
                  Generate Key & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
