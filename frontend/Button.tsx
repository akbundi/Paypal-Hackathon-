import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-slate-900 dark:bg-electric-600 text-white hover:bg-slate-800 dark:hover:bg-electric-500 focus:ring-slate-900 dark:focus:ring-electric-500 shadow-sm border border-slate-900 dark:border-electric-500',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-300 dark:focus:ring-slate-700 border border-slate-200 dark:border-slate-700',
    danger:
      'bg-rose-600 dark:bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-500 focus:ring-rose-500 shadow-sm shadow-rose-500/20',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm shadow-emerald-500/20',
    outline:
      'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-slate-300 dark:focus:ring-slate-700 shadow-soft-sm',
    ghost:
      'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:ring-slate-200 dark:focus:ring-slate-700',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-[12.5px] sm:text-[13px] gap-1.5',
    md: 'px-3.5 py-2 text-[13px] sm:text-[14px] gap-2',
    lg: 'px-4.5 py-2.5 text-[14px] font-semibold gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};
