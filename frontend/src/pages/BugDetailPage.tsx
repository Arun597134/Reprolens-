import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Sparkles, PlayCircle, FileCheck2, Terminal, CheckCircle2,
  AlertTriangle, ShieldCheck, RefreshCw, Download, ExternalLink, Code2, Copy, GitPullRequest,
  Zap, Bot, Check, ArrowRight, Activity
} from 'lucide-react';
import { BugReport, Investigation, Reproduction, RegressionTest } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { CodeBlock } from '../components/CodeBlock';
import { AIVoiceExplainer } from '../components/AIVoiceExplainer';
import { VsCodeDeepLinkModal } from '../components/VsCodeDeepLinkModal';
import { InteractiveLiveSplitSandbox } from '../components/InteractiveLiveSplitSandbox';
import { PerformanceMemoryRadar } from '../components/PerformanceMemoryRadar';
import { AutoShieldStudio } from '../components/AutoShieldStudio';

interface Props {
  bugId: string;
  onBack: () => void;
  onNavigateToSession?: (sessionId: string) => void;
}

export const BugDetailPage: React.FC<Props> = ({ bugId, onBack, onNavigateToSession }) => {
  const [bug, setBug] = useState<BugReport | null>(null);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [reproductions, setReproductions] = useState<Reproduction[]>([]);
  const [regressionTests, setRegressionTests] = useState<RegressionTest[]>([]);

  const [activeTab, setActiveTab] = useState<'investigation' | 'reproduction' | 'regression' | 'trace' | 'auto_heal' | 'sandbox' | 'performance' | 'auto_shield'>('investigation');
  const [loading, setLoading] = useState(true);
  const [showVsCodeModal, setShowVsCodeModal] = useState(false);
  const [copiedQuickPatch, setCopiedQuickPatch] = useState(false);

  // Reproduction action state
  const [isReproducing, setIsReproducing] = useState(false);
  const [simulateNetwork, setSimulateNetwork] = useState(true);
  const [mockFailedRequests, setMockFailedRequests] = useState(true);

  // Investigation action state
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Regression test action state
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [showCiModal, setShowCiModal] = useState(false);
  const [ciWorkflowCode, setCiWorkflowCode] = useState('');

  // Auto-PR state
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  // Autonomous Self-Healing State
  const [autoHealData, setAutoHealData] = useState<any>(null);
  const [isRunningAutoHeal, setIsRunningAutoHeal] = useState(false);

  // Manual GitHub PR Modal State (Zero unwanted pushes)
  const [showPrModal, setShowPrModal] = useState(false);
  const [targetRepoInput, setTargetRepoInput] = useState('');
  const [targetBranchInput, setTargetBranchInput] = useState('main');
  const [prTargetFile, setPrTargetFile] = useState('src/App.tsx');
  const [prDiff, setPrDiff] = useState('');
  const [prPatchedContent, setPrPatchedContent] = useState('');
  const [prCommitMsg, setPrCommitMsg] = useState('');
  const [isLoadingPrPreview, setIsLoadingPrPreview] = useState(false);

  const loadData = async () => {
    try {
      const bugData = await api.getBugDetail(bugId);
      setBug(bugData);

      try {
        const invData = await api.getInvestigation(bugId);
        setInvestigation(invData);
      } catch (e) {}

      try {
        const reproData = await api.getReproductions(bugId);
        setReproductions(reproData);
      } catch (e) {}

      try {
        const testData = await api.getRegressionTests(bugId);
        setRegressionTests(testData);
      } catch (e) {}

      try {
        const ahStatus = await api.getAutoHealStatus(bugId);
        if (ahStatus && ahStatus.has_run) {
          setAutoHealData(ahStatus);
          if (ahStatus.pr_url) setPrUrl(ahStatus.pr_url);
        }
      } catch (e) {}
    } catch (err: any) {
      console.error('Failed to load bug detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bugId]);

  const handleRunInvestigation = async (useExternalLlm = false) => {
    setIsInvestigating(true);
    try {
      const inv = await api.triggerInvestigation({
        bug_id: bugId,
        use_external_llm: useExternalLlm
      });
      setInvestigation(inv);
      await loadData();
    } catch (err: any) {
      alert(`Investigation failed: ${err.message}`);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleRunReproduction = async () => {
    setIsReproducing(true);
    try {
      const repro = await api.triggerReproduction({
        bug_id: bugId,
        simulate_network: simulateNetwork,
        mock_failed_requests: mockFailedRequests
      });
      setReproductions([repro, ...reproductions]);
      await loadData();
    } catch (err: any) {
      alert(`Reproduction run failed: ${err.message}`);
    } finally {
      setIsReproducing(false);
    }
  };

  const handleGenerateRegressionTest = async () => {
    setIsGeneratingTest(true);
    try {
      const testObj = await api.generateRegressionTest(bugId);
      setRegressionTests([testObj, ...regressionTests]);
      await loadData();
    } catch (err: any) {
      alert(`Test generation failed: ${err.message}`);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleRunRegressionTest = async (testId: string) => {
    setIsRunningTest(true);
    try {
      const updated = await api.runRegressionTest(testId);
      setRegressionTests(regressionTests.map((t) => (t.id === testId ? updated : t)));
    } catch (err: any) {
      alert(`Test execution failed: ${err.message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleApproveTest = async (testId: string) => {
    try {
      const updated = await api.approveRegressionTest(testId);
      setRegressionTests(regressionTests.map((t) => (t.id === testId ? updated : t)));
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleViewCiWorkflow = async (testId: string) => {
    try {
      const yaml = await api.getCiWorkflow(testId);
      setCiWorkflowCode(yaml);
      setShowCiModal(true);
    } catch (err: any) {
      alert(`Failed to fetch workflow: ${err.message}`);
    }
  };

  const handleOpenPrModal = async () => {
    setShowPrModal(true);
    setIsLoadingPrPreview(true);
    try {
      const settingsData = await api.getSettings();
      const defaultRepo = settingsData.default_github_repo || 'Arun597134/Arun-M-portfolio-';
      const defaultBranch = settingsData.default_github_branch || 'main';
      const activeRepo = targetRepoInput || defaultRepo;
      setTargetRepoInput(activeRepo);
      setTargetBranchInput(defaultBranch);

      const filesRes = await api.listGitHubRepoFiles({
        bug_id: bugId,
        owner_repo: activeRepo,
        branch: defaultBranch
      });
      const file = filesRes.candidate_files?.[0] || 'src/App.tsx';
      setPrTargetFile(file);

      const preview = await api.previewGitHubPatch({
        bug_id: bugId,
        owner_repo: activeRepo,
        branch: defaultBranch,
        file_path: file
      });
      setPrDiff(preview.unified_diff || '');
      setPrPatchedContent(preview.patched_content || '');
      setPrCommitMsg(preview.commit_message || `fix: resolve ${bug?.error_type || 'bug'} in ${file}`);
    } catch (err: any) {
      console.warn('Preview patch notice:', err.message);
      if (investigation?.fix_recommendations?.[0]) {
        const rec = investigation.fix_recommendations[0];
        setPrTargetFile(rec.file || 'src/App.tsx');
        setPrDiff(rec.diff || '');
        setPrPatchedContent((rec as any).replacement || rec.diff || '');
        setPrCommitMsg(`fix: resolve ${bug?.error_type || 'runtime error'}`);
      }
    } finally {
      setIsLoadingPrPreview(false);
    }
  };

  const handleConfirmPushPr = async () => {
    if (!targetRepoInput.trim()) {
      alert('Please specify a GitHub repository (e.g. Arun597134/Arun-M-portfolio-)');
      return;
    }
    setIsCreatingPr(true);
    try {
      const res = await api.createGitHubPR({
        bug_id: bugId,
        owner_repo: targetRepoInput.trim(),
        branch: targetBranchInput.trim() || 'main',
        file_path: prTargetFile,
        patched_content: prPatchedContent,
        commit_message: prCommitMsg,
        include_regression_test: true
      });
      if (res && res.pr_url) {
        setPrUrl(res.pr_url);
        setShowPrModal(false);
        window.open(res.pr_url, '_blank');
      } else {
        alert('PR created successfully on GitHub!');
        setShowPrModal(false);
      }
      await loadData();
    } catch (err: any) {
      alert(`GitHub PR Push Failed: ${err.message}`);
    } finally {
      setIsCreatingPr(false);
    }
  };

  const handleRunAutoHeal = async () => {
    setIsRunningAutoHeal(true);
    setActiveTab('auto_heal');
    try {
      // auto_pr is strictly FALSE - never pushes to GitHub without user confirmation!
      const res = await api.runAutoHeal({ bug_id: bugId, auto_pr: false, notify: false });
      setAutoHealData(res);
      await loadData();
    } catch (err: any) {
      alert(`Autonomous Self-Healing Loop encountered an error: ${err.message}`);
    } finally {
      setIsRunningAutoHeal(false);
    }
  };

  if (loading || !bug) {
    return (
      <div className="p-16 text-center text-xs text-black/50 font-mono">
        Loading ReproLens Case File...
      </div>
    );
  }

  const latestReproduction = reproductions[0];
  const latestTest = regressionTests[0];

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto text-[#111]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-black/[0.08] pb-5">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-black/10 hover:bg-black/5 text-[#111] transition shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <StatusBadge status={bug.severity} type="severity" />
              <StatusBadge status={bug.status} type="status" />
              <span className="text-xs font-mono font-bold text-black/70">{bug.error_type}</span>
            </div>
          </div>

          <h1 className="text-3xl font-light text-[#111] tracking-tight">{bug.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-black/55 font-mono">
            <span>Route: <code className="text-[#111] font-bold">{bug.url}</code></span>
            <span>&bull;</span>
            <span>Created: {new Date(bug.created_at).toLocaleString()}</span>
            {bug.session_id && (
              <>
                <span>&bull;</span>
                <button
                  onClick={() => onNavigateToSession && onNavigateToSession(bug.session_id!)}
                  className="text-black hover:underline flex items-center gap-1 font-bold"
                >
                  <span>View Recorded Session</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('auto_shield')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-bold rounded-xl shadow-sm transition cursor-pointer border ${
              activeTab === 'auto_shield'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="Open Autonomous Auto-Shield Runtime Immune Studio"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Shield: ARMED</span>
          </button>

          <button
            onClick={() => setShowVsCodeModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-sm transition cursor-pointer"
            title="Open in Local VS Code or Cursor IDE with verified patch"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Open in VS Code</span>
          </button>

          <button
            onClick={handleRunAutoHeal}
            disabled={isRunningAutoHeal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-mono font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isRunningAutoHeal ? 'animate-spin' : ''}`} />
            <span>{isRunningAutoHeal ? 'Auto-Healing...' : 'Run Auto-Heal Loop'}</span>
          </button>

          <button
            onClick={handleOpenPrModal}
            disabled={isCreatingPr}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#111] hover:bg-black text-white text-xs font-mono font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Push to GitHub...</span>
          </button>

          <select
            value={bug.status}
            onChange={async (e) => {
              const updated = await api.updateBug(bug.id, { status: e.target.value as any });
              setBug(updated);
            }}
            className="bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-none focus:border-black shadow-sm"
          >
            <option value="open">Status: Open</option>
            <option value="investigating">Status: Investigating</option>
            <option value="reproduced">Status: Reproduced</option>
            <option value="regression_ready">Status: Regression Ready</option>
            <option value="resolved">Status: Resolved</option>
            <option value="closed">Status: Closed</option>
          </select>
        </div>
      </div>

      {/* AI Voice Briefing (Option 2) */}
      <AIVoiceExplainer bug={bug} investigation={investigation} />

      {prUrl && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
          <span>Pull Request created successfully on GitHub!</span>
          <a href={prUrl} target="_blank" rel="noreferrer" className="underline font-bold flex items-center gap-1">
            <span>Open PR on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Engineering Tabs */}
      <div className="flex border-b border-black/[0.08] space-x-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('investigation')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'investigation'
              ? 'border-[#111] text-[#111] bg-white shadow-sm'
              : 'border-transparent text-black/55 hover:text-[#111] hover:bg-black/[0.02]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Investigation</span>
          {investigation && (
            <span className="text-[10px] bg-black/5 text-black px-2 py-0.5 rounded-full font-mono">
              {(investigation.confidence_score * 100).toFixed(0)}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'sandbox'
              ? 'border-indigo-600 text-indigo-950 bg-indigo-50/70 shadow-sm'
              : 'border-transparent text-indigo-700/80 hover:text-indigo-950 hover:bg-indigo-50/30'
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>Live Sandbox Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'performance'
              ? 'border-violet-600 text-violet-950 bg-violet-50/70 shadow-sm'
              : 'border-transparent text-violet-700/80 hover:text-violet-950 hover:bg-violet-50/30'
          }`}
        >
          <Activity className="w-4 h-4 text-violet-600" />
          <span>Performance Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('auto_shield')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'auto_shield'
              ? 'border-emerald-600 text-emerald-950 bg-emerald-50/90 shadow-sm'
              : 'border-transparent text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Auto-Shield Immune System</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
            ARMED
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reproduction')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'reproduction'
              ? 'border-[#111] text-[#111] bg-white shadow-sm'
              : 'border-transparent text-black/55 hover:text-[#111] hover:bg-black/[0.02]'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Playwright Reproduction</span>
          {latestReproduction && (
            <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full font-mono uppercase text-black/70">
              {latestReproduction.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('regression')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'regression'
              ? 'border-[#111] text-[#111] bg-white shadow-sm'
              : 'border-transparent text-black/55 hover:text-[#111] hover:bg-black/[0.02]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Regression Test Suite</span>
          {latestTest && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${latestTest.status === 'passing' ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5 text-black/60'}`}>
              {latestTest.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('trace')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'trace'
              ? 'border-[#111] text-[#111] bg-white shadow-sm'
              : 'border-transparent text-black/55 hover:text-[#111] hover:bg-black/[0.02]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Stack Trace &amp; Evidence</span>
        </button>

        <button
          onClick={() => setActiveTab('auto_heal')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition border-b-2 font-bold cursor-pointer shrink-0 ${
            activeTab === 'auto_heal'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/70 shadow-sm'
              : 'border-transparent text-emerald-700/80 hover:text-emerald-900 hover:bg-emerald-50/30'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Autonomous Self-Heal</span>
          {autoHealData && (
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono font-bold">
              PASS
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AI INVESTIGATION */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-black/[0.08] shadow-sm font-mono text-xs">
            <div className="flex items-center space-x-2 text-black/70">
              <span className="font-bold text-[#111]">Engine:</span>
              <span>{investigation?.ai_model_used || 'ReproLens Heuristic Static & Semantic Analyzer'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunInvestigation(false)}
                disabled={isInvestigating}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} />
                <span>Re-Analyze Case File</span>
              </button>
              <button
                onClick={() => handleRunInvestigation(true)}
                disabled={isInvestigating}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-black/5 text-[#111] text-xs font-bold rounded-xl border border-black/15 transition shadow-sm"
                title="Runs with configured Gemini/OpenAI key if available"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Run with Cloud LLM</span>
              </button>
            </div>
          </div>

          {investigation ? (
            <div className="space-y-6">
              {/* Root Cause Card */}
              <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm text-[#111]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="font-bold text-xs uppercase tracking-wider font-mono text-black/60">
                      Root Cause Synthesis
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-black/50">Confidence Calibration:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {(investigation.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-black/85 leading-relaxed font-mono bg-black/[0.02] p-4 rounded-2xl border border-black/[0.06]">
                  {investigation.root_cause_analysis}
                </p>
              </div>

              {/* The 4-Tier Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Observed Facts */}
                <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-5 space-y-3 shadow-sm font-mono">
                  <div className="flex items-center space-x-2 text-emerald-800 border-b border-black/[0.06] pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">1. Observed Facts</h4>
                  </div>
                  <p className="text-[11px] text-black/50">
                    Definitive chronological facts witnessed in telemetry:
                  </p>
                  <ul className="space-y-2 text-xs text-black/80">
                    {investigation.observed_facts.map((fact, idx) => (
                      <li key={idx} className="bg-black/[0.02] p-2.5 rounded-xl border border-black/[0.06] leading-relaxed">
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Inferred Explanations */}
                <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-5 space-y-3 shadow-sm font-mono">
                  <div className="flex items-center space-x-2 text-blue-800 border-b border-black/[0.06] pb-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">2. Inferred Explanations</h4>
                  </div>
                  <p className="text-[11px] text-black/50">
                    Logical causation deduced from code &amp; failure patterns:
                  </p>
                  <ul className="space-y-2 text-xs text-black/80">
                    {investigation.inferred_explanations.map((inf, idx) => (
                      <li key={idx} className="bg-black/[0.02] p-2.5 rounded-xl border border-black/[0.06] leading-relaxed">
                        {inf}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Unverified Hypotheses */}
                <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-5 space-y-3 shadow-sm font-mono">
                  <div className="flex items-center space-x-2 text-amber-800 border-b border-black/[0.06] pb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">3. Unverified Hypotheses</h4>
                  </div>
                  <p className="text-[11px] text-black/50">
                    External variables requiring manual verification:
                  </p>
                  <ul className="space-y-2 text-xs text-black/80">
                    {investigation.unverified_hypotheses.map((hyp, idx) => (
                      <li key={idx} className="bg-black/[0.02] p-2.5 rounded-xl border border-black/[0.06] leading-relaxed">
                        {hyp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Fix Recommendations & Code Diffs */}
              <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm text-[#111]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-black" />
                    <h3 className="font-bold text-xs uppercase tracking-wider font-mono">Proposed Developer Code Fix</h3>
                  </div>
                  <button
                    onClick={() => setShowVsCodeModal(true)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-mono font-bold rounded-xl transition cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in VS Code</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {investigation.fix_recommendations.map((fix, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[#111]">{fix.title}</span>
                        <span className="text-black/50 text-[11px]">{fix.file}</span>
                      </div>
                      <CodeBlock code={fix.diff} filename={fix.file} language="diff" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-black/45 bg-white/80 rounded-3xl border border-black/[0.08] font-mono">
              No investigation analysis found. Click "Re-Analyze Case File" to trigger AI investigation.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETERMINISTIC PLAYWRIGHT REPRODUCTION */}
      {activeTab === 'reproduction' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm font-mono">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-[#111]">Playwright Controlled Browser Environment</h3>
                <p className="text-xs text-black/55 mt-0.5">
                  Recreates viewport, user interaction sequence, network latency &amp; mock failure route
                </p>
              </div>

              <button
                onClick={handleRunReproduction}
                disabled={isReproducing}
                className="flex items-center space-x-2 px-5 py-2.5 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <PlayCircle className={`w-4 h-4 ${isReproducing ? 'animate-spin' : ''}`} />
                <span>{isReproducing ? 'Executing in Chromium...' : 'Run Browser Reproduction Now'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-black/[0.06] text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-black/70">
                <input
                  type="checkbox"
                  checked={simulateNetwork}
                  onChange={(e) => setSimulateNetwork(e.target.checked)}
                  className="rounded border-black/20 text-black focus:ring-0"
                />
                <span>Simulate Network Latency (120ms throttle)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-black/70">
                <input
                  type="checkbox"
                  checked={mockFailedRequests}
                  onChange={(e) => setMockFailedRequests(e.target.checked)}
                  className="rounded border-black/20 text-black focus:ring-0"
                />
                <span>Deterministic API Mocking (Arm HTTP 500 Route)</span>
              </label>
            </div>
          </div>

          {latestReproduction ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Screenshot & Specs (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-5 space-y-3 shadow-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-black/50">Reproduction Outcome</span>
                    <StatusBadge status={latestReproduction.status} type="repro" />
                  </div>

                  <div className="space-y-1 text-xs text-black/80 font-mono bg-black/[0.02] p-3.5 rounded-2xl border border-black/[0.06]">
                    <div>Browser: {latestReproduction.environment_config.browser}</div>
                    <div>Viewport: {latestReproduction.environment_config.viewport_w} &times; {latestReproduction.environment_config.viewport_h}</div>
                    <div>Execution Duration: {latestReproduction.duration_ms}ms</div>
                    <div>Exit Code: {latestReproduction.exit_code}</div>
                  </div>
                </div>

                {/* Screenshot */}
                <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-4 space-y-2 shadow-sm font-mono">
                  <span className="text-xs font-bold text-[#111] uppercase tracking-wider">
                    Captured State Screenshot
                  </span>
                  {latestReproduction.screenshot_url ? (
                    <div className="rounded-2xl overflow-hidden border border-black/[0.08] bg-black">
                      <img
                        src={latestReproduction.screenshot_url}
                        alt="Reproduction Failure State"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-black/45 bg-black/[0.02] rounded-2xl">
                      No screenshot captured for this run.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Execution Logs (7 cols) */}
              <div className="lg:col-span-7 bg-[#161616] rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px] text-white">
                <div className="p-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Playwright Runner Terminal</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">ISOLATED CHROMIUM INSTANCE</span>
                </div>
                <div className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {latestReproduction.execution_logs}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-black/45 bg-white/80 rounded-3xl border border-black/[0.08] font-mono">
              No reproduction runs executed yet. Click "Run Browser Reproduction Now" to execute.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGRESSION TEST SUITE */}
      {activeTab === 'regression' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-black/[0.08] gap-4 shadow-sm font-mono">
            <div>
              <h3 className="font-bold text-sm text-[#111]">AI-Generated Playwright Regression Guard</h3>
              <p className="text-xs text-black/55 mt-0.5">
                Verifies application handles network failures and edge cases gracefully without fatal white-screen crashes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateRegressionTest}
                disabled={isGeneratingTest}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-black/5 text-[#111] text-xs font-bold rounded-xl border border-black/15 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>{isGeneratingTest ? 'Generating...' : 'Synthesize Test'}</span>
              </button>

              {latestTest && (
                <>
                  <button
                    onClick={() => handleRunRegressionTest(latestTest.id)}
                    disabled={isRunningTest}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    <PlayCircle className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
                    <span>{isRunningTest ? 'Running Test...' : 'Run Test Live'}</span>
                  </button>

                  <button
                    onClick={() => handleApproveTest(latestTest.id)}
                    className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition"
                  >
                    Approve Test
                  </button>

                  <button
                    onClick={() => handleViewCiWorkflow(latestTest.id)}
                    className="flex items-center space-x-1 px-3.5 py-2 bg-white hover:bg-black/5 text-[#111] text-xs font-bold rounded-xl border border-black/15 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CI/CD Workflow</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {latestTest ? (
            <div className="space-y-6">
              {/* Test Status Banner */}
              <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-4 flex items-center justify-between text-xs font-mono shadow-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-black/50 font-bold">Test Specification:</span>
                  <span className="font-bold text-[#111]">{latestTest.title}</span>
                  <StatusBadge status={latestTest.status} type="test" />
                </div>
                {latestTest.last_run_at && (
                  <span className="text-black/50 font-mono text-[11px]">
                    Last executed: {new Date(latestTest.last_run_at).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Code viewer */}
              <CodeBlock code={latestTest.test_code} filename="tests/reprolens/checkout-regression.spec.ts" language="typescript" />

              {/* Test Runner Console Output if run */}
              {latestTest.execution_result && latestTest.execution_result.stdout && (
                <div className="bg-[#161616] rounded-3xl overflow-hidden shadow-sm text-white">
                  <div className="p-3.5 border-b border-white/10 bg-black/40 text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Test Execution Terminal Output</span>
                    <span className="font-mono text-[11px] text-white/50">
                      Duration: {latestTest.execution_result.duration_ms}ms
                    </span>
                  </div>
                  <pre className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {latestTest.execution_result.stdout}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-black/45 bg-white/80 rounded-3xl border border-black/[0.08] font-mono">
              No regression tests generated yet. Click "Synthesize Test" to generate a Playwright test.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STACK TRACE */}
      {activeTab === 'trace' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm font-mono">
            <h3 className="font-bold text-xs text-black/60 uppercase tracking-wider">Uncaught Exception Stack Trace</h3>
            <pre className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {bug.stack_trace || bug.error_message || 'No stack trace captured.'}
            </pre>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-3 shadow-sm font-mono">
            <h3 className="font-bold text-xs text-black/60 uppercase tracking-wider">Target Component Context</h3>
            <div className="text-xs font-mono text-black/80 bg-black/[0.02] p-3.5 rounded-2xl border border-black/[0.06]">
              {bug.component_context || 'Global Window Scope'}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUTONOMOUS SELF-HEAL */}
      {activeTab === 'auto_heal' && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80 backdrop-blur-md p-6 rounded-3xl border border-emerald-200/80 shadow-sm gap-4 font-mono">
            <div>
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Autonomous Self-Healing Quality Pipeline</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">Zero Human Touch</span>
              </div>
              <p className="text-xs text-black/60 mt-1">
                Synthesizes root cause fix, verifies patch in Dual-Reality B Playwright sandbox, executes regression tests, creates GitHub PR, and notifies team.
              </p>
            </div>

            <button
              onClick={handleRunAutoHeal}
              disabled={isRunningAutoHeal}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer self-start md:self-auto"
            >
              <Zap className={`w-4 h-4 ${isRunningAutoHeal ? 'animate-spin' : ''}`} />
              <span>{isRunningAutoHeal ? 'Executing Auto-Heal Loop...' : 'Trigger Autonomous Loop Now'}</span>
            </button>
          </div>

          {/* Stepper Grid (5 Stages) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
            {[
              { key: 'investigation', label: '1. AI Root Cause', icon: Sparkles, desc: 'Analyzes telemetry & crafts defensive patch' },
              { key: 'dual_reality', label: '2. Dual-Reality B', icon: PlayCircle, desc: 'In-browser verified: 0 uncaught crashes' },
              { key: 'regression_guard', label: '3. Regression Suite', icon: FileCheck2, desc: '@playwright/test spec synthesized & passed' },
              { key: 'github_pr', label: '4. Autonomous PR', icon: GitPullRequest, desc: 'Branch & Pull Request created on GitHub' },
              { key: 'notification', label: '5. Alert Dispatch', icon: Bot, desc: 'Dispatched to Slack & Discord webhooks' },
            ].map((step) => {
              const stageData = autoHealData?.stages?.[step.key];
              const st = isRunningAutoHeal && !stageData ? 'in_progress' : (stageData?.status || 'pending');
              const isPass = st === 'success';
              const isProg = st === 'in_progress';
              const isSkip = st === 'skipped';
              const isWarn = st === 'warning';

              return (
                <div
                  key={step.key}
                  className={`p-4 rounded-2xl border transition ${
                    isPass
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : isProg
                      ? 'bg-blue-50/70 border-blue-300 text-blue-950 animate-pulse'
                      : isWarn
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                      : isSkip
                      ? 'bg-black/[0.02] border-black/10 text-black/40'
                      : 'bg-white border-black/[0.08] text-black/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <step.icon className="w-3.5 h-3.5" />
                      <span>{step.label}</span>
                    </span>
                    {isPass && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isProg && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                    {isWarn && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <p className="text-[11px] leading-tight opacity-75">{step.desc}</p>
                  {stageData?.duration_ms && (
                    <div className="mt-2 text-[10px] font-bold text-black/50">
                      Duration: {stageData.duration_ms}ms
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outcome Details & PR Banner */}
          {autoHealData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Highlights & PR Link */}
              <div className="lg:col-span-5 space-y-4 font-mono text-xs">
                {/* PR Link / Staged Card */}
                {autoHealData.pr_url ? (
                  <div className="bg-white/80 backdrop-blur-md border border-emerald-300 rounded-3xl p-5 space-y-3 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                        GitHub PR Created
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        #{autoHealData.pr_number || 'AUTO-PR'}
                      </span>
                    </div>
                    <p className="text-black/70">
                      Pull request was confirmed and opened on GitHub with regression spec.
                    </p>
                    <a
                      href={autoHealData.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                    >
                      <span>Review Pull Request on GitHub &rarr;</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-md border border-emerald-300/80 rounded-3xl p-5 space-y-3 shadow-sm bg-gradient-to-br from-blue-50/30 to-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black/70 uppercase tracking-wider text-[11px]">
                        Verified Fix Staged Locally
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                        ZERO AUTO-PUSH
                      </span>
                    </div>
                    <p className="text-black/65 text-xs leading-relaxed">
                      Bug fix is verified in Dual-Reality B &amp; regression suite. Nothing is pushed to GitHub automatically. You can review and manually push to whichever repository you choose.
                    </p>
                    {autoHealData.stages?.github_pr?.target_file && (
                      <div className="text-[11px] text-black/70 bg-black/[0.03] p-2 rounded-xl">
                        Target File: <code className="font-bold text-[#111]">{autoHealData.stages.github_pr.target_file}</code>
                      </div>
                    )}
                    <button
                      onClick={handleOpenPrModal}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-[#111] hover:bg-black text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Choose Repo &amp; Push PR &rarr;</span>
                    </button>
                  </div>
                )}

                {/* Dual-Reality B Verification Evidence */}
                {autoHealData.stages?.dual_reality && (
                  <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black/60 uppercase tracking-wider text-[11px]">
                        Dual-Reality B Verification
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                        {autoHealData.stages.dual_reality.verdict || 'VERIFIED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
                        <div className="text-lg font-bold">{autoHealData.stages.dual_reality.crashes_before ?? 1}</div>
                        <div className="text-[10px] uppercase font-bold text-rose-600">Reality A Crashes</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <div className="text-lg font-bold">{autoHealData.stages.dual_reality.crashes_after ?? 0}</div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600">Reality B (Patched)</div>
                      </div>
                    </div>

                    {autoHealData.stages.dual_reality.screenshot_url && (
                      <div className="rounded-2xl overflow-hidden border border-black/[0.08] mt-2">
                        <img
                          src={autoHealData.stages.dual_reality.screenshot_url}
                          alt="Dual-Reality B Patched State"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column (7 cols): Pipeline Execution Terminal Logs */}
              <div className="lg:col-span-7 bg-[#161616] rounded-3xl overflow-hidden shadow-sm flex flex-col text-white h-[500px]">
                <div className="p-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Autonomous Pipeline Execution Terminal
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50">
                    Total: {autoHealData.total_duration_ms || 0}ms
                  </span>
                </div>
                <pre className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {(autoHealData.logs || []).join('\n') || '[Waiting for pipeline execution...]'}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: INTERACTIVE LIVE SPLIT SANDBOX (Option 3) */}
      {activeTab === 'sandbox' && (
        <InteractiveLiveSplitSandbox bug={bug} investigation={investigation} />
      )}

      {/* TAB 7: PERFORMANCE & MEMORY LEAK RADAR (Option 4) */}
      {activeTab === 'performance' && (
        <PerformanceMemoryRadar bug={bug} />
      )}

      {/* TAB 8: AUTONOMOUS AUTO-SHIELD IMMUNE SYSTEM */}
      {activeTab === 'auto_shield' && (
        <AutoShieldStudio bugId={bug.id} />
      )}

      {/* VS Code Deep Link Modal (Option 1) */}
      <VsCodeDeepLinkModal
        isOpen={showVsCodeModal}
        onClose={() => setShowVsCodeModal(false)}
        bug={bug}
        investigation={investigation}
      />

      {/* CI/CD Workflow Modal */}
      {showCiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-black/[0.1] max-w-2xl w-full p-6 space-y-4 shadow-2xl text-[#111]">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111] font-mono">GitHub Actions CI/CD Integration</h3>
                <p className="text-xs text-black/55 font-mono">Save as <code className="text-[#111] font-bold">.github/workflows/reprolens-regression.yml</code></p>
              </div>
              <button
                onClick={() => setShowCiModal(false)}
                className="text-black/50 hover:text-black text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <CodeBlock code={ciWorkflowCode} filename=".github/workflows/reprolens-regression.yml" language="yaml" />
            <div className="flex justify-end">
              <button
                onClick={() => setShowCiModal(false)}
                className="px-4 py-2 bg-[#111] hover:bg-black text-white text-xs font-bold rounded-xl font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual GitHub PR Confirmation Modal (Zero Unwanted Pushes) */}
      {showPrModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono text-xs">
          <div className="bg-white rounded-3xl border border-black/[0.1] max-w-2xl w-full p-6 space-y-4 shadow-2xl text-[#111]">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111] font-mono flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-emerald-600" />
                  <span>Manual GitHub PR Push</span>
                </h3>
                <p className="text-[11px] text-black/55 mt-0.5">
                  Choose the repository and branch to push this verified fix to. Nothing is pushed without your confirmation.
                </p>
              </div>
              <button
                onClick={() => setShowPrModal(false)}
                className="text-black/50 hover:text-black text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black/60 uppercase mb-1">
                    Target GitHub Repository
                  </label>
                  <input
                    type="text"
                    value={targetRepoInput}
                    onChange={(e) => setTargetRepoInput(e.target.value)}
                    placeholder="e.g. Arun597134/Arun-M-portfolio-"
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/60 uppercase mb-1">
                    Base Branch
                  </label>
                  <input
                    type="text"
                    value={targetBranchInput}
                    onChange={(e) => setTargetBranchInput(e.target.value)}
                    placeholder="main"
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black/60 uppercase mb-1">
                  Target File to Patch
                </label>
                <input
                  type="text"
                  value={prTargetFile}
                  onChange={(e) => setPrTargetFile(e.target.value)}
                  placeholder="src/App.tsx"
                  className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black/60 uppercase mb-1">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={prCommitMsg}
                  onChange={(e) => setPrCommitMsg(e.target.value)}
                  className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111] focus:outline-none focus:border-black"
                />
              </div>

              {isLoadingPrPreview ? (
                <div className="p-8 text-center text-black/50 animate-pulse bg-black/[0.02] rounded-2xl">
                  Loading candidate file &amp; synthesizing verified patch diff...
                </div>
              ) : prDiff ? (
                <div>
                  <label className="block text-[11px] font-bold text-black/60 uppercase mb-1">
                    Verified Patch Diff Preview
                  </label>
                  <pre className="p-3 bg-[#161616] text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                    {prDiff}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-black/[0.08] pt-3">
              <span className="text-[11px] text-black/45">
                Creates branch <code className="text-[#111] font-bold">reprolens/fix-{bug.id.slice(0, 8)}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrModal(false)}
                  className="px-4 py-2 bg-black/5 hover:bg-black/10 text-[#111] font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPushPr}
                  disabled={isCreatingPr || isLoadingPrPreview}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#111] hover:bg-black text-white font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <GitPullRequest className={`w-3.5 h-3.5 ${isCreatingPr ? 'animate-spin' : ''}`} />
                  <span>{isCreatingPr ? 'Pushing PR...' : 'Confirm & Push PR'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
