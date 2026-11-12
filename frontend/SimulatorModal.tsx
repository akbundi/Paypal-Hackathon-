import React, { useState } from 'react';
import { usePayGuard } from '../../context/PayGuardContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { verifyAgentPurchase } from '../../services/payguardService';
import { CheckCircle2, Ban, Clock, Bot } from 'lucide-react';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose }) => {
  const {
    spendingRules,
    stats,
    agentPurchasesEnabled,
    recordAgentPurchaseItem,
    addToast,
  } = usePayGuard();

  const [agentName, setAgentName] = useState('ShopBot Assistant');
  const [productName, setProductName] = useState('Anker USB-C Fast Charger & Cable 65W');
  const [category, setCategory] = useState('Electronics');
  const [amount, setAmount] = useState('32.99');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'approved' | 'blocked' | 'held';
    reason: string;
    productName: string;
    amount: number;
    category: string;
    remainingBudgetAfter: number;
  } | null>(null);

  const samplePresets = [
    {
      label: 'Safe Groceries ($24.50)',
      agent: 'KitchenAI',
      product: 'Organic Eggs & Whole Grain Bread',
      category: 'Groceries',
      amount: '24.50',
    },
    {
      label: 'Over-Limit Electronics ($189.00)',
      agent: 'AutoProcure Bot v2',
      product: 'Sony Noise-Cancelling Headphones',
      category: 'Electronics',
      amount: '189.00',
    },
    {
      label: 'Approval-Threshold Item ($55.00)',
      agent: 'ShopBot Assistant',
      product: 'Bialetti Espresso Maker',
      category: 'Groceries',
      amount: '55.00',
    },
    {
      label: 'High-Risk Crypto Item ($500.00)',
      agent: 'TradingAgent-X',
      product: 'Hardware Wallet Voucher',
      category: 'High-Risk Services',
      amount: '500.00',
    },
  ];

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const purchaseAmount = parseFloat(amount) || 0;

    // Check emergency kill switch
    if (!agentPurchasesEnabled) {
      setVerificationResult({
        status: 'blocked',
        reason: 'BLOCKED: All autonomous AI agent purchases are globally suspended via the Emergency Kill-Switch.',
        productName,
        amount: purchaseAmount,
        category,
        remainingBudgetAfter: Math.max(0, stats.agentWeeklyBudget - stats.agentSpentThisWeek),
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await verifyAgentPurchase(
        {
          agentName,
          productName,
          category,
          amount: purchaseAmount,
        },
        spendingRules,
        stats.agentSpentThisWeek,
        stats.agentWeeklyBudget
      );

      const remainingBudgetAfter = Math.max(0, stats.agentWeeklyBudget - res.updatedWeeklySpent);

      setVerificationResult({
        status: res.status,
        reason: res.reason,
        productName,
        amount: purchaseAmount,
        category,
        remainingBudgetAfter,
      });

      // Record in system
      recordAgentPurchaseItem(res.newPurchase, purchaseAmount);

      if (res.status === 'approved') {
        addToast(
          'Agent Purchase Approved',
          `$${purchaseAmount.toFixed(2)} for ${productName} validated and logged.`,
          'success'
        );
      } else if (res.status === 'blocked') {
        addToast(
          'Agent Purchase Blocked',
          res.reason,
          'error'
        );
      } else {
        addToast(
          'Purchase Held for Approval',
          res.reason,
          'warning'
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectPreset = (p: typeof samplePresets[0]) => {
    setAgentName(p.agent);
    setProductName(p.product);
    setCategory(p.category);
    setAmount(p.amount);
    setVerificationResult(null);
  };

  const remainingBudget = Math.max(0, stats.agentWeeklyBudget - stats.agentSpentThisWeek);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent Purchase Verification Simulator"
      subtitle="Simulate real-time rule engine authorization for autonomous AI shoppers."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Presets */}
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
            Load Quick Scenario
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePresets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 text-[12px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSimulate} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                AI Agent Client
              </label>
              <input
                type="text"
                required
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
              >
                <option value="Groceries">Groceries</option>
                <option value="Electronics">Electronics</option>
                <option value="Digital Goods">Digital Goods</option>
                <option value="SaaS & Software">SaaS & Software</option>
                <option value="High-Risk Services">High-Risk Services</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Current Budget context */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-[12px]">
            <span className="text-slate-500 dark:text-slate-400 font-normal">Current Weekly Available Budget:</span>
            <span className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              ${remainingBudget.toFixed(2)} / ${stats.agentWeeklyBudget.toFixed(2)}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isVerifying}
            leftIcon={<Bot className="w-4 h-4" />}
          >
            {isVerifying ? 'Evaluating Safety Guardrails...' : 'Run Purchase Verification Check'}
          </Button>
        </form>

        {/* Verification Result Display */}
        {verificationResult && (
          <div
            className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${
              verificationResult.status === 'approved'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : verificationResult.status === 'blocked'
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {verificationResult.status === 'approved' && (
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              {verificationResult.status === 'blocked' && (
                <div className="p-2 rounded-xl bg-rose-600 text-white shadow-md">
                  <Ban className="w-6 h-6" />
                </div>
              )}
              {verificationResult.status === 'held' && (
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md">
                  <Clock className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      verificationResult.status === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : verificationResult.status === 'blocked'
                        ? 'bg-rose-700 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    STATUS: {verificationResult.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-[16px] font-semibold">
                    ${verificationResult.amount.toFixed(2)}
                  </span>
                </div>

                <h4 className="text-[14px] font-semibold mt-1.5">{verificationResult.productName}</h4>
                <p className="text-[13px] font-normal mt-1 leading-relaxed opacity-90">{verificationResult.reason}</p>

                <div className="mt-3 pt-3 border-t border-current/15 flex items-center justify-between text-[12px]">
                  <span className="font-normal">Remaining Weekly Budget:</span>
                  <span className="font-mono text-[13px] font-semibold">
                    ${verificationResult.remainingBudgetAfter.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
