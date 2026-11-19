import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-3xl p-6 text-[#111] shadow-sm hover:shadow-md hover:border-black/20 transition group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black/50">{title}</span>
        <div className="p-2.5 rounded-2xl bg-black/5 text-[#111] border border-black/[0.06] group-hover:bg-[#111] group-hover:text-white transition">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-light tracking-tight text-[#111] font-mono">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              trendPositive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-black/55 font-mono">{subtitle}</p>}
    </div>
  );
};
