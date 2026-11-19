import React from 'react';

interface Props {
  status: string;
  type?: 'status' | 'severity' | 'repro' | 'test';
}

export const StatusBadge: React.FC<Props> = ({ status, type = 'status' }) => {
  const s = (status || '').toLowerCase();

  let colorClasses = 'bg-black/5 text-black/70 border-black/10';

  if (s === 'critical' || s === 'failed' || s === 'failing' || s === 'error') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (s === 'high' || s === 'warning' || s === 'inconclusive') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (s === 'reproduced' || s === 'passing' || s === 'resolved' || s === 'approved' || s === 'completed') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (s === 'investigating' || s === 'regression_ready' || s === 'running' || s === 'draft') {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  } else if (s === 'open' || s === 'medium' || s === 'active') {
    colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  } else if (s === 'low') {
    colorClasses = 'bg-black/5 text-black/60 border-black/10';
  }

  const formatText = (txt: string) => {
    return txt.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border tracking-wider ${colorClasses}`}>
      {formatText(status)}
    </span>
  );
};
