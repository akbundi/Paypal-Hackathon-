import React from 'react';
import { usePayGuard } from '../context/PayGuardContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import {
  Bot,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ScanSearch,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const {
    t,
    stats,
    transactions,
    pendingApprovals,
    setActiveTab,
    setSelectedTransaction,
    theme,
  } = usePayGuard();

  // Weekly spending chart data (AI Agent vs Safe manual volume)
  const weeklySpendingData = [
    { day: 'Mon', agent: 18.5, manual: 120.0 },
    { day: 'Tue', agent: 32.0, manual: 85.0 },
    { day: 'Wed', agent: 12.0, manual: 140.0 },
    { day: 'Thu', agent: 28.0, manual: 65.0 },
    { day: 'Fri', agent: 45.0, manual: 210.0 },
    { day: 'Sat', agent: 22.0, manual: 95.0 },
    { day: 'Sun', agent: 15.0, manual: 75.0 },
  ];

  const fraudDistributionData = [
    { name: 'Fake Urgency & Renewal Traps', count: 16, share: '43%' },
    { name: 'Domain & Sender Mismatch', count: 11, share: '30%' },
    { name: 'Over-Limit Agent Spends', count: 6, share: '16%' },
    { name: 'Off-Platform Coercion (Phone/Wire)', count: 4, share: '11%' },
  ];

  const budgetRemaining = Math.max(0, stats.agentWeeklyBudget - stats.agentSpentThisWeek);
  const budgetPercent = Math.min(
    100,
    Math.round((stats.agentSpentThisWeek / stats.agentWeeklyBudget) * 100)
  );

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
            <span className="text-[11px] font-mono uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              Workspace: Demo Sandbox
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PayPal REST v2 Connected
            </span>
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t.overview.title}
          </h1>
          <p className="text-[14px] font-normal text-slate-600 dark:text-slate-400 mt-1 leading-normal">
            Real-time inspection of payment requests, heuristic scam evaluations, and autonomous shopping agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('spending-guard')}
            leftIcon={<Bot className="w-4 h-4 text-slate-500" />}
          >
            Spending Guard
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('scam-detection')}
            leftIcon={<ScanSearch className="w-4 h-4" />}
          >
            Analyze Invoice
          </Button>
        </div>
      </div>

      {/* Actionable Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13.5px] min-w-0 shadow-xs">
          <div className="flex items-center gap-3 text-amber-950 dark:text-amber-200 min-w-0">
            <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="leading-normal">
              <strong className="font-bold">{pendingApprovals.length} payment requests</strong> require Trusted Circle review before escrow release.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('trusted-circle')}
            className="text-amber-800 dark:text-amber-300 hover:underline font-semibold text-[13px] flex items-center gap-1 self-start sm:self-auto flex-shrink-0"
          >
            <span>Review Pending Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Core Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Protected Volume */}
        <div
          onClick={() => setActiveTab('transactions')}
          className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:border-trust-400/60 dark:hover:border-trust-500/60 transition-all cursor-pointer min-w-0 group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[13px] sm:text-[14px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight truncate">
              Evaluated Payment Volume
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded flex-shrink-0 ml-1">
              Sandbox
            </span>
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-mono leading-none tracking-tight">
            ${stats.totalProtectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 gap-1 font-normal">
            <span className="truncate">{stats.protectedCount} verified transactions</span>
            <span className="text-trust-600 dark:text-trust-400 font-semibold inline-flex items-center gap-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>View Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Intercepted Scams */}
        <div
          onClick={() => setActiveTab('scam-detection')}
          className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:border-coral-400/60 dark:hover:border-coral-500/60 transition-all cursor-pointer min-w-0 group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[13px] sm:text-[14px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight truncate">
              Flagged Scam Attempts
            </span>
            <span className="text-[11px] font-mono font-semibold text-coral-700 dark:text-coral-300 bg-coral-50 dark:bg-coral-950/60 px-2 py-0.5 rounded border border-coral-200/60 dark:border-coral-800/60 flex-shrink-0 ml-1">
              Action Required
            </span>
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-mono leading-none tracking-tight">
            {stats.scamsDetectedCount}
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 gap-1 font-normal">
            <span className="truncate">${stats.moneySavedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} potential loss prevented</span>
            <span className="text-trust-600 dark:text-trust-400 font-semibold inline-flex items-center gap-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Analyzer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: AI Agent Spending */}
        <div
          onClick={() => setActiveTab('spending-guard')}
          className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-400/60 dark:hover:border-emerald-500/60 transition-all cursor-pointer min-w-0 sm:col-span-2 lg:col-span-1 group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[13px] sm:text-[14px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight truncate">
              AI Agent Weekly Budget
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 flex-shrink-0 ml-1">
              Cap: ${stats.agentWeeklyBudget.toFixed(2)}
            </span>
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-mono leading-none tracking-tight">
            ${stats.agentSpentThisWeek.toFixed(2)}
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 gap-1 font-normal">
            <span className="truncate">${budgetRemaining.toFixed(2)} available ({budgetPercent}% used)</span>
            <span className="text-trust-600 dark:text-trust-400 font-semibold inline-flex items-center gap-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Rules</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Signature Feature: Quick Invoice Risk Assessment Teaser */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
                Invoice & Payment Request Risk Analyzer
              </span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-trust-50 text-trust-700 dark:bg-trust-950/60 dark:text-trust-300 border border-trust-200 dark:border-trust-800">
                Signature Feature
              </span>
            </div>
            <p className="text-[14px] text-slate-600 dark:text-slate-400 max-w-2xl leading-normal">
              Evaluate invoice text, sender domain discrepancies, artificial deadlines, and price anchors before authorizing fund transfer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('scam-detection')}
            >
              GeekSquad Scam ($499.99)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('scam-detection')}
            >
              Urgent Wire ($4,850)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('scam-detection')}
              leftIcon={<ScanSearch className="w-4 h-4" />}
            >
              Open Full Analyzer
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Section: Weekly Volume & Fraud Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Weekly Volume Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
                7-Day Transaction Volume
              </h3>
              <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
                Safe manual transactions vs. autonomous AI shopping agent orders.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-trust-600" />
                <span>Manual Checkout ($)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>AI Agent Checkout ($)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySpendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="manualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="agentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-[12px] shadow-sm border border-slate-800">
                          <p className="font-semibold text-slate-300">{label}</p>
                          <div className="mt-1 space-y-0.5 font-mono">
                            <p className="text-trust-300">
                              Manual: <span className="font-bold">${payload[0]?.value}</span>
                            </p>
                            <p className="text-emerald-400">
                              AI Agent: <span className="font-bold">${payload[1]?.value}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="manual" stroke="#2563EB" strokeWidth={1.5} fillOpacity={1} fill="url(#manualGrad)" />
                <Area type="monotone" dataKey="agent" stroke="#10B981" strokeWidth={1.75} fillOpacity={1} fill="url(#agentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flagged Threat Categories (1 Col) */}
        <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between w-full min-w-0">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
                Intercepted Threat Vectors
              </h3>
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                37 total
              </span>
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 mb-4">
              Breakdown of scam patterns detected in sandbox invoices.
            </p>

            <div className="space-y-3.5">
              {fraudDistributionData.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{item.share}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-coral-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-trust-600' : 'bg-slate-400'
                      }`}
                      style={{ width: item.share }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[12px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="font-medium">Heuristic Engine: <span className="text-emerald-600 dark:text-emerald-400">Operational</span></span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-trust-600 dark:text-trust-400 hover:underline font-semibold"
            >
              Model Settings →
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Recent Invoices & Protected Transactions Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden w-full min-w-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Recent Invoices & Transactions
            </h3>
            <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
              Simulated PayPal Sandbox captures evaluated against scam and spending policies.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('transactions')}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            className="flex-shrink-0 font-semibold"
          >
            All Transactions
          </Button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] sm:text-[12px] font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Sender / Merchant</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px] font-normal">
              {recentTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {tx.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{tx.sender}</div>
                    <div className="text-[12px] font-normal text-slate-400 dark:text-slate-500 font-mono truncate max-w-xs">
                      {tx.senderEmail}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[14px] text-slate-900 dark:text-white">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[12px] font-normal">
                    {tx.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={tx.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-trust-600 dark:text-trust-400 font-medium group-hover:underline inline-flex items-center gap-0.5 text-[13px]">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
