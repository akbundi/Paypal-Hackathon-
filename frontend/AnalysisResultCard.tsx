import React, { useState } from 'react';
import { ScamAnalysisResult } from '../../types';
import { usePayGuard } from '../../context/PayGuardContext';
import { RiskMeter } from '../common/RiskMeter';
import { Button } from '../common/Button';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface AnalysisResultCardProps {
  analysis: ScamAnalysisResult;
  onClear?: () => void;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  analysis,
}) => {
  const { processPaymentAction, t } = usePayGuard();
  const [decisionStatus, setDecisionStatus] = useState<
    'PENDING' | 'BLOCKED' | 'HELD' | 'DELEGATED' | 'APPROVED'
  >('PENDING');

  const handleAction = (action: 'HOLD' | 'APPROVE' | 'BLOCK' | 'NOTIFY_TRUSTED_CONTACT') => {
    processPaymentAction(action, analysis);
    if (action === 'BLOCK') setDecisionStatus('BLOCKED');
    else if (action === 'HOLD') setDecisionStatus('HELD');
    else if (action === 'NOTIFY_TRUSTED_CONTACT') setDecisionStatus('DELEGATED');
    else if (action === 'APPROVE') setDecisionStatus('APPROVED');
  };

  const getActionBadge = (rec: ScamAnalysisResult['recommendedAction']) => {
    switch (rec) {
      case 'BLOCK':
        return (
          <span className="px-2.5 py-1 rounded-md text-[12px] font-medium uppercase tracking-wider bg-coral-600 text-white shadow-xs flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" /> Recommended: Block Immediately
          </span>
        );
      case 'HOLD':
        return (
          <span className="px-2.5 py-1 rounded-md text-[12px] font-medium uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Recommended: Hold in 24h Escrow
          </span>
        );
      case 'NOTIFY_TRUSTED_CONTACT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[12px] font-medium uppercase tracking-wider bg-trust-600 text-white shadow-xs flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Recommended: Verify with Family
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[12px] font-medium uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Recommended: Safe to Approve
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-soft-sm overflow-hidden w-full min-w-0">
      {/* Header banner */}
      <div
        className={`px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          analysis.riskLevel === 'critical'
            ? 'bg-coral-50/70 dark:bg-coral-950/40 border-coral-200 dark:border-coral-900/60 text-coral-950 dark:text-coral-200'
            : analysis.riskLevel === 'high'
            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
            : analysis.riskLevel === 'medium'
            ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200'
            : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {analysis.riskLevel === 'critical' ? (
            <Flame className="w-4 h-4 text-coral-600 dark:text-coral-400" />
          ) : analysis.riskLevel === 'high' ? (
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : analysis.riskLevel === 'medium' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="text-[12px] font-mono font-medium uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Analysis ID: {analysis.id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {getActionBadge(analysis.recommendedAction)}

          {/* Current Status Badge */}
          {decisionStatus === 'PENDING' && (
            <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Status: Pending Decision</span>
            </span>
          )}
          {decisionStatus === 'BLOCKED' && (
            <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-coral-100 dark:bg-coral-950/80 text-coral-800 dark:text-coral-300 border border-coral-300 dark:border-coral-800 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-coral-600" />
              <span>Status: Blocked & Blacklisted</span>
            </span>
          )}
          {decisionStatus === 'HELD' && (
            <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Status: In 24h Temporary Escrow</span>
            </span>
          )}
          {decisionStatus === 'DELEGATED' && (
            <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-trust-100 dark:bg-trust-950/80 text-trust-800 dark:text-trust-300 border border-trust-300 dark:border-trust-800 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-trust-600" />
              <span>Status: Sent to Trusted Circle</span>
            </span>
          )}
          {decisionStatus === 'APPROVED' && (
            <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status: Approved & Dispatched</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Core evaluation metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Gauge */}
          <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <RiskMeter
              score={analysis.riskScore}
              level={analysis.riskLevel}
              confidence={analysis.confidence}
              size="lg"
            />
          </div>

          {/* Scanned Payload overview */}
          <div className="md:col-span-2 space-y-3 min-w-0">
            <div className="text-[12px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Evaluated Payment Entity
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5 text-[12px] font-normal">Sender / Merchant</span>
                <span className="font-semibold text-slate-900 dark:text-white text-[14px]">{analysis.senderName}</span>
                {analysis.senderEmail && (
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[12px] block mt-0.5 truncate font-normal">
                    {analysis.senderEmail}
                  </span>
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5 text-[11px] font-mono font-medium uppercase tracking-wider">Requested Amount</span>
                <span className="font-bold text-slate-900 dark:text-white text-[28px] sm:text-[30px] font-mono leading-none">
                  ${analysis.amount.toFixed(2)}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[12px] block mt-1 font-normal">
                  Channel: PayPal Sandbox REST
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-1 text-[11px] font-mono font-medium uppercase tracking-wider">Invoice Description</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-[13.5px]">{analysis.invoiceDescription}</p>
              {analysis.message && (
                <p className="mt-2 text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] font-normal leading-normal">
                  Memo: "{analysis.message}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plain Language AI Explanation */}
        <div className="p-5 sm:p-6 rounded-xl bg-navy-950 dark:bg-[#070D1F] text-slate-200 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
              <h4 className="text-[18px] sm:text-[19px] font-bold text-white tracking-tight">
                Risk Analysis Breakdown (Plain Language)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-medium">
              Zero-Trust Verification
            </span>
          </div>

          <p className="text-[14px] font-normal leading-relaxed text-slate-300">
            {analysis.explanation.summary}
          </p>

          <div className="pt-2 text-[13px] font-normal text-amber-300/90 bg-amber-950/40 p-3 rounded-lg border border-amber-800/40">
            <strong className="text-amber-200 font-semibold">Tactic Profile: </strong>
            <span>{analysis.explanation.scammerTactic}</span>
          </div>
        </div>

        {/* Detected Fraud Signals */}
        <div>
          <h4 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            <span>Fraud Signals Detected ({analysis.fraudSignals.length})</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.fraudSignals.map((signal) => (
              <div
                key={signal.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  signal.severity === 'critical'
                    ? 'bg-coral-50/60 dark:bg-coral-950/30 border-coral-200 dark:border-coral-900/60 text-coral-950 dark:text-coral-200'
                    : signal.severity === 'high'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                    : signal.severity === 'medium'
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    signal.severity === 'critical'
                      ? 'bg-coral-600'
                      : signal.severity === 'high'
                      ? 'bg-amber-600'
                      : signal.severity === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white text-[13.5px]">{signal.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-medium bg-white dark:bg-slate-800 border border-current/20">
                      {signal.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[12px] font-normal mt-1 leading-snug">
                    {signal.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sender Reputation & OSINT Signals */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Threat Intelligence & Domain Verification
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono uppercase tracking-wider">Domain Age</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13.5px] mt-0.5 block">{analysis.senderReputation.domainAge}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono uppercase tracking-wider">PayPal Verified</span>
              <span className={`font-semibold text-[13.5px] mt-0.5 block ${analysis.senderReputation.paypalVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-coral-600 dark:text-coral-400'}`}>
                {analysis.senderReputation.paypalVerified ? 'Yes (Verified)' : 'Unverified Sandbox'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono uppercase tracking-wider">Prior Abuse Reports</span>
              <span className={`font-mono font-bold text-[13.5px] mt-0.5 block ${analysis.senderReputation.priorReports > 0 ? 'text-coral-600 dark:text-coral-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {analysis.senderReputation.priorReports} incidents
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-mono uppercase tracking-wider">Disposable Mail</span>
              <span className={`font-semibold text-[13.5px] mt-0.5 block ${analysis.senderReputation.disposableEmail ? 'text-coral-600 dark:text-coral-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {analysis.senderReputation.disposableEmail ? 'Detected (Risk)' : 'Authentic MX'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons with Approval/Blocking Status */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[14px] font-bold text-slate-900 dark:text-white block">
                Safety Action & Policy Enforcement
              </span>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal">
                {decisionStatus === 'PENDING'
                  ? 'Select an enforcement action below to handle this invoice.'
                  : `Decision recorded as "${decisionStatus}". You can update or re-evaluate at any time.`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleAction('BLOCK')}
                leftIcon={<Ban className="w-4 h-4" />}
              >
                {t.scamDetection.blockPayment}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('HOLD')}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                {t.scamDetection.holdPayment}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction('NOTIFY_TRUSTED_CONTACT')}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                {t.scamDetection.notifyContact}
              </Button>

              <Button
                variant="success"
                size="sm"
                onClick={() => handleAction('APPROVE')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {t.scamDetection.approvePayment}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[12px] text-slate-400 dark:text-slate-500">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Heuristic verification and LLM risk assessment executed in sandbox mode. Actions update your local audit ledger.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
