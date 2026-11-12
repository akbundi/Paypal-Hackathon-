import React, { useState, useEffect } from 'react';
import { SpendingRule } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<SpendingRule, 'id' | 'createdAt'>) => void;
  initialRule?: SpendingRule | null;
}

export const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [maxPerTx, setMaxPerTx] = useState('50');
  const [maxPerWeek, setMaxPerWeek] = useState('150');
  const [requireApprovalOver, setRequireApprovalOver] = useState('40');
  const [isActive, setIsActive] = useState(true);

  const categories = [
    'Groceries',
    'Electronics',
    'Digital Goods',
    'SaaS & Software',
    'Books & Learning',
    'Travel & Rides',
    'Office Supplies',
    'High-Risk Services',
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name);
      setCategory(initialRule.category);
      setMaxPerTx(initialRule.maxPerTx.toString());
      setMaxPerWeek(initialRule.maxPerWeek.toString());
      setRequireApprovalOver(initialRule.requireApprovalOver.toString());
      setIsActive(initialRule.isActive);
    } else {
      setName('');
      setCategory('Groceries');
      setMaxPerTx('50');
      setMaxPerWeek('150');
      setRequireApprovalOver('40');
      setIsActive(true);
    }
    setErrors({});
  }, [initialRule, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Rule name is required.';
    }
    const txNum = parseFloat(maxPerTx);
    if (isNaN(txNum) || txNum <= 0) {
      newErrors.maxPerTx = 'Transaction limit must be greater than $0.';
    }
    const weekNum = parseFloat(maxPerWeek);
    if (isNaN(weekNum) || weekNum <= 0) {
      newErrors.maxPerWeek = 'Weekly limit must be greater than $0.';
    }
    const apprNum = parseFloat(requireApprovalOver);
    if (isNaN(apprNum) || apprNum < 0) {
      newErrors.requireApprovalOver = 'Approval threshold must be a valid amount ($0 or more).';
    } else if (!isNaN(txNum) && apprNum > txNum) {
      newErrors.requireApprovalOver = 'Approval threshold cannot exceed the per-transaction limit.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      category,
      maxPerTx: parseFloat(maxPerTx) || 0,
      maxPerWeek: parseFloat(maxPerWeek) || 0,
      requireApprovalOver: parseFloat(requireApprovalOver) || 0,
      isActive,
      allowedAgents: ['ShopBot Assistant', 'AutoProcure Bot v2'],
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRule ? 'Edit Spending Rule' : 'New AI Spending Guardrail'}
      subtitle="Define category spending limits and two-party approval thresholds."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Rule Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g., Weekly Groceries Budget"
            className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
          />
          {errors.name && <p className="text-[12px] text-coral-600 dark:text-coral-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Max Per Tx ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={maxPerTx}
              onChange={(e) => {
                setMaxPerTx(e.target.value);
                if (errors.maxPerTx) setErrors((prev) => ({ ...prev, maxPerTx: '' }));
              }}
              className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white font-mono"
            />
            {errors.maxPerTx && <p className="text-[12px] text-coral-600 dark:text-coral-400 mt-1">{errors.maxPerTx}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Max Per Week ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={maxPerWeek}
              onChange={(e) => {
                setMaxPerWeek(e.target.value);
                if (errors.maxPerWeek) setErrors((prev) => ({ ...prev, maxPerWeek: '' }));
              }}
              className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white font-mono"
            />
            {errors.maxPerWeek && <p className="text-[12px] text-coral-600 dark:text-coral-400 mt-1">{errors.maxPerWeek}</p>}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Require Trusted Approval Over ($)
          </label>
          <input
            type="number"
            step="0.01"
            required
            min="0"
            value={requireApprovalOver}
            onChange={(e) => {
              setRequireApprovalOver(e.target.value);
              if (errors.requireApprovalOver) setErrors((prev) => ({ ...prev, requireApprovalOver: '' }));
            }}
            placeholder="Amounts above this trigger family circle review"
            className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white font-mono"
          />
          {errors.requireApprovalOver ? (
            <p className="text-[12px] text-coral-600 dark:text-coral-400 mt-1">{errors.requireApprovalOver}</p>
          ) : (
            <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-1">
              Purchases between this limit and max per tx will be held for manual confirmation.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="ruleActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
          />
          <label htmlFor="ruleActive" className="text-[13px] font-normal text-slate-700 dark:text-slate-300">
            Rule is active and currently enforced
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {initialRule ? 'Save Changes' : 'Create Guardrail'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
