import React from 'react';
import { usePayGuard } from '../../context/PayGuardContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = usePayGuard();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
  };

  const borderStyles = {
    success: 'border-emerald-200 dark:border-emerald-800/80 bg-white/95 dark:bg-[#0B132B]/95',
    error: 'border-rose-200 dark:border-rose-800/80 bg-white/95 dark:bg-[#0B132B]/95',
    warning: 'border-amber-200 dark:border-amber-800/80 bg-white/95 dark:bg-[#0B132B]/95',
    info: 'border-blue-200 dark:border-blue-800/80 bg-white/95 dark:bg-[#0B132B]/95',
  };

  return (
    <div className="fixed bottom-4 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-4 ${
            borderStyles[toast.type]
          }`}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-slate-900 dark:text-white leading-snug">{toast.title}</h4>
            <p className="text-[12px] font-normal text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
