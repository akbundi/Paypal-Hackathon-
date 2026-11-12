import React from 'react';
import { TransactionStatus } from '../../types';
import { CheckCircle2, Ban, Clock, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  status: TransactionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs = {
    protected: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      label: 'Protected',
    },
    blocked: {
      bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: Ban,
      label: 'Blocked',
    },
    held: {
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: Clock,
      label: 'Held for Approval',
    },
    refunded: {
      bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: RotateCcw,
      label: 'Refunded',
    },
  };

  const config = configs[status] || configs.protected;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[11px] font-semibold px-2 py-0.5 gap-1' : 'text-[12px] font-semibold px-2.5 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${sizeClasses}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
