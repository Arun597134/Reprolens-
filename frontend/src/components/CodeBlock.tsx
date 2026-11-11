import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock: React.FC<Props> = ({ code, language = 'typescript', filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-md">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-400">
          <span className="font-semibold text-slate-300">{filename || language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-300 transition border border-slate-750"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
      <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed text-slate-300">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((line, idx) => {
              const isDiffAdd = line.startsWith('+');
              const isDiffDel = line.startsWith('-');
              let rowBg = '';
              let textCol = 'text-slate-300';
              if (isDiffAdd) {
                rowBg = 'bg-emerald-950/40';
                textCol = 'text-emerald-300';
              } else if (isDiffDel) {
                rowBg = 'bg-red-950/40';
                textCol = 'text-red-300';
              }

              return (
                <tr key={idx} className={`${rowBg} hover:bg-slate-900/60 transition`}>
                  <td className="pr-4 text-right select-none text-slate-600 w-10 text-[11px] align-top">
                    {idx + 1}
                  </td>
                  <td className={`pl-2 font-mono whitespace-pre ${textCol}`}>
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
