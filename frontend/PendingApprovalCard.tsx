import React, { useState } from 'react';
import { PendingApproval } from '../../types';
import { usePayGuard } from '../../context/PayGuardContext';
import { RiskBadge } from '../common/RiskBadge';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShieldAlert, CheckCircle2, Ban, Clock, UserCheck } from 'lucide-react';

interface PendingApprovalCardProps {
  approval: PendingApproval;
}

export const PendingApprovalCard: React.FC<PendingApprovalCardProps> = ({ approval }) => {
  const { approvePendingApproval, rejectPendingApproval } = usePayGuard();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approvePendingApproval(approval.id);
    } finally {
      setIsApproving(false);
      setActionConfirm(null);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectPendingApproval(approval.id);
    } finally {
      setIsRejecting(false);
      setActionConfirm(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-amber-200/90 dark:border-amber-800/80 shadow-soft-sm p-5 hover:border-amber-300 dark:hover:border-amber-700 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded font-medium">
              Escrow Hold Active (24h)
            </span>
            <h4 className="text-[14px] font-bold text-slate-900 dark:text-white mt-1">{approval.title}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Amount</span>
            <span className="text-[28px] sm:text-[30px] font-bold text-slate-900 dark:text-white font-mono leading-none tracking-tight">
              ${approval.amount.toFixed(2)}
            </span>
          </div>
          <RiskBadge level={approval.riskLevel} score={approval.riskScore} size="sm" />
        </div>
      </div>

      <div className="py-3.5 space-y-2">
        <div className="text-[13px] font-normal text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Sender: <strong className="text-slate-900 dark:text-slate-100 font-medium">{approval.sender}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>
            Requested: <strong className="text-slate-700 dark:text-slate-300 font-mono font-medium text-[12px]">{approval.requestedAt}</strong>
          </span>
        </div>

        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-lg border border-amber-200/60 dark:border-amber-800/60 text-[13px] font-normal text-amber-950 dark:text-amber-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Why this was held: </span>
            <span>{approval.reason}</span>
          </div>
        </div>

        <div className="text-[12px] font-normal text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Designated Family Approver:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-medium">{approval.contactName}</strong>
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="danger"
          size="sm"
          isLoading={isRejecting}
          onClick={() => setActionConfirm('reject')}
          leftIcon={<Ban className="w-3.5 h-3.5" />}
        >
          Block & Decline
        </Button>
        <Button
          variant="success"
          size="sm"
          isLoading={isApproving}
          onClick={() => setActionConfirm('approve')}
          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
        >
          Authorize Payment
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(actionConfirm)}
        onClose={() => setActionConfirm(null)}
        onConfirm={actionConfirm === 'approve' ? handleApprove : handleReject}
        title={actionConfirm === 'approve' ? 'Authorize Escrow Release' : 'Block & Decline Payment'}
        message={
          actionConfirm === 'approve'
            ? `Are you sure you want to authorize the release of $${approval.amount.toFixed(2)} to ${approval.sender}? This transaction will be approved and funds disbursed.`
            : `Are you sure you want to block the payment of $${approval.amount.toFixed(2)} to ${approval.sender}? The transaction will be permanently rejected.`
        }
        confirmLabel={actionConfirm === 'approve' ? 'Authorize Payment' : 'Block Payment'}
        variant={actionConfirm === 'approve' ? 'primary' : 'danger'}
        isLoading={isApproving || isRejecting}
      />
    </div>
  );
};
