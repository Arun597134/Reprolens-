import React, { useEffect, useState } from 'react';
import {
  Key, ShieldCheck, Code2, Download, Check, Copy, Save, Bell, Send, GitPullRequest, Eye, EyeOff
} from 'lucide-react';
import { SystemSettings, Project } from '../types';
import { api } from '../api';
import { CodeBlock } from '../components/CodeBlock';

interface Props {
  projects: Project[];
}

export const SettingsPage: React.FC<Props> = ({ projects }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [defaultRepo, setDefaultRepo] = useState('Arun597134/Arun-M-portfolio-');
  const [defaultBranch, setDefaultBranch] = useState('master');
  const [slackUrl, setSlackUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [testSlackMsg, setTestSlackMsg] = useState<string | null>(null);
  const [testDiscordMsg, setTestDiscordMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGithub, setShowGithub] = useState(false);

  const activeProject = projects[0];
  const apiKey = activeProject?.api_key || 'rpl_3b40c1052e5b1070bd90ee0900d884af';

  useEffect(() => {
    api.getSettings().then((s: any) => {
      setSettings(s);
      if (s.gemini_api_key) setGeminiKey(s.gemini_api_key);
      if (s.openai_api_key) setOpenaiKey(s.openai_api_key);
      if (s.github_token) setGithubToken(s.github_token);
      if (s.default_github_repo) setDefaultRepo(s.default_github_repo);
      if (s.default_github_branch) setDefaultBranch(s.default_github_branch);
      if (s.slack_webhook_url) setSlackUrl(s.slack_webhook_url);
      if (s.discord_webhook_url) setDiscordUrl(s.discord_webhook_url);
    }).catch(console.error);
  }, []);

  const handleTestSlack = async () => {
    if (!slackUrl) {
      alert('Enter a Slack Webhook URL first.');
      return;
    }
    setIsTestingSlack(true);
    setTestSlackMsg(null);
    try {
      await api.testAlertWebhook({ platform: 'slack', webhook_url: slackUrl });
      setTestSlackMsg('Test alert sent to Slack successfully!');
    } catch (err: any) {
      setTestSlackMsg(`Error: ${err.message}`);
    } finally {
      setIsTestingSlack(false);
    }
  };

  const handleTestDiscord = async () => {
    if (!discordUrl) {
      alert('Enter a Discord Webhook URL first.');
      return;
    }
    setIsTestingDiscord(true);
    setTestDiscordMsg(null);
    try {
      await api.testAlertWebhook({ platform: 'discord', webhook_url: discordUrl });
      setTestDiscordMsg('Test alert sent to Discord successfully!');
    } catch (err: any) {
      setTestDiscordMsg(`Error: ${err.message}`);
    } finally {
      setIsTestingDiscord(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        github_token: githubToken || undefined,
        default_github_repo: defaultRepo,
        default_github_branch: defaultBranch || 'master',
        slack_webhook_url: slackUrl,
        discord_webhook_url: discordUrl,
        mask_passwords: settings?.mask_passwords ?? true,
        mask_emails: settings?.mask_emails ?? true,
        mask_credit_cards: settings?.mask_credit_cards ?? true,
        filter_query_params: settings?.filter_query_params ?? true
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const updated: any = await api.getSettings();
      setSettings(updated);
      if (updated.github_token) setGithubToken(updated.github_token);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  const sdkScriptTag = `<!-- ReproLens Client-Side Telemetry & Privacy Engine -->
<script
  src="http://localhost:8000/sdk/reprolens.js"
  data-project-key="${apiKey}"
  async>
</script>`;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#111] tracking-tight">Platform Settings &amp; SDK Integration</h1>
          <p className="text-xs text-black/55 mt-1 font-mono">
            Configure AI intelligence keys, GitHub CI/CD automation tokens, and real-time alert webhooks
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-mono shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-emerald-800 font-bold">ALL KEYS ACTIVE &amp; CONFIGURED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: AI Keys & GitHub Token */}
        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-5 shadow-sm text-[#111]">
            <div className="flex items-center space-x-2 text-[#111] border-b border-black/[0.08] pb-3">
              <Key className="w-4 h-4 text-black" />
              <h3 className="font-bold text-xs uppercase tracking-wider font-mono">AI Intelligence Provider Keys</h3>
            </div>

            <p className="text-xs text-black/55 leading-relaxed font-mono">
              ReproLens includes deterministic offline diagnostics. Optional API keys enable cloud LLM reasoning and GitHub auto-PR creation.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 font-mono">
                    Google Gemini API Key
                  </label>
                  {geminiKey && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showGemini ? 'text' : 'password'}
                    placeholder="Enter Gemini API key..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-3 top-2.5 text-black/40 hover:text-black transition"
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 font-mono">
                    OpenAI API Key
                  </label>
                  {openaiKey && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showOpenai ? 'text' : 'password'}
                    placeholder="Enter OpenAI API key..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenai(!showOpenai)}
                    className="absolute right-3 top-2.5 text-black/40 hover:text-black transition"
                  >
                    {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* GitHub CI/CD Token */}
            <div className="pt-4 border-t border-black/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#111]">
                  <GitPullRequest className="w-4 h-4 text-black" />
                  <h3 className="font-bold text-xs uppercase tracking-wider font-mono">GitHub CI/CD Automation Token</h3>
                </div>
                {githubToken && (
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Connected
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5 font-mono">
                  Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <input
                    type={showGithub ? 'text' : 'password'}
                    placeholder="Enter GitHub Personal Access Token..."
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithub(!showGithub)}
                    className="absolute right-3 top-2.5 text-black/40 hover:text-black transition"
                  >
                    {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">
                    Default Repository
                  </label>
                  <input
                    type="text"
                    placeholder="owner/repo"
                    value={defaultRepo}
                    onChange={(e) => setDefaultRepo(e.target.value)}
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">
                    Branch
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="w-full bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Instant Alert Webhooks */}
            <div className="pt-4 border-t border-black/[0.08] space-y-4">
              <div className="flex items-center space-x-2 text-[#111]">
                <Bell className="w-4 h-4 text-black" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">Instant Alert Webhooks</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">Slack Incoming Webhook</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={slackUrl}
                      onChange={(e) => setSlackUrl(e.target.value)}
                      className="flex-1 bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleTestSlack}
                      disabled={isTestingSlack}
                      className="px-3 py-2 bg-white hover:bg-black/5 text-[#111] text-xs font-mono font-bold rounded-xl border border-black/15 shadow-sm transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isTestingSlack ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>
                  {testSlackMsg && <p className="text-[10px] mt-1 text-emerald-700 font-mono font-semibold">{testSlackMsg}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 mb-1 font-mono">Discord Incoming Webhook</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={discordUrl}
                      onChange={(e) => setDiscordUrl(e.target.value)}
                      className="flex-1 bg-[#F5F4F0] border border-black/15 rounded-xl px-3 py-2 text-xs text-[#111] font-mono focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleTestDiscord}
                      disabled={isTestingDiscord}
                      className="px-3 py-2 bg-white hover:bg-black/5 text-[#111] text-xs font-mono font-bold rounded-xl border border-black/15 shadow-sm transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isTestingDiscord ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>
                  {testDiscordMsg && <p className="text-[10px] mt-1 text-emerald-700 font-mono font-semibold">{testDiscordMsg}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#111] hover:bg-black text-white text-xs font-mono font-bold rounded-xl shadow transition tracking-wider uppercase cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Settings Saved' : 'Save Platform Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: SDK snippet & Chrome Extension */}
        <div className="space-y-6">
          {/* SDK Integration Card */}
          <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm text-[#111]">
            <div className="flex items-center space-x-2 border-b border-black/[0.08] pb-3">
              <Code2 className="w-4 h-4 text-black" />
              <h3 className="font-bold text-xs uppercase tracking-wider font-mono">Web SDK Integration</h3>
            </div>
            <p className="text-xs text-black/55 leading-relaxed font-mono">
              Add this lightweight asynchronous tag into the <code className="text-[#111] font-bold">&lt;head&gt;</code> of any web application to start recording DOM telemetry and uncaught errors.
            </p>
            <CodeBlock code={sdkScriptTag} language="html" filename="index.html" />
          </div>

          {/* Chrome Extension Download Card */}
          <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-sm text-[#111]">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-black" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">ReproLens Chrome Extension</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                v1.0.0 Ready
              </span>
            </div>
            <p className="text-xs text-black/55 leading-relaxed font-mono">
              Record telemetry without code changes! Load this unpacked extension into Chrome/Edge Developer Mode to stream live events straight to your local dashboard.
            </p>
            <a
              href="http://localhost:8000/download/extension"
              download="reprolens-extension-v1.0.0.zip"
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#111] hover:bg-black text-white text-xs font-mono font-bold rounded-xl shadow transition tracking-wider uppercase cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Extension .ZIP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
