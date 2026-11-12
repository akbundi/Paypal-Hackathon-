import React from 'react';
import { AlertCircle, RefreshCw, Loader2, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface ApiStateWrapperProps {
  isLoading?: boolean;
  error?: Error | string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ApiStateWrapper: React.FC<ApiStateWrapperProps> = ({
  isLoading,
  error,
  isEmpty,
  emptyTitle = 'No data available',
  emptyMessage = 'There are currently no records to display.',
  loadingMessage = 'Loading data from server...',
  onRetry,
  children,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`p-8 text-center bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-soft-sm ${className}`}>
        <Loader2 className="w-7 h-7 text-trust-600 dark:text-trust-400 animate-spin mx-auto mb-3" />
        <p className="text-[13.5px] font-medium text-slate-700 dark:text-slate-300">
          {loadingMessage}
        </p>
      </div>
    );
  }

  if (error) {
    const errorText = typeof error === 'string' ? error : error.message;
    return (
      <div className={`p-5 bg-coral-50/80 dark:bg-coral-950/40 border border-coral-200 dark:border-coral-900/60 rounded-xl text-coral-950 dark:text-coral-200 shadow-soft-sm ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-coral-600 dark:text-coral-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-coral-900 dark:text-coral-200">
              Unable to load data
            </h4>
            <p className="text-[13px] text-coral-800 dark:text-coral-300 mt-1 break-words">
              {errorText}
            </p>
            {onRetry && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Request
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 ${className}`}>
        <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
          {emptyTitle}
        </p>
        <p className="text-[12px] font-normal text-slate-400 dark:text-slate-500 mt-1">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
