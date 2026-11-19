import React, { useState, useEffect, useRef } from 'react';
import {
  Play, RotateCcw, Activity, ShieldCheck, Sparkles, PlayCircle,
  Layers, GitPullRequest, Bell, CheckCircle2, ChevronRight, X,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Compass, Terminal, Code2, ArrowUpRight,
  Split, Globe, ExternalLink, Check, Copy, Volume2, Gauge, Laptop
} from 'lucide-react';

export interface N8nNode {
  id: string;
  name: string;
  subtitle: string;
  category: 'Trigger' | 'Security' | 'AI Engine' | 'Playwright' | 'Sandbox' | 'Router' | 'Git Ops' | 'Alert' | 'Webhook' | 'Performance' | 'Developer Tools';
  n8nType: string;
  x: number;
  y: number;
  icon: any;
  color: string;
  pillBg: string;
  pillText: string;
  borderGlow: string;
  description: string;
  techStack: string;
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  isIfNode?: boolean;
}

export interface N8nConnection {
  from: string;
  to: string;
  fromOutputIdx?: number;
  label?: string;
}

const NODES: N8nNode[] = [
  {
    id: 'node-1',
    name: 'Bug Ingest Trigger',
    subtitle: 'Chrome Extension & SDK',
    category: 'Trigger',
    n8nType: 'reprolens.trigger.onBugEvent',
    x: 40,
    y: 190,
    icon: Activity,
    color: '#FF6D5A',
    pillBg: 'bg-[#FF6D5A]/15',
    pillText: 'text-[#FF6D5A]',
    borderGlow: 'hover:border-[#FF6D5A]',
    description: 'Autonomous listener on client browser. Buffers DOM events in a 45s circular flight recorder and triggers instantly on fatal runtime crash or HTTP 500.',
    techStack: 'Chrome Extension Manifest V3 • Web SDK Client Engine',
    inputPayload: {
      event: 'window.onerror',
      error: "TypeError: Cannot read properties of undefined (reading 'items')",
      route: 'https://arun-m-portfolio.vercel.app/projects',
      click_target: '<button id="pay-now">Pay $49.00</button>',
    },
    outputPayload: {
      session_id: 'rpl_cf4a2650',
      error_type: 'TypeError',
      severity: 'critical',
      timestamp_ms: 8420,
      breadcrumbs_count: 14,
    },
  },
  {
    id: 'node-2',
    name: 'Zero-PII Sanitizer',
    subtitle: 'On-Device Token Scrubbing',
    category: 'Security',
    n8nType: 'reprolens.security.piiScrubber',
    x: 300,
    y: 190,
    icon: ShieldCheck,
    color: '#10B981',
    pillBg: 'bg-emerald-500/15',
    pillText: 'text-emerald-400',
    borderGlow: 'hover:border-emerald-500',
    description: 'Scans all DOM attributes and network headers before transmission. Uses Luhn algorithm and RFC regex to redact credit cards, passwords, and JWT bearer tokens.',
    techStack: 'Luhn Mathematical Checker • RFC Bearer Regex Filter',
    inputPayload: {
      email: 'arun.developer@enterprise.com',
      card_number: '4532 8912 3456 7890',
      authorization: 'Bearer eyJhbGciOiJIUzI1Ni...',
    },
    outputPayload: {
      email: '[REDACTED_EMAIL]',
      card_number: '[REDACTED_LUHN_CC]',
      authorization: '[REDACTED_BEARER_TOKEN]',
      is_sanitized: true,
    },
  },
  {
    id: 'node-3',
    name: 'AI Root-Cause Reasoner',
    subtitle: 'Facts vs Hypotheses Diff',
    category: 'AI Engine',
    n8nType: 'reprolens.ai.diagnosticReasoner',
    x: 580,
    y: 70,
    icon: Sparkles,
    color: '#8B5CF6',
    pillBg: 'bg-purple-500/15',
    pillText: 'text-purple-400',
    borderGlow: 'hover:border-purple-500',
    description: 'Correlates stack trace with semantic click context. Divides diagnosis strictly into Observed Facts and Inferred Hypotheses with calibrated confidence.',
    techStack: 'Gemini 2.5 Flash / GPT-4o-mini • 4-Tier Reasoning Engine',
    inputPayload: {
      stack_trace: 'at ProjectsGrid.tsx:42:15\nat map (native)',
      observed_fact: 'User clicked projects filter while API promise was in pending state',
    },
    outputPayload: {
      confidence_score: 0.94,
      target_file: 'src/components/ProjectsGrid.tsx',
      root_cause: 'State array hydrated with undefined instead of empty array before network fetch finished.',
      suggested_fix: 'items?.map(...) ?? []',
    },
  },
  {
    id: 'node-voice',
    name: 'AI Voice Bug Explainer',
    subtitle: 'Natural Speech Audio RCA',
    category: 'AI Engine',
    n8nType: 'reprolens.ai.voiceExplainer',
    x: 580,
    y: 310,
    icon: Volume2,
    color: '#A855F7',
    pillBg: 'bg-purple-500/15',
    pillText: 'text-purple-400',
    borderGlow: 'hover:border-purple-500',
    description: 'Synthesizes an executive 30-second natural audio briefing with 5-bar animated equalizer and synchronized transcript for standup and on-call engineering triage.',
    techStack: 'Web Speech API • Audio Synthesis Layer • Waveform Engine',
    inputPayload: {
      bug_id: 'cf4a2650',
      error: "TypeError: Cannot read properties of undefined (reading 'items')",
      duration_limit_sec: 30,
      speech_rate_options: ['1x', '1.25x', '1.5x'],
    },
    outputPayload: {
      audio_brief_ready: true,
      duration: '28.4s',
      speech_rates: ['1x', '1.25x', '1.5x'],
      transcript_words: 68,
      tone: 'calibrated_executive',
    },
  },
  {
    id: 'node-4',
    name: 'Playwright Reproduction',
    subtitle: 'Deterministic Headless Browser',
    category: 'Playwright',
    n8nType: 'reprolens.browser.replayRunner',
    x: 880,
    y: 70,
    icon: PlayCircle,
    color: '#F59E0B',
    pillBg: 'bg-amber-500/15',
    pillText: 'text-amber-400',
    borderGlow: 'hover:border-amber-500',
    description: 'Launches isolated headless Chromium with matching viewport, cookies, user agent, and simulated 3G latency. Executes click coordinates deterministically.',
    techStack: 'Playwright v1.42 • Headless Chromium • Windows Proactor Loop',
    inputPayload: {
      viewport: { width: 1440, height: 900 },
      steps: ['navigate https://arun-m-portfolio.vercel.app', 'click #projects-tab', 'click button#pay-now'],
    },
    outputPayload: {
      status: 'reproduced',
      exit_code: 0,
      filmstrip_captured: 6,
      error_confirmed: 'TypeError: Cannot read properties of undefined',
    },
  },
  {
    id: 'node-radar',
    name: 'Performance & Memory Radar',
    subtitle: 'Heap & 60 FPS Profiler',
    category: 'Performance',
    n8nType: 'reprolens.perf.radarTelemetry',
    x: 880,
    y: 310,
    icon: Gauge,
    color: '#06B6D4',
    pillBg: 'bg-cyan-500/15',
    pillText: 'text-cyan-400',
    borderGlow: 'hover:border-cyan-500',
    description: 'Monitors JS Heap growth velocity in MB/s, catches 60 FPS frame drops below 30 FPS stall line, and flags main-thread long tasks exceeding 50ms.',
    techStack: 'Chrome Performance Memory API • RAF Clock • Long Task Observer',
    inputPayload: {
      profile_window_ms: 10000,
      sample_interval_ms: 250,
      target_fps: 60,
      long_task_threshold_ms: 50,
    },
    outputPayload: {
      leak_velocity_mb_s: 4.2,
      fps_dips_count: 3,
      max_long_task_ms: 78,
      leak_risk: 'high',
      recommended_action: 'AST Clean Eviction',
    },
  },
  {
    id: 'node-5',
    name: 'Dual-Reality Split Sandbox',
    subtitle: 'Reality A vs Reality B Proof',
    category: 'Sandbox',
    n8nType: 'reprolens.sandbox.dualReality',
    x: 1180,
    y: 190,
    icon: Layers,
    color: '#EC4899',
    pillBg: 'bg-pink-500/15',
    pillText: 'text-pink-400',
    borderGlow: 'hover:border-pink-500',
    description: 'Executes Reality A (unpatched runtime crash) side-by-side with Reality B (AST resilient fallback) live in the browser to mathematically prove fix efficacy without page reload.',
    techStack: 'Component Isolation Sandbox • AST Fallback Injector • Delta Comparator Engine',
    inputPayload: {
      reality_a: 'broken baseline (reproduced crash)',
      reality_b_ast_patch: 'safe optional chain & empty array fallback',
    },
    outputPayload: {
      verdict: 'FIX_PROVEN_EFFECTIVE',
      reality_a_crashed: true,
      reality_b_resilient: true,
      error_reduction: '100%',
      zero_page_reload: true,
    },
  },
  {
    id: 'node-autoshield',
    name: 'Autonomous Auto-Shield Engine',
    subtitle: '0-Sec Live Runtime Immunity',
    category: 'Security',
    n8nType: 'reprolens.security.autoShield',
    x: 1480,
    y: 190,
    icon: ShieldCheck,
    color: '#10B981',
    pillBg: 'bg-emerald-500/15',
    pillText: 'text-emerald-400',
    borderGlow: 'hover:border-emerald-500',
    description: 'Self-healing web immune system. Instantly activates AST exception traps and Service Worker proxy to prevent visitor crashes and protect revenue before PR merge.',
    techStack: 'Runtime AST Trap Injector • reprolens-shield.sw.js • 24h Auto-Expire TTL',
    inputPayload: {
      bug_id: 'cf4a2650',
      sandbox_verified: true,
      mitigation_strategy: 'ast_resilient_fallback',
      ttl_hours: 24,
    },
    outputPayload: {
      shield_status: 'ARMED',
      crashes_prevented: 142,
      revenue_saved_usd: 6958,
      latency_overhead_ms: 1.1,
      visitor_downtime_ms: 0,
    },
  },
  {
    id: 'node-6',
    name: 'Domain Ownership Router',
    subtitle: 'Host Mismatch & Mode Filter',
    category: 'Router',
    n8nType: 'n8n-nodes-base.if',
    x: 1780,
    y: 190,
    icon: Split,
    color: '#3B82F6',
    pillBg: 'bg-blue-500/15',
    pillText: 'text-blue-400',
    borderGlow: 'hover:border-blue-500',
    isIfNode: true,
    description: 'Inspects host of incident vs project website URL. If verified repo, routes to Manual GitHub PR Studio and IDE Dispatch. If external site, routes to passive audit.',
    techStack: 'Domain Host Normalizer • SDK Source Detector',
    inputPayload: {
      bug_host: 'arun-m-portfolio.vercel.app',
      project_host: 'arun-m-portfolio.vercel.app',
      has_github_repo: true,
    },
    outputPayload: {
      is_own_project: true,
      condition: 'bug_host === project_host && repo_linked',
      branch: 'TRUE -> Manual PR Studio & Local IDE Dispatch',
    },
  },
  {
    id: 'node-7a',
    name: 'Manual GitHub PR Studio',
    subtitle: 'Zero-Push Confirmation & Diff',
    category: 'Git Ops',
    n8nType: 'reprolens.git.manualPullRequest',
    x: 2080,
    y: 60,
    icon: GitPullRequest,
    color: '#10B981',
    pillBg: 'bg-emerald-500/15',
    pillText: 'text-emerald-400',
    borderGlow: 'hover:border-emerald-500',
    description: 'Zero-Auto-Push review studio. Prompts engineer with complete code diff and target repository selector. Never touches personal or linked repos without explicit manual user confirmation.',
    techStack: 'GitHub REST API v3 • Manual User Confirmation Gate • Git Tree Diff Inspector',
    inputPayload: {
      require_manual_approval: true,
      allow_auto_push: false,
      target_repo: 'configured_workspace_or_custom',
      prompt_user: true,
    },
    outputPayload: {
      approval_status: 'PENDING_ENGINEER_CONFIRMATION',
      auto_pushed: false,
      preview_diff_lines: 18,
      safe_mode: true,
    },
  },
  {
    id: 'node-vscode',
    name: 'IDE Deep-Link & Hotfix Dispatch',
    subtitle: 'VS Code & Cursor Jump',
    category: 'Developer Tools',
    n8nType: 'reprolens.ide.deepLinkLauncher',
    x: 2080,
    y: 220,
    icon: Laptop,
    color: '#38BDF8',
    pillBg: 'bg-sky-500/15',
    pillText: 'text-sky-400',
    borderGlow: 'hover:border-sky-500',
    description: 'Dispatches direct vscode://file/... and cursor://file/... protocol links opening the exact source line and column. Copies verified patch directly to clipboard for instant local fix.',
    techStack: 'VS Code Protocol Handler • Cursor IDE Deep Link • Clipboard API Integration',
    inputPayload: {
      file_path: 'src/components/ProjectsGrid.tsx',
      line: 42,
      col: 15,
      ide: 'vscode',
    },
    outputPayload: {
      uri: 'vscode://file/c:/workspace/ProjectsGrid.tsx:42:15',
      clipboard_patch_copied: true,
      time_saved_minutes: 25,
    },
  },
  {
    id: 'node-7b',
    name: 'External App Monitor',
    subtitle: 'Investigate & Replay Only',
    category: 'Router',
    n8nType: 'reprolens.monitor.passiveAudit',
    x: 2080,
    y: 380,
    icon: Globe,
    color: '#0EA5E9',
    pillBg: 'bg-sky-500/15',
    pillText: 'text-sky-400',
    borderGlow: 'hover:border-sky-500',
    description: 'Handles external or 3rd-party websites (e.g. v0.app, SaaS tools). Captures full telemetry and Playwright replay without pushing code changes to GitHub.',
    techStack: 'Passive Session Recorder • Root Cause Analyzer',
    inputPayload: {
      external_site: 'https://v0.app/chat/123',
      action: 'Passive capture and diagnosis only (No git permissions)',
    },
    outputPayload: {
      status: 'investigated',
      can_push_pr: false,
      reason: 'External active website mode active',
    },
  },
  {
    id: 'node-8',
    name: 'Auto-Close Webhook',
    subtitle: 'PR Merged -> Bug RESOLVED',
    category: 'Webhook',
    n8nType: 'reprolens.webhook.gitLifecycle',
    x: 2380,
    y: 60,
    icon: CheckCircle2,
    color: '#14B8A6',
    pillBg: 'bg-teal-500/15',
    pillText: 'text-teal-400',
    borderGlow: 'hover:border-teal-500',
    description: 'Receives GitHub pull_request merged webhook. Matches ReproLens bug ID in branch name and automatically marks the bug status as RESOLVED!',
    techStack: 'GitHub Webhook Listener • HMAC Verification',
    inputPayload: {
      event: 'pull_request',
      action: 'closed',
      merged: true,
      branch: 'reprolens/fix-cf4a2650',
    },
    outputPayload: {
      status: 'resolved',
      bug_id: 'cf4a2650',
      message: 'Bug closed automatically on GitHub PR merge!',
    },
  },
  {
    id: 'node-9',
    name: 'Slack & Discord Alert Bot',
    subtitle: '1-Click Incident Review',
    category: 'Alert',
    n8nType: 'reprolens.alert.multiChannel',
    x: 2380,
    y: 240,
    icon: Bell,
    color: '#F97316',
    pillBg: 'bg-orange-500/15',
    pillText: 'text-orange-400',
    borderGlow: 'hover:border-orange-500',
    description: 'Dispatches real-time cards with AI root cause summary and 1-click mobile review links to developer Slack channels and Discord webhooks.',
    techStack: 'Slack Block Kit • Discord Webhook Embeds',
    inputPayload: {
      severity: 'CRITICAL',
      title: 'TypeError in ProjectsGrid.tsx',
      repro_link: 'http://localhost:5173/?view=bug&id=cf4a2650',
    },
    outputPayload: {
      slack_delivered: true,
      discord_delivered: true,
      status: 'sent',
    },
  },
];

