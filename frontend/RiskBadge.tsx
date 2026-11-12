import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = 'md',
}) => {
  const configs = {
    low: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      label: 'Low Risk',
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'Medium Risk',
    },
    high: {
      bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300',
      dot: 'bg-orange-500',
      icon: ShieldAlert,
      label: 'High Risk',
    },
    critical: {
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-600 animate-pulse',
      icon: Flame,
      label: 'Critical Risk',
    },
  };

  const config = configs[level] || configs.low;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] font-semibold px-2 py-0.5 gap-1',
    md: 'text-[12px] font-semibold px-2.5 py-0.5 gap-1.5',
    lg: 'text-[13px] font-semibold px-3 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="font-mono text-[11px] opacity-80 border-l border-current/20 pl-1">
          {score}/100
        </span>
      )}
    </span>
  );
};
