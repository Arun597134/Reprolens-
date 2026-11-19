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
    <div className="rounded-2xl overflow-hidden border border-black/10 bg-[#161616] shadow-md text-white font-mono">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/40 text-xs font-mono text-white/70">
          <span className="font-semibold text-white/90">{filename || language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
      <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed text-white/90">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((line, idx) => {
              const isDiffAdd = line.startsWith('+');
              const isDiffDel = line.startsWith('-');
              let rowBg = '';
              let textCol = 'text-white/80';
              if (isDiffAdd) {
                rowBg = 'bg-emerald-950/60';
                textCol = 'text-emerald-300';
              } else if (isDiffDel) {
                rowBg = 'bg-rose-950/60';
                textCol = 'text-rose-300';
              }

              return (
                <tr key={idx} className={`${rowBg} hover:bg-white/5 transition`}>
                  <td className="pr-4 text-right select-none text-white/30 w-10 text-[11px] align-top">
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
