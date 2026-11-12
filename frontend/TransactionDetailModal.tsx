import React, { useState } from 'react';
import { usePayGuard } from '../../context/PayGuardContext';
import { Transaction } from '../../types';
import { Modal } from '../common/Modal';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import {
  ShieldCheck,
  Clock,
  FileCode,
  User,
  Calendar,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const { addToast } = usePayGuard();
  const [showRawPayload, setShowRawPayload] = useState(false);

  if (!transaction) return null;

  return (
    <Modal
      isOpen={!!transaction}
      onClose={onClose}
      title="Transaction Security Audit"
      subtitle={`Reference: ${transaction.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top summary card */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Transaction Total
            </span>
            <div className="text-[28px] sm:text-[30px] font-bold text-slate-900 dark:text-white font-mono mt-1 leading-none tracking-tight">
              ${transaction.amount.toFixed(2)}{' '}
              <span className="text-[13px] font-sans font-normal text-slate-500 dark:text-slate-400">
                {transaction.currency}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={transaction.riskLevel} score={transaction.riskScore} size="lg" />
            <StatusBadge status={transaction.status} size="md" />
          </div>
        </div>

        {/* Sender details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Merchant / Sender</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-[14px]">{transaction.sender}</p>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-[12px] mt-0.5 font-normal">{transaction.senderEmail}</p>
            <div className="mt-2 text-[12px] text-slate-500 dark:text-slate-400 font-normal">
              Channel: <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase font-mono">{transaction.source}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Timestamp & Category</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-[14px]">{transaction.date}</p>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-[13px] font-normal">Category: <span className="font-semibold">{transaction.category}</span></p>
            <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic text-[12px] font-normal">"{transaction.description}"</p>
          </div>
        </div>

        {/* AI Plain-Language Explanation */}
        <div className="p-4 rounded-xl bg-slate-900 dark:bg-[#070D1F] text-slate-200 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[14px] font-semibold uppercase tracking-wider text-emerald-400">
              PayGuard AI Risk Breakdown
            </h4>
          </div>
          <p className="text-[14px] font-normal leading-relaxed text-slate-300">
            {transaction.explanation ||
              `PayGuard evaluated this transaction with a risk score of ${transaction.riskScore}/100 based on sender domain age, invoice text pattern analysis, and historical payment baselines.`}
          </p>

          {/* Fraud signals tags */}
          {transaction.signals && transaction.signals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="text-[11px] uppercase font-medium text-slate-400 mb-2">
                Detected Behavioral Signatures:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {transaction.signals.map((sig, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Audit Trail */}
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Immutable Audit Log</span>
          </h4>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 max-h-40 overflow-y-auto">
            {transaction.auditLog.map((log, index) => (
              <div key={index} className="text-[13px] flex items-start justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/80 last:border-0 last:pb-0">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{log.action}</span>
                  <div className="text-[12px] font-normal text-slate-500 dark:text-slate-400">By: {log.actor}</div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Payload toggle */}
        <div>
          <button
            onClick={() => setShowRawPayload(!showRawPayload)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{showRawPayload ? 'Hide' : 'View'} PayPal Webhook Payload (JSON)</span>
          </button>
          {showRawPayload && (
            <pre className="mt-2 p-3 bg-slate-950 text-emerald-400 rounded-xl text-[12px] font-mono overflow-x-auto max-w-full max-h-48 border border-slate-800">
{JSON.stringify(
  {
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource_type: 'capture',
    id: `WH-${transaction.id}`,
    create_time: transaction.date,
    resource: {
      id: transaction.id,
      amount: {
        value: transaction.amount.toFixed(2),
        currency_code: transaction.currency,
      },
      seller_protection: {
        status: transaction.riskScore > 60 ? 'ELIGIBLE_WITH_CONDITIONS' : 'ELIGIBLE',
      },
      payguard_extension: {
        risk_score: transaction.riskScore,
        decision: transaction.status.toUpperCase(),
        signals: transaction.signals,
      },
    },
  },
  null,
  2
)}
            </pre>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addToast('Receipt Exported', `Audit reference for ${transaction.id} saved to clipboard.`, 'info');
              onClose();
            }}
          >
            Copy Audit Reference
          </Button>
        </div>
      </div>
    </Modal>
  );
};
