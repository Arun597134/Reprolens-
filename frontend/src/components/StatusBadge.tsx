import React from 'react';

interface Props {
  status: string;
  type?: 'status' | 'severity' | 'repro' | 'test';
}

export const StatusBadge: React.FC<Props> = ({ status, type = 'status' }) => {
  const s = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'critical' || s === 'failed' || s === 'failing' || s === 'error') {
    colorClasses = 'bg-red-950/70 text-red-400 border-red-800/60';
  } else if (s === 'high' || s === 'warning' || s === 'inconclusive') {
    colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/60';
  } else if (s === 'reproduced' || s === 'passing' || s === 'resolved' || s === 'approved' || s === 'completed') {
    colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
  } else if (s === 'investigating' || s === 'regression_ready' || s === 'running' || s === 'draft') {
    colorClasses = 'bg-blue-950/70 text-blue-400 border-blue-800/60';
  } else if (s === 'open' || s === 'medium' || s === 'active') {
    colorClasses = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';
  } else if (s === 'low') {
    colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
  }

  const formatText = (txt: string) => {
    return txt.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${colorClasses}`}>
      {formatText(status)}
    </span>
  );
};
