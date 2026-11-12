import React from 'react';
import { usePayGuard } from '../../context/PayGuardContext';
import { ActiveTab } from '../../types';
import { APP_CONTAINER_CLASS } from '../../constants/layout';
import { ShieldCheck, Lock, Cpu, Layers, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab } = usePayGuard();

  const handleNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] text-slate-600 dark:text-slate-400 transition-colors duration-200 w-full min-w-0">
      <div className={`${APP_CONTAINER_CLASS} py-8 lg:py-10`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-trust-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <span className="font-bold text-[17px] tracking-tight text-slate-900 dark:text-white">
                PayGuard
              </span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Sandbox v2.4
              </span>
            </div>

            <p className="text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400 max-w-sm">
              Payment security platform designed to protect users from deceptive invoice scams and unconstrained autonomous AI shopping agent spending.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[12px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>PayPal Sandbox REST v2 • Active Policy Guardrails</span>
            </div>
          </div>

          {/* Navigation links */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <button
                  onClick={() => handleNav('overview')}
                  className="hover:text-trust-600 dark:hover:text-trust-400 transition-colors text-left"
                >
                  Security Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('scam-detection')}
                  className="hover:text-trust-600 dark:hover:text-trust-400 transition-colors text-left"
                >
                  AI Fraud Detection
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('transactions')}
                  className="hover:text-trust-600 dark:hover:text-trust-400 transition-colors text-left"
                >
                  Transactions Audit
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('spending-guard')}
                  className="hover:text-trust-600 dark:hover:text-trust-400 transition-colors text-left"
                >
                  AI Spending Guard
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('trusted-circle')}
                  className="hover:text-trust-600 dark:hover:text-trust-400 transition-colors text-left"
                >
                  Trusted Circle Approvals
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('settings')}
                  className="hover:text-trust-600 dark:hover:text-trust-400 transition-colors text-left"
                >
                  System Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Security Architecture */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Security Architecture
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Zero-Trust Interception</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Configured Model Reasoning</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>24-Hour Temporary Escrow</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Agent Purchase Guardrails</span>
              </li>
            </ul>
          </div>

          {/* Development Team */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Development
            </h4>
            <div className="space-y-2.5 text-[13px]">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  Verified Team
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  PayGuard Security Engineering
                </span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Payment Fraud Prevention & Agent Guardrails
                </span>
              </div>

              <div className="text-[12px] text-slate-400 dark:text-slate-500">
                Stack: React • TypeScript • Vite • Tailwind
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-slate-500 dark:text-slate-400">
          <div>
            © 2026 PayGuard Security Inc. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="font-mono text-[11px]">Sandbox Environment</span>
            <span>•</span>
            <span>Your money. Your rules. Your protection.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