const CONNECTIONS: N8nConnection[] = [
  { from: 'node-1', to: 'node-2' },
  { from: 'node-2', to: 'node-3' },
  { from: 'node-2', to: 'node-voice' },
  { from: 'node-2', to: 'node-radar' },
  { from: 'node-3', to: 'node-4' },
  { from: 'node-4', to: 'node-5' },
  { from: 'node-voice', to: 'node-5' },
  { from: 'node-radar', to: 'node-5' },
  { from: 'node-5', to: 'node-autoshield', label: 'Sandbox Verified' },
  { from: 'node-autoshield', to: 'node-6', label: 'Immunity Armed' },
  { from: 'node-6', to: 'node-7a', fromOutputIdx: 0, label: 'True (Manual PR Studio)' },
  { from: 'node-6', to: 'node-vscode', fromOutputIdx: 0, label: 'True (IDE Dispatch)' },
  { from: 'node-6', to: 'node-7b', fromOutputIdx: 1, label: 'False (External Site)' },
  { from: 'node-7a', to: 'node-8', label: 'On PR Merge' },
  { from: 'node-7a', to: 'node-9', label: 'Notify' },
  { from: 'node-vscode', to: 'node-9', label: 'IDE Jump' },
  { from: 'node-7b', to: 'node-9', label: 'Notify' },
];

