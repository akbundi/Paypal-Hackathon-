import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtext?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  subtext,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-soft-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 w-full min-w-0 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 leading-tight truncate">
            {title}
          </p>
          <h3 className="text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight font-mono leading-none">
            {value}
          </h3>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-300 border border-slate-100 dark:border-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 stroke-[1.8]" />
        </div>
      </div>

      {(change || subtext) && (
        <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          {change && (
            <span
              className={`inline-flex items-center text-[12px] font-medium ${
                changeType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : changeType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {change}
            </span>
          )}
          {subtext && <span className="text-[12px] font-normal text-slate-400 dark:text-slate-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
