import React, { useState } from 'react';
import { usePayGuard } from '../context/PayGuardContext';
import { SpendingRule } from '../types';
import { RuleModal } from '../components/spending/RuleModal';
import { SimulatorModal } from '../components/spending/SimulatorModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import {
  Bot,
  Plus,
  Power,
  CheckCircle2,
  Ban,
  Clock,
  Edit2,
  Trash2,
  Play,
} from 'lucide-react';

export const SpendingGuard: React.FC = () => {
  const {
    t,
    spendingRules,
    stats,
    agentPurchases,
    agentPurchasesEnabled,
    setAgentPurchasesEnabled,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    addToast,
  } = usePayGuard();

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SpendingRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<SpendingRule | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const budgetUsed = stats.agentSpentThisWeek;
  const budgetTotal = stats.agentWeeklyBudget;
  const budgetRemaining = Math.max(0, budgetTotal - budgetUsed);
  const budgetPercent = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100));

  const handleOpenAdd = () => {
    setEditingRule(null);
    setIsRuleModalOpen(true);
  };

  const handleOpenEdit = (rule: SpendingRule) => {
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (ruleData: Omit<SpendingRule, 'id' | 'createdAt'>) => {
    if (editingRule) {
      updateRule(editingRule.id, ruleData);
    } else {
      addRule(ruleData);
    }
  };

  const handleToggleAgentSafety = () => {
    const next = !agentPurchasesEnabled;
    setAgentPurchasesEnabled(next);
    addToast(
      next ? 'AI Agent Spending Active' : 'AI Agent Spending Suspended',
      next
        ? 'Autonomous agents can now place orders within configured rule constraints.'
        : 'Emergency halt active: All agent requests will be automatically blocked.',
      next ? 'info' : 'warning'
    );
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-trust-50 dark:bg-trust-950/70 text-trust-700 dark:text-trust-300 text-[11px] font-mono font-medium uppercase tracking-wider mb-2 border border-trust-200/80 dark:border-trust-800">
            <Bot className="w-3.5 h-3.5 text-trust-600 dark:text-trust-400" />
            <span>Autonomous Agent Policy Guardrails</span>
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t.spendingGuard.title}
          </h1>
          <p className="text-[14px] font-normal text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
            {t.spendingGuard.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSimulatorOpen(true)}
            leftIcon={<Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            className="font-semibold"
          >
            Test Agent Purchase
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-semibold"
          >
            {t.spendingGuard.addRule}
          </Button>
        </div>
      </div>

      {/* Emergency Kill-Switch & Budget Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Weekly Budget Gauge (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Weekly Spending Allowance
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-[28px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-mono leading-none tracking-tight">
                  ${budgetUsed.toFixed(2)}
                </span>
                <span className="text-[13px] font-normal text-slate-500 dark:text-slate-400">
                  spent of <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">${budgetTotal.toFixed(2)}</span> limit
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Remaining Budget
              </span>
              <div className="text-[28px] sm:text-[32px] font-bold text-emerald-600 dark:text-emerald-400 font-mono leading-none tracking-tight mt-1.5">
                ${budgetRemaining.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  budgetPercent > 85
                    ? 'bg-coral-500'
                    : budgetPercent > 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 font-normal">
              <span>0%</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{budgetPercent}% Cap Consumed</span>
              <span className="font-mono">100% (${budgetTotal.toFixed(2)})</span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 gap-2 font-normal">
            <span>
              Resets automatically every Monday 00:00 UTC via PayPal API sync.
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Active Protection: Enabled
            </span>
          </div>
        </div>

        {/* Master AI Kill Switch (1 Col) */}
        <div
          className={`rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-all shadow-soft-sm ${
            agentPurchasesEnabled
              ? 'bg-navy-950 dark:bg-[#070D1E] text-white border-slate-800'
              : 'bg-rose-950 text-white border-rose-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className={`w-4.5 h-4.5 ${agentPurchasesEnabled ? 'text-emerald-400' : 'text-rose-400'}`} />
                <h3 className="text-[18px] font-bold tracking-tight">
                  {t.spendingGuard.agentToggle}
                </h3>
              </div>
              <button
                onClick={handleToggleAgentSafety}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  agentPurchasesEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    agentPurchasesEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[13.5px] text-slate-300 dark:text-slate-300 font-normal mt-2.5 leading-normal">
              {t.spendingGuard.agentToggleDesc}
            </p>
          </div>

          <div className="mt-6 pt-3.5 border-t border-white/10 flex items-center justify-between text-[12px] font-normal">
            <span className="text-slate-400">Current Status:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                agentPurchasesEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {agentPurchasesEnabled ? 'ACTIVE & ENFORCED' : 'EMERGENCY HALT'}
            </span>
          </div>
        </div>
      </div>

      {/* Rules List Section */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-soft-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
              {t.spendingGuard.rulesList}
            </h3>
            <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
              Category ceilings, per-transaction limits, and two-party escalation rules.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-semibold"
          >
            Add New Rule
          </Button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {spendingRules.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-400 font-normal">
              No spending rules configured. Click "Add New Rule" to create guardrails.
            </div>
          ) : (
            spendingRules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rule.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <h4 className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{rule.name}</h4>
                    <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {rule.category}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal">
                    Max per transaction:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono font-medium">${rule.maxPerTx.toFixed(2)}</strong>
                    {' • '}
                    Weekly ceiling:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono font-medium">${rule.maxPerWeek.toFixed(2)}</strong>
                    {rule.requireApprovalOver > 0 && (
                      <>
                        {' • '}
                        Requires approval above:{' '}
                        <strong className="text-amber-600 dark:text-amber-400 font-mono font-medium">
                          ${rule.requireApprovalOver.toFixed(2)}
                        </strong>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors border ${
                      rule.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Rule"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setRuleToDelete(rule)}
                    className="p-1.5 text-slate-400 hover:text-coral-600 dark:hover:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-950/40 rounded-lg transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Agent Purchase History Log */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-soft-sm overflow-hidden w-full min-w-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
              {t.spendingGuard.recentAgentPurchases}
            </h3>
            <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live audit trail of purchase requests made by autonomous agents.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSimulatorOpen(true)}
            leftIcon={<Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            className="font-semibold"
          >
            Simulate Purchase
          </Button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] sm:text-[12px] font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Product / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Rule Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px] font-normal">
              {agentPurchases.map((pur) => (
                <tr key={pur.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-trust-600 dark:text-trust-400" />
                    <span>{pur.agentName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                    {pur.productName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-normal">{pur.category}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[14px] text-slate-900 dark:text-white">
                    ${pur.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[12px] font-normal">
                    {pur.timestamp}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium uppercase font-mono ${
                        pur.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : pur.status === 'blocked'
                          ? 'bg-coral-50 dark:bg-coral-950/60 text-coral-700 dark:text-coral-300 border border-coral-200 dark:border-coral-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {pur.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {pur.status === 'blocked' && <Ban className="w-3 h-3" />}
                      {pur.status === 'held' && <Clock className="w-3 h-3" />}
                      <span>{pur.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-[12px] font-normal max-w-md">
                    {pur.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={() => {
          if (ruleToDelete) {
            deleteRule(ruleToDelete.id);
            addToast('Rule Deleted', `Spending policy "${ruleToDelete.name}" was removed.`, 'info');
          }
        }}
        title="Delete Spending Rule"
        message={`Are you sure you want to delete the spending rule "${ruleToDelete?.name}"? AI agent purchases in category "${ruleToDelete?.category}" will no longer be checked against this limit.`}
        confirmLabel="Delete Rule"
        variant="danger"
      />
    </div>
  );
};
