import React, { useState } from 'react';
import { FolderGit2, Plus, Copy, Check, ExternalLink, Trash2, GitBranch, Globe, Sparkles, Zap } from 'lucide-react';
import { Project, GitHubDiscoveredRepo } from '../types';
import { api } from '../api';

interface Props {
  projects: Project[];
  onRefresh: () => void;
}

export const ProjectsPage: React.FC<Props> = ({ projects, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [projectMode, setProjectMode] = useState<'own_repo' | 'external_monitor'>('own_repo');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Inline repo linking state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'own_repo' | 'external_monitor'>('external_monitor');
  const [editRepo, setEditRepo] = useState('');
  const [editBranch, setEditBranch] = useState('main');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [discoveredRepos, setDiscoveredRepos] = useState<GitHubDiscoveredRepo[]>([]);
  const [isDiscoveringRepos, setIsDiscoveringRepos] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [discoverNotice, setDiscoverNotice] = useState('');

  const handleDiscoverRepos = async (target: 'create' | 'edit') => {
    setIsDiscoveringRepos(true);
    setDiscoverError('');
    setDiscoverNotice('');
    try {
      const hint = (target === 'create' ? githubRepo : editRepo).trim();
      const userHint = hint.includes('/') ? hint.split('/')[0].trim() : hint;
      const res = await api.discoverGitHubRepos(userHint || undefined);
      const list = res.repos || [];
      setDiscoveredRepos(list);
      if (list.length === 0) {
        setDiscoverError(
          userHint
            ? `No public repositories found for user '${userHint}'.`
            : 'No repositories found. Add a GitHub Token in Settings & SDK to load private repos.'
        );
      } else if (res.source === 'public') {
        setDiscoverNotice(`Loaded ${list.length} public repos for '${userHint || 'user'}'. (Add GitHub Token in Settings for private repos & auto-PR).`);
      } else {
        setDiscoverNotice(`Loaded ${list.length} repositories from your GitHub account.`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Chaos Simulator')) {
        setDiscoverError(
          'ReproLens Chrome Extension Chaos Mode is currently ON in your browser! Please open the ReproLens extension popup and toggle OFF "Simulate API 500 Drop", or type your repo name manually below.'
        );
      } else {
        setDiscoverError(err.message || 'Add a GitHub Token in Settings or enter your GitHub username.');
      }
    } finally {
      setIsDiscoveringRepos(false);
    }
  };

  const applyDiscoveredRepo = (fullName: string, target: 'create' | 'edit') => {
    const match = discoveredRepos.find((r) => r.full_name === fullName);
    if (!match) return;
    if (target === 'create') {
      setGithubRepo(match.full_name);
      setGithubBranch(match.default_branch || 'main');
      if (!name.trim()) setName(match.name);
      if (!url.trim() && match.homepage) setUrl(match.homepage);
    } else {
      setEditRepo(match.full_name);
      setEditBranch(match.default_branch || 'main');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    try {
      await api.createProject({
        name,
        website_url: url,
        redaction_config: {
          mask_all_inputs: true,
          filter_query_params: true,
          custom_keywords: ['secret', 'cvv', 'token'],
          project_mode: projectMode,
          github_repo: projectMode === 'own_repo' ? githubRepo.trim() : '',
          github_branch: githubBranch.trim() || 'main',
        },
      });
      setName('');
      setUrl('');
      setGithubRepo('');
      setGithubBranch('main');
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  const openEditor = (project: Project) => {
    const cfg = project.redaction_config || {};
    const inferredMode = cfg.project_mode || (cfg.github_repo ? 'own_repo' : 'external_monitor');
    setEditingId(project.id);
    setEditMode(inferredMode);
    setEditRepo(cfg.github_repo || '');
    setEditBranch(cfg.github_branch || 'main');
  };

  const handleSaveProjectRepo = async (projectId: string) => {
    setSavingId(projectId);
    try {
      await api.updateProject(projectId, {
        project_mode: editMode,
        github_repo: editMode === 'own_repo' ? editRepo.trim() : '',
        github_branch: editBranch.trim() || 'main',
      });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update project: ${err.message}`);
    } finally {
      setSavingId(null);
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
          <h1 className="text-3xl font-light text-[#111] tracking-tight">Connected Projects</h1>
          <p className="text-xs text-black/55 mt-1 font-mono">
            Manage instrumented web applications, ingestion API keys, and autonomous telemetry rules
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition font-mono tracking-wider cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>NEW PROJECT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const cfg = project.redaction_config || {};
          const isOwnRepo = cfg.project_mode === 'own_repo' || Boolean(cfg.github_repo);
          const isEditing = editingId === project.id;

          return (
            <div
              key={project.id}
              className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 hover:shadow-lg transition text-[#111]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[#111]">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#111]">{project.name}</h3>
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-black/50 hover:text-black flex items-center space-x-1 mt-0.5"
                    >
                      <span>{project.website_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-black/40 hover:text-red-600 p-1.5 rounded-lg transition"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                {isOwnRepo ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <GitBranch className="w-3 h-3" />
                    Own Repo: {cfg.github_repo || 'Ready for PR'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                    <Globe className="w-3 h-3" />
                    External Monitor (Investigate Only)
                  </span>
                )}
                <button
                  onClick={() => (isEditing ? setEditingId(null) : openEditor(project))}
                  className="text-[10px] font-mono uppercase tracking-wider font-bold text-black/60 hover:text-[#111] underline"
                >
                  {isEditing ? 'Cancel' : 'Configure'}
                </button>
              </div>

              {isEditing && (
                <div className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/[0.08] space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditMode('own_repo')}
                      className={`py-1.5 px-2 rounded-xl font-mono text-[10px] font-bold border transition ${
                        editMode === 'own_repo'
                          ? 'bg-[#111] text-white border-[#111]'
                          : 'bg-white text-black/60 border-black/10'
                      }`}
                    >
                      Own Project (GitHub PR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode('external_monitor')}
                      className={`py-1.5 px-2 rounded-xl font-mono text-[10px] font-bold border transition ${
                        editMode === 'external_monitor'
                          ? 'bg-[#111] text-white border-[#111]'
                          : 'bg-white text-black/60 border-black/10'
                      }`}
                    >
                      External App Monitor
                    </button>
                  </div>
                  {editMode === 'own_repo' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDiscoverRepos('edit')}
                          disabled={isDiscoveringRepos}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{isDiscoveringRepos ? 'Loading Repos...' : 'Pick from My GitHub'}</span>
                        </button>
                        {discoveredRepos.length > 0 && (
                          <select
                            value={editRepo}
                            onChange={(e) => applyDiscoveredRepo(e.target.value, 'edit')}
                            className="max-w-[170px] bg-white border border-black/15 rounded-lg px-2 py-1 text-[10px] font-mono"
                          >
                            <option value="">-- Select repo --</option>
                            {discoveredRepos.map((repo) => (
                              <option key={repo.full_name} value={repo.full_name}>
                                {repo.full_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {discoverError && <p className="text-[10px] text-rose-600 font-mono">{discoverError}</p>}
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          value={editRepo}
                          onChange={(e) => setEditRepo(e.target.value)}
                          placeholder="owner/repo"
                          className="col-span-2 bg-white border border-black/15 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-[#111]"
                        />
                        <input
                          type="text"
                          value={editBranch}
                          onChange={(e) => setEditBranch(e.target.value)}
                          placeholder="main"
                          className="bg-white border border-black/15 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-[#111]"
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={savingId === project.id}
                    onClick={() => handleSaveProjectRepo(project.id)}
                    className="w-full py-2 rounded-xl bg-[#111] hover:bg-black text-white font-mono text-[11px] font-bold uppercase tracking-wider transition"
                  >
                    {savingId === project.id ? 'Saving...' : 'Save Mode & Repo'}
                  </button>
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest font-mono">API Key</span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs font-mono text-black/80">
                  <span className="truncate mr-2 font-mono">{project.api_key}</span>
                  <button
                    onClick={() => handleCopy(project.api_key)}
                    className="text-black/50 hover:text-black transition"
                    title="Copy Key"
                  >
                    {copiedKey === project.api_key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-black/50 pt-2 font-mono">
                <span>Telemetry:</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  Listening Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-black/50 pt-1 font-mono border-t border-black/[0.04]">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto-Heal:</span>
                </span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const current = (project.redaction_config || {}).auto_heal_enabled;
                    await api.toggleProjectAutoHeal(project.id, !current);
                    onRefresh();
                  }}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition ${
                    (project.redaction_config || {}).auto_heal_enabled
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-black/5 text-black/50 hover:bg-black/10'
                  }`}
                  title="Toggle Autonomous Self-Healing on error capture"
                >
                  {(project.redaction_config || {}).auto_heal_enabled ? 'AUTO-HEAL ON' : 'AUTO-HEAL OFF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-black/[0.1] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#111]">
            <h2 className="text-lg font-bold text-[#111]">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production Web App"
                  className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] focus:outline-none focus:border-black font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">Website URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://arun-m-portfolio.vercel.app"
                  className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5 font-mono">Project Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectMode('own_repo')}
                    className={`py-2 px-3 rounded-xl text-[11px] font-mono font-bold border transition ${
                      projectMode === 'own_repo'
                        ? 'bg-[#111] text-white border-[#111]'
                        : 'bg-[#F5F4F0] text-black/65 border-black/10'
                    }`}
                  >
                    Own Project (Resolve & PR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectMode('external_monitor')}
                    className={`py-2 px-3 rounded-xl text-[11px] font-mono font-bold border transition ${
                      projectMode === 'external_monitor'
                        ? 'bg-[#F5F4F0] text-black/65 border-black/10'
                        : 'bg-[#F5F4F0] text-black/65 border-black/10'
                    }`}
                  >
                    External App (Investigate)
                  </button>
                </div>
              </div>

              {projectMode === 'own_repo' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleDiscoverRepos('create')}
                      disabled={isDiscoveringRepos}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-mono font-bold transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isDiscoveringRepos ? 'Loading Repos...' : 'Load My GitHub Repos'}</span>
                    </button>
                    {discoveredRepos.length > 0 && (
                      <select
                        value={githubRepo}
                        onChange={(e) => applyDiscoveredRepo(e.target.value, 'create')}
                        className="flex-1 bg-[#F5F4F0] border border-black/15 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-[#111]"
                      >
                        <option value="">-- Pick repo to auto-fill --</option>
                        {discoveredRepos.map((repo) => (
                          <option key={repo.full_name} value={repo.full_name}>
                            {repo.full_name}{repo.homepage ? ` (${repo.homepage})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {discoverNotice && (
                    <p className="text-[11px] text-emerald-700 font-mono font-medium bg-emerald-50 border border-emerald-200/80 rounded-xl px-2.5 py-1.5">
                      {discoverNotice}
                    </p>
                  )}
                  {discoverError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono space-y-1">
                      <p className="font-semibold">{discoverError}</p>
                      <p className="text-[10px] text-rose-700/90 leading-relaxed">
                        Tip: You can type your repo name manually below (e.g. <b>Arun597134/Arun-M-portfolio-</b>).
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">GitHub Repo</label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="owner/repo"
                        className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] focus:outline-none focus:border-black font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">Branch</label>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] focus:outline-none focus:border-black font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black/60 hover:text-black font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl shadow font-mono tracking-wider uppercase transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
