import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Sparkles, PlayCircle, FileCheck2, Terminal, CheckCircle2,
  AlertTriangle, ShieldCheck, RefreshCw, Download, ExternalLink, Code2, Copy
} from 'lucide-react';
import { BugReport, Investigation, Reproduction, RegressionTest } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { CodeBlock } from '../components/CodeBlock';

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

  const [activeTab, setActiveTab] = useState<'investigation' | 'reproduction' | 'regression' | 'trace'>('investigation');
  const [loading, setLoading] = useState(true);

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

  if (loading || !bug) {
    return (
      <div className="p-16 text-center text-xs text-slate-400">
        Loading ReproLens Case File...
      </div>
    );
  }

  const latestReproduction = reproductions[0];
  const latestTest = regressionTests[0];

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <StatusBadge status={bug.severity} type="severity" />
              <StatusBadge status={bug.status} type="status" />
              <span className="text-xs font-mono text-brand-400 font-semibold">{bug.error_type}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">{bug.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Route: <code className="text-slate-300">{bug.url}</code></span>
            <span>&bull;</span>
            <span>Created: {new Date(bug.created_at).toLocaleString()}</span>
            {bug.session_id && (
              <>
                <span>&bull;</span>
                <button
                  onClick={() => onNavigateToSession && onNavigateToSession(bug.session_id!)}
                  className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View Recorded Session</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="flex items-center gap-2">
          <select
            value={bug.status}
            onChange={async (e) => {
              const updated = await api.updateBug(bug.id, { status: e.target.value as any });
              setBug(updated);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500"
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

      {/* Engineering Tabs */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab('investigation')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === 'investigation'
              ? 'border-brand-500 text-brand-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Investigation</span>
          {investigation && (
            <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.2 rounded font-mono">
              {(investigation.confidence_score * 100).toFixed(0)}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reproduction')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === 'reproduction'
              ? 'border-brand-500 text-brand-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Playwright Reproduction</span>
          {latestReproduction && (
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono uppercase text-slate-300">
              {latestReproduction.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('regression')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === 'regression'
              ? 'border-brand-500 text-brand-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Regression Test Suite</span>
          {latestTest && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${latestTest.status === 'passing' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              {latestTest.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('trace')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === 'trace'
              ? 'border-brand-500 text-brand-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Stack Trace & Raw Evidence</span>
        </button>
      </div>

      {/* TAB 1: AI INVESTIGATION */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <span className="text-brand-400 font-semibold">Engine:</span>
              <span>{investigation?.ai_model_used || 'ReproLens Heuristic Static & Semantic Analyzer'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunInvestigation(false)}
                disabled={isInvestigating}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} />
                <span>Re-Analyze Case File</span>
              </button>
              <button
                onClick={() => handleRunInvestigation(true)}
                disabled={isInvestigating}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                title="Runs with configured Gemini/OpenAI key if available"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Run with LLM</span>
              </button>
            </div>
          </div>

          {investigation ? (
            <div className="space-y-6">
              {/* Root Cause Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">
                      Root Cause Synthesis
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Confidence Calibration:</span>
                    <span className="font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
                      {(investigation.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  {investigation.root_cause_analysis}
                </p>
              </div>

              {/* The 4-Tier Breakdown Required by Spec: Observed Facts, Inferred Explanations, Hypotheses */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Observed Facts (Verified Ground Truth) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">1. Observed Facts</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Definitive chronological facts witnessed in telemetry:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 font-mono">
                    {investigation.observed_facts.map((fact, idx) => (
                      <li key={idx} className="bg-slate-950/60 p-2 rounded border border-slate-800/80 leading-relaxed">
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Inferred Explanations (Causal Deduction) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-400 border-b border-slate-800 pb-2">
                    <Code2 className="w-4 h-4" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">2. Inferred Explanations</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Logical causation deduced from code & failure patterns:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {investigation.inferred_explanations.map((inf, idx) => (
                      <li key={idx} className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                        {inf}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Unverified Hypotheses (Unproven Factors) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">3. Unverified Hypotheses</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    External variables requiring manual verification:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {investigation.unverified_hypotheses.map((hyp, idx) => (
                      <li key={idx} className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                        {hyp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Fix Recommendations & Code Diffs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 text-white">
                  <Code2 className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Proposed Developer Code Fix</h3>
                </div>
                <div className="space-y-4">
                  {investigation.fix_recommendations.map((fix, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{fix.title}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{fix.file}</span>
                      </div>
                      <CodeBlock code={fix.diff} filename={fix.file} language="diff" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
              No investigation analysis found. Click "Re-Analyze Case File" to trigger AI investigation.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETERMINISTIC PLAYWRIGHT REPRODUCTION */}
      {activeTab === 'reproduction' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-white">Playwright Controlled Browser Environment</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recreates viewport, user interaction sequence, network latency & mock failure route
                </p>
              </div>

              <button
                onClick={handleRunReproduction}
                disabled={isReproducing}
                className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
              >
                <PlayCircle className={`w-4 h-4 ${isReproducing ? 'animate-spin' : ''}`} />
                <span>{isReproducing ? 'Executing in Chromium...' : 'Run Browser Reproduction Now'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={simulateNetwork}
                  onChange={(e) => setSimulateNetwork(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-brand-500 focus:ring-0"
                />
                <span>Simulate Network Latency (120ms throttle)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={mockFailedRequests}
                  onChange={(e) => setMockFailedRequests(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-brand-500 focus:ring-0"
                />
                <span>Deterministic API Mocking (Arm HTTP 500 Route)</span>
              </label>
            </div>
          </div>

          {latestReproduction ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Screenshot & Specs (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Reproduction Outcome</span>
                    <StatusBadge status={latestReproduction.status} type="repro" />
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div>Browser: {latestReproduction.environment_config.browser}</div>
                    <div>Viewport: {latestReproduction.environment_config.viewport_w} &times; {latestReproduction.environment_config.viewport_h}</div>
                    <div>Execution Duration: {latestReproduction.duration_ms}ms</div>
                    <div>Exit Code: {latestReproduction.exit_code}</div>
                  </div>
                </div>

                {/* Screenshot */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Captured State Screenshot
                  </span>
                  {latestReproduction.screenshot_url ? (
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={latestReproduction.screenshot_url}
                        alt="Reproduction Failure State"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-lg">
                      No screenshot captured for this run.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Execution Logs (7 cols) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
                <div className="p-3 border-b border-slate-800 bg-slate-850/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Playwright Runner Terminal</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ISOLATED CHROMIUM INSTANCE</span>
                </div>
                <div className="flex-1 p-4 bg-black font-mono text-xs text-emerald-400 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {latestReproduction.execution_logs}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
              No reproduction runs executed yet. Click "Run Browser Reproduction Now" to execute.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGRESSION TEST SUITE */}
      {activeTab === 'regression' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-5 rounded-xl border border-slate-800 gap-4">
            <div>
              <h3 className="font-bold text-sm text-white">AI-Generated Playwright Regression Guard</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifies application handles network failures and edge cases gracefully without fatal white-screen crashes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateRegressionTest}
                disabled={isGeneratingTest}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{isGeneratingTest ? 'Generating...' : 'Synthesize Test'}</span>
              </button>

              {latestTest && (
                <>
                  <button
                    onClick={() => handleRunRegressionTest(latestTest.id)}
                    disabled={isRunningTest}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    <PlayCircle className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
                    <span>{isRunningTest ? 'Running Test...' : 'Run Test Live'}</span>
                  </button>

                  <button
                    onClick={() => handleApproveTest(latestTest.id)}
                    className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/40 transition"
                  >
                    Approve Test
                  </button>

                  <button
                    onClick={() => handleViewCiWorkflow(latestTest.id)}
                    className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 font-semibold">Test Specification:</span>
                  <span className="font-bold text-white">{latestTest.title}</span>
                  <StatusBadge status={latestTest.status} type="test" />
                </div>
                {latestTest.last_run_at && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Last executed: {new Date(latestTest.last_run_at).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Code viewer */}
              <CodeBlock code={latestTest.test_code} filename="tests/reprolens/checkout-regression.spec.ts" language="typescript" />

              {/* Test Runner Console Output if run */}
              {latestTest.execution_result && latestTest.execution_result.stdout && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-slate-800 bg-slate-850/80 text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Test Execution Terminal Output</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Duration: {latestTest.execution_result.duration_ms}ms
                    </span>
                  </div>
                  <pre className="p-4 bg-black font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {latestTest.execution_result.stdout}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
              No regression tests generated yet. Click "Synthesize Test" to generate a Playwright test.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STACK TRACE */}
      {activeTab === 'trace' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Uncaught Exception Stack Trace</h3>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-red-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {bug.stack_trace || bug.error_message || 'No stack trace captured.'}
            </pre>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Target Component Context</h3>
            <div className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {bug.component_context || 'Global Window Scope'}
            </div>
          </div>
        </div>
      )}

      {/* CI/CD Workflow Modal */}
      {showCiModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">GitHub Actions CI/CD Integration</h3>
                <p className="text-xs text-slate-400">Save as <code className="text-slate-300">.github/workflows/reprolens-regression.yml</code></p>
              </div>
              <button
                onClick={() => setShowCiModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <CodeBlock code={ciWorkflowCode} filename=".github/workflows/reprolens-regression.yml" language="yaml" />
            <div className="flex justify-end">
              <button
                onClick={() => setShowCiModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
