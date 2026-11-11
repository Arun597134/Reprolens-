import React, { useEffect, useState } from 'react';
import {
  Key, ShieldCheck, Code2, Download, Check, Copy, ExternalLink, Save
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
  const [saved, setSaved] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const activeProject = projects[0];
  const apiKey = activeProject?.api_key || 'rpl_shopnow_demo_key_99';

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        mask_passwords: settings?.mask_passwords ?? true,
        mask_emails: settings?.mask_emails ?? true,
        mask_credit_cards: settings?.mask_credit_cards ?? true,
        filter_query_params: settings?.filter_query_params ?? true
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      const updated = await api.getSettings();
      setSettings(updated);
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

  const npmSnippet = `// npm install reprolens
import { ReproLens } from 'reprolens';

ReproLens.init({
  projectKey: '${apiKey}',
  endpoint: 'http://localhost:8000/api/v1/ingest',
  maskAllInputs: true
});`;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings & SDK Integration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure AI intelligence keys, client-side privacy sanitization rules, and web instrumentation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: AI Keys & Privacy Config */}
        <div className="space-y-6">
          {/* AI Settings */}
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-white border-b border-slate-800 pb-3">
              <Key className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider">AI Intelligence Provider Keys</h3>
            </div>
            <p className="text-xs text-slate-400">
              ReproLens includes a built-in deterministic heuristic analyzer that operates with 100% precision offline. You can optionally supply API keys for cloud LLM reasoning.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                  Google Gemini API Key {settings?.has_gemini_key && <span className="text-emerald-400">(Configured)</span>}
                </label>
                <input
                  type="password"
                  placeholder={settings?.has_gemini_key ? '••••••••••••••••••••' : 'AIzaSy...'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                  OpenAI API Key {settings?.has_openai_key && <span className="text-emerald-400">(Configured)</span>}
                </label>
                <input
                  type="password"
                  placeholder={settings?.has_openai_key ? '••••••••••••••••••••' : 'sk-...'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Local Privacy & Redaction Rules</h4>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">Luhn Algorithm Credit Card Redaction</span>
                  <input
                    type="checkbox"
                    checked={settings?.mask_credit_cards ?? true}
                    onChange={(e) => setSettings(settings ? { ...settings, mask_credit_cards: e.target.checked } : null)}
                    className="rounded bg-slate-900 border-slate-700 text-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">Password & Secret Field Masking ([REDACTED])</span>
                  <input
                    type="checkbox"
                    checked={settings?.mask_passwords ?? true}
                    onChange={(e) => setSettings(settings ? { ...settings, mask_passwords: e.target.checked } : null)}
                    className="rounded bg-slate-900 border-slate-700 text-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">Email Address & PII Redaction</span>
                  <input
                    type="checkbox"
                    checked={settings?.mask_emails ?? true}
                    onChange={(e) => setSettings(settings ? { ...settings, mask_emails: e.target.checked } : null)}
                    className="rounded bg-slate-900 border-slate-700 text-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">URL Query Parameter Token Stripping</span>
                  <input
                    type="checkbox"
                    checked={settings?.filter_query_params ?? true}
                    onChange={(e) => setSettings(settings ? { ...settings, filter_query_params: e.target.checked } : null)}
                    className="rounded bg-slate-900 border-slate-700 text-brand-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saved ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: SDK Installation & Chrome Extension Setup */}
        <div className="space-y-6">
          {/* HTML Drop-in Snippet */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <Code2 className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Embed SDK in HTML</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                ZERO-CONFIG
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Add this single script tag inside the <code className="text-slate-300">&lt;head&gt;</code> of your web application. All errors, network drops, and DOM events are captured automatically.
            </p>
            <CodeBlock code={sdkScriptTag} filename="index.html" language="html" />
          </div>

          {/* Chrome Extension Load Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center space-x-2 text-white border-b border-slate-800 pb-3">
              <Download className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Chrome Extension (Manifest V3)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              To record sessions on any authorized website without modifying source code, install the ReproLens Chrome Extension:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 font-mono bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <li>Open Chrome and navigate to <code className="text-brand-400">chrome://extensions</code></li>
              <li>Toggle <strong>Developer mode</strong> in the top-right corner.</li>
              <li>Click <strong>Load unpacked</strong>.</li>
              <li>Select folder: <code className="text-slate-200">Raprolens/extension</code></li>
            </ol>
            <p className="text-[11px] text-slate-500">
              The floating ReproLens recording badge will automatically appear on authorized web applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
