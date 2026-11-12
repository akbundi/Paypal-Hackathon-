import React from 'react';
import { usePayGuard } from '../../context/PayGuardContext';
import { ActiveTab } from '../../types';
import {
  ShieldCheck,
  LayoutDashboard,
  ShieldAlert,
  History,
  Bot,
  Users2,
  Settings,
  Power,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    pendingApprovals,
    agentPurchasesEnabled,
    setAgentPurchasesEnabled,
    t,
    addToast,
  } = usePayGuard();

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'overview',
      label: t.nav.overview,
      icon: LayoutDashboard,
    },
    {
      id: 'scam-detection',
      label: t.nav.scamDetection,
      icon: ShieldAlert,
      badge: 'AI Scan',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'transactions',
      label: t.nav.transactions,
      icon: History,
    },
    {
      id: 'spending-guard',
      label: t.nav.spendingGuard,
      icon: Bot,
      badge: agentPurchasesEnabled ? 'Active' : 'Halted',
      badgeColor: agentPurchasesEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
    },
    {
      id: 'trusted-circle',
      label: t.nav.trustedCircle,
      icon: Users2,
      badge: pendingApprovals.length > 0 ? pendingApprovals.length : undefined,
      badgeColor: 'bg-amber-500 text-slate-900 font-bold',
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const handleToggleAgentSafety = () => {
    const next = !agentPurchasesEnabled;
    setAgentPurchasesEnabled(next);
    addToast(
      next ? 'AI Purchases Enabled' : 'AI Purchases Suspended',
      next
        ? 'AI shopping agents can initiate verified transactions within your guardrail limits.'
        : 'Emergency halt active: All autonomous agent checkout requests are blocked.',
      next ? 'info' : 'warning'
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-950 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-semibold text-white tracking-tight">PayGuard</span>
                <span className="text-[11px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium">
                  v2.4
                </span>
              </div>
              <p className="text-[12px] text-slate-400 font-normal">Payment AI Security</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Platform Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Agent Master Kill-Switch Card */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Power className={`w-3.5 h-3.5 ${agentPurchasesEnabled ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-[13px] font-medium text-slate-200">AI Agent Guard</span>
            </div>
            <button
              onClick={handleToggleAgentSafety}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                agentPurchasesEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  agentPurchasesEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[12px] text-slate-400 font-normal leading-tight">
            {agentPurchasesEnabled
              ? 'Autonomous agent checkouts restricted to active rules.'
              : 'Emergency kill-switch: all agent requests are blocked.'}
          </p>
        </div>

        {/* PayPal Sandbox Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] font-medium text-slate-300">PayPal Sandbox</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-medium">
              REST v2 OK
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono truncate font-normal">
            webhook: /v1/paypal-intercept
          </p>
        </div>
      </aside>
    </>
  );
};