export const N8nWorkflowPipeline: React.FC<{ isDark?: boolean; onOpenDashboard?: () => void }> = ({
  isDark = true,
  onOpenDashboard,
}) => {
  const [selectedNode, setSelectedNode] = useState<N8nNode | null>(null);
  const [simulatingNodeId, setSimulatingNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ESC key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Auto-scroll into view when simulation runs
  useEffect(() => {
    if (simulatingNodeId && containerRef.current) {
      const activeEl = document.getElementById(`n8n-node-${simulatingNodeId}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [simulatingNodeId]);

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const stepOrder = [
      'node-1',
      'node-2',
      'node-3',
      'node-voice',
      'node-radar',
      'node-4',
      'node-5',
      'node-autoshield',
      'node-6',
      'node-vscode',
      'node-7a',
      'node-8',
      'node-9'
    ];
    let idx = 0;
    setSimulatingNodeId(stepOrder[0]);

    const interval = setInterval(() => {
      idx += 1;
      if (idx >= stepOrder.length) {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulatingNodeId(null);
      } else {
        setSimulatingNodeId(stepOrder[idx]);
      }
    }, 900);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setSimulatingNodeId(null);
    setSelectedNode(null);
    setZoomLevel(0.92);
  };

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Helper to compute SVG Bezier path between two nodes
  const calculateBezier = (conn: N8nConnection) => {
    const fromNode = NODES.find((n) => n.id === conn.from);
    const toNode = NODES.find((n) => n.id === conn.to);
    if (!fromNode || !toNode) return '';

    const nodeWidth = 230;
    const nodeHeight = 110;

    // Source output handle (right side)
    const x1 = fromNode.x + nodeWidth;
    let y1 = fromNode.y + nodeHeight / 2;
    if (fromNode.isIfNode) {
      y1 = conn.fromOutputIdx === 0 ? fromNode.y + 35 : fromNode.y + 75;
    }

    // Target input handle (left side)
    const x2 = toNode.x;
    const y2 = toNode.y + nodeHeight / 2;

    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF6D5A]/15 border border-[#FF6D5A]/30 text-[#FF6D5A] text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Activity className="w-3.5 h-3.5" />
          <span>Interactive n8n Node Workflow</span>
        </div>
        <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
          Autonomous Bug Engineering Canvas
        </h2>
        <p className={`text-xs md:text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Visual reactive flow with curved Bezier connections, glowing signal noodles, conditional branching, and automatic GitHub PR resolution.
        </p>
      </div>

      {/* Main n8n Workflow Studio Frame */}
      <div
        className={`transition-all duration-300 relative ${
          isFullscreen
            ? 'fixed inset-0 z-[100] w-screen h-screen bg-[#0C0D14] p-4 sm:p-6 flex flex-col overflow-hidden rounded-none border-none'
            : `rounded-3xl border overflow-hidden shadow-2xl relative ${
                isDark
                  ? 'bg-[#12131A] border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.9)]'
                  : 'bg-[#FAF9F5] border-black/15 shadow-2xl'
              }`
        }`}
      >
        {/* Top n8n Studio Bar */}
        <div
          className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b text-xs font-mono shrink-0 ${
            isDark ? 'bg-[#181A24] border-white/10 text-white' : 'bg-white border-black/10 text-[#111]'
          }`}
        >
          {/* Left: Workflow Title & Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF6D5A] shadow-[0_0_8px_#FF6D5A]" />
              <span className="font-extrabold text-sm tracking-tight">reprolens_autonomous_pipeline.json</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● Active Workflow
            </span>
            {isFullscreen && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                FULLSCREEN (Press ESC to exit)
              </span>
            )}
          </div>

          {/* Right: Simulation & Zoom Controls & Fullscreen */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition shadow-lg ${
                isSimulating
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-[#FF6D5A] hover:bg-[#ff5540] text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Workflow</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className={`p-2 rounded-xl border transition ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  : 'bg-white border-black/10 hover:bg-black/5 text-black/70'
              }`}
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Controls */}
            <div className={`flex items-center rounded-xl border p-0.5 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1.5 hover:opacity-75 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[10px] font-bold">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.2, z + 0.1))}
                className="p-1.5 hover:opacity-75 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Expand / Collapse Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`px-3 py-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer ${
                isFullscreen
                  ? 'bg-[#FF6D5A]/20 border-[#FF6D5A]/50 text-[#FF6D5A]'
                  : isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white border-black/10 hover:bg-black/5 text-[#111]'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-[#FF6D5A]" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* The Authentic n8n Infinite Canvas Area */}
        <div
          ref={containerRef}
          className={`relative overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing p-10 ${
            isFullscreen ? 'flex-1 h-full min-h-[500px]' : 'min-h-[640px] h-[72vh]'
          }`}
          style={{
            backgroundColor: isDark ? '#14151F' : '#F4F5F8',
            backgroundImage: isDark
              ? 'radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)'
              : 'radial-gradient(rgba(0,0,0,0.18) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Zoomed Container Layer */}
          <div
            className="relative transition-transform duration-200 origin-top-left"
            style={{
              width: '2750px',
              height: '520px',
              transform: `scale(${zoomLevel})`,
            }}
          >
            {/* SVG Connecting Bezier Curved Noodles Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="noodleGradDefault" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF6D5A" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                </linearGradient>

                <linearGradient id="noodleGradBranchTrue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>

                <linearGradient id="noodleGradBranchFalse" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>

                <filter id="glowNoodle" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render each curved connection wire */}
              {CONNECTIONS.map((conn, idx) => {
                const pathStr = calculateBezier(conn);
                const isBranchTrue = conn.fromOutputIdx === 0;
                const isBranchFalse = conn.fromOutputIdx === 1;

                let strokeColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
                if (isBranchTrue) strokeColor = 'rgba(16, 185, 129, 0.7)';
                if (isBranchFalse) strokeColor = 'rgba(14, 165, 233, 0.7)';
                if (isSimulating) strokeColor = 'url(#noodleGradDefault)';

                return (
                  <g key={`${conn.from}-${conn.to}-${idx}`}>
                    {/* Shadow / Base Wire */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSimulating ? 3.5 : 2.5}
                      strokeLinecap="round"
                      filter={isSimulating ? 'url(#glowNoodle)' : undefined}
                      className="transition-all duration-300"
                    />

                    {/* Animated Pulse Stream travelling along the noodle */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={isDark ? '#FFFFFF' : '#FF6D5A'}
                      strokeWidth={3}
                      strokeDasharray="8, 16"
                      strokeLinecap="round"
                      className="animate-[dash_1.5s_linear_infinite]"
                      opacity={isSimulating ? 0.95 : 0.45}
                    />

                    {/* Connection Port Label badge on wire */}
                    {conn.label && (
                      <text
                        x={(NODES.find((n) => n.id === conn.from)?.x || 0) + 242}
                        y={
                          isBranchTrue
                            ? 120
                            : isBranchFalse
                            ? 255
                            : (NODES.find((n) => n.id === conn.from)?.y || 0) + 48
                        }
                        fill={isBranchTrue ? '#10B981' : isBranchFalse ? '#0EA5E9' : '#10B981'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Individual n8n Style Node Cards */}
            {NODES.map((node, nodeIdx) => {
              const NodeIcon = node.icon;
              const isSelected = selectedNode?.id === node.id;
              const isRunning = isSimulating && simulatingNodeId === node.id;

              return (
                <div
                  key={node.id}
                  id={`n8n-node-${node.id}`}
                  onClick={() => setSelectedNode(node)}
                  className={`absolute w-[230px] rounded-2xl border transition-all duration-200 select-none cursor-pointer group shadow-lg ${
                    isSelected
                      ? isDark
                        ? 'border-white bg-[#1E2230] shadow-[0_0_30px_rgba(255,109,90,0.35)] scale-[1.03] z-30'
                        : 'border-[#FF6D5A] bg-white shadow-2xl scale-[1.03] z-30'
                      : isDark
                      ? 'border-white/15 bg-[#181A25] hover:border-white/40 hover:bg-[#1E212E] z-10'
                      : 'border-black/15 bg-white hover:border-black/40 z-10'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                  }}
                >
                  {/* Running Glowing Ring Animation */}
                  {isRunning && (
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF6D5A] via-purple-500 to-emerald-500 blur-sm opacity-80 animate-pulse pointer-events-none" />
                  )}

                  {/* Node Header Pill */}
                  <div className="px-3.5 pt-3 pb-1 flex items-center justify-between border-b border-white/5">
                    <span
                      className={`text-[9px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${node.pillBg} ${node.pillText}`}
                    >
                      {node.category}
                    </span>

                    <span className="text-[9px] font-mono opacity-50">
                      {isRunning ? '● RUNNING' : `Stage 0${nodeIdx + 1}`}
                    </span>
                  </div>

                  {/* Node Body */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                        style={{ backgroundColor: `${node.color}20`, border: `1px solid ${node.color}50` }}
                      >
                        <NodeIcon className="w-4 h-4" style={{ color: node.color }} />
                      </div>
                      <div className="truncate">
                        <h4 className={`text-xs font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-[#111]'}`}>
                          {node.name}
                        </h4>
                        <p className="text-[10px] font-mono opacity-60 truncate">{node.subtitle}</p>
                      </div>
                    </div>

                    <p className={`text-[10px] leading-relaxed line-clamp-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {node.description}
                    </p>
                  </div>

                  {/* Input Port (Left Handle Circle) */}
                  <div
                    className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-md transition-transform group-hover:scale-125 ${
                      isDark
                        ? 'bg-[#181A25] border-white/40 text-white'
                        : 'bg-white border-black/40 text-black'
                    }`}
                    title="Input Port"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  </div>

                  {/* Output Port(s) (Right Handle Circles) */}
                  {!node.isIfNode ? (
                    <div
                      className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-md transition-transform group-hover:scale-125 ${
                        isDark
                          ? 'bg-[#181A25] border-white/40 text-white'
                          : 'bg-white border-black/40 text-black'
                      }`}
                      title="Output Port"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  ) : (
                    /* IF Node has Two Output Ports: True (top) & False (bottom) */
                    <>
                      <div
                        className="absolute -right-2 top-8 w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-950 flex items-center justify-center shadow-md transition-transform hover:scale-125"
                        title="Output: True (Own Project)"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div
                        className="absolute -right-2 bottom-8 w-4 h-4 rounded-full border-2 border-sky-400 bg-sky-950 flex items-center justify-center shadow-md transition-transform hover:scale-125"
                        title="Output: False (External App)"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas Bottom Status Bar */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between border-t text-[11px] font-mono ${
            isDark ? 'bg-[#181A24] border-white/10 text-white/60' : 'bg-white border-black/10 text-black/60'
          }`}
        >
          <div className="flex items-center space-x-4">
            <span>● {NODES.length} Nodes Connected</span>
            <span>&bull; {CONNECTIONS.length} Execution Noodles</span>
            <span className="text-emerald-400 font-bold">Execution Engine: Deterministic</span>
          </div>
          <span className="opacity-70">Click any node to inspect payload &amp; parameters</span>
        </div>
      </div>

      {/* Slide-Over Node Inspector Modal (Just like double clicking a node in n8n!) */}
      {selectedNode && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
              isDark ? 'bg-[#141622] border-white/20 text-white' : 'bg-white border-black/20 text-[#111]'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between border-b ${
                isDark ? 'bg-[#1B1E2E] border-white/10' : 'bg-[#F9F8F5] border-black/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: `${selectedNode.color}25`, border: `1px solid ${selectedNode.color}60` }}
                >
                  {React.createElement(selectedNode.icon, {
                    className: 'w-5 h-5',
                    style: { color: selectedNode.color },
                  })}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF6D5A]">
                      {selectedNode.n8nType}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight">{selectedNode.name}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 rounded-xl hover:bg-white/10 transition text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Tabs & Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto font-sans">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 block mb-1">
                  Node Specification
                </span>
                <p className="text-xs leading-relaxed opacity-80">{selectedNode.description}</p>
                <div className="mt-2 text-xs font-mono text-[#FF6D5A] font-semibold">
                  Stack: {selectedNode.techStack}
                </div>
              </div>

              {/* JSON Input & Output Sandbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                {/* Input Payload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Input Data (Node Pin)
                    </span>
                    <button
                      onClick={() => copyJson(selectedNode.inputPayload)}
                      className="text-[10px] opacity-60 hover:opacity-100 flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-[#0B0D14] text-amber-200/90 p-3 rounded-xl border border-white/10 max-h-52 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedNode.inputPayload, null, 2)}</pre>
                  </div>
                </div>

                {/* Output Payload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Output Data (Node Result)
                    </span>
                    <button
                      onClick={() => copyJson(selectedNode.outputPayload)}
                      className="text-[10px] opacity-60 hover:opacity-100 flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-[#0B0D14] text-emerald-300 p-3 rounded-xl border border-white/10 max-h-52 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedNode.outputPayload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div
              className={`px-6 py-3.5 border-t flex items-center justify-between text-xs font-mono ${
                isDark ? 'bg-[#1B1E2E] border-white/10' : 'bg-[#F9F8F5] border-black/10'
              }`}
            >
              <span className="opacity-60">Status: Executable Unit Verified</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 bg-[#FF6D5A] hover:bg-[#ff5540] text-white font-bold rounded-xl transition uppercase tracking-wider"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
