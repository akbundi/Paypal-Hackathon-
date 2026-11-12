import React, { useState, useEffect } from 'react';
import { usePayGuard } from '../context/PayGuardContext';
import { analyzePayment, checkBackendHealth, SCAM_PRESETS } from '../services/payguardService';
import { AnalysisResultCard } from '../components/scam/AnalysisResultCard';
import { Button } from '../components/common/Button';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Flame,
  CheckCircle2,
  DollarSign,
  FileText,
  User,
  Mail,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

export const ScamDetection: React.FC = () => {
  const { t, lastAnalysis, setLastAnalysis, addToast, language } = usePayGuard();

  const [invoiceDescription, setInvoiceDescription] = useState(
    'Annual GeekSquad BestBuy Total Tech Support Auto-Renewal Subscription #GS-8829'
  );
  const [senderName, setSenderName] = useState('GeekSquad Support Billing Dept LLC');
  const [senderEmail, setSenderEmail] = useState('refund-desk994@service-geeksquad-billing.online');
  const [amount, setAmount] = useState('499.99');
  const [message, setMessage] = useState(
    'URGENT: Your account was auto-debited $499.99 today. If you did NOT authorize this renewal, call our toll-free cancellation line within 2 hours or funds cannot be reversed.'
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // Verify backend connectivity on mount
  useEffect(() => {
    let isMounted = true;
    checkBackendHealth()
      .then(() => {
        if (isMounted) setBackendStatus('connected');
      })
      .catch(() => {
        if (isMounted) setBackendStatus('offline');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceDescription.trim() || !senderName.trim()) {
      addToast('Input Required', 'Please provide at least the invoice description and sender name.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzePayment({
        invoiceDescription: invoiceDescription.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        amount: Math.max(0, parseFloat(amount) || 0),
        message: message.trim(),
        language,
      });

      setBackendStatus('connected');
      setLastAnalysis(result);
      addToast(
        'Analysis Complete',
        `Assessed with risk score ${result.riskScore}/100 (${result.riskLevel.toUpperCase()}).`,
        result.riskScore >= 60 ? 'warning' : 'success'
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to complete AI fraud evaluation.';
      setAnalysisError(errMsg);
      if (errMsg.toLowerCase().includes('connect') || errMsg.toLowerCase().includes('failed to fetch')) {
        setBackendStatus('offline');
      }
      addToast('Analysis Error', errMsg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset: typeof SCAM_PRESETS[0]) => {
    setInvoiceDescription(preset.data.invoiceDescription);
    setSenderName(preset.data.senderName);
    setSenderEmail(preset.data.senderEmail);
    setAmount(preset.data.amount.toString());
    setMessage(preset.data.message);
    setAnalysisError(null);
  };

  const handleResetForm = () => {
    setInvoiceDescription('');
    setSenderName('');
    setSenderEmail('');
    setAmount('');
    setMessage('');
    setAnalysisError(null);
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-trust-50 dark:bg-trust-950/70 text-trust-700 dark:text-trust-300 text-[11px] font-mono font-medium uppercase tracking-wider border border-trust-200/80 dark:border-trust-800">
            <ShieldCheck className="w-3.5 h-3.5 text-trust-600 dark:text-trust-400" />
            <span>Signature Security Feature • Invoice & Payment Risk Analyzer</span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${
              backendStatus === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : backendStatus === 'checking'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : backendStatus === 'checking'
                  ? 'bg-slate-400 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span>
              {backendStatus === 'connected'
                ? 'FastAPI Backend: Connected'
                : backendStatus === 'checking'
                ? 'Backend: Connecting...'
                : 'FastAPI Backend: Offline (localhost:8000)'}
            </span>
          </div>
        </div>

        <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t.scamDetection.title}
        </h1>
        <p className="text-[14px] font-normal text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-normal">
          {t.scamDetection.subtitle}
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-soft-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-slate-900 dark:text-white tracking-tight">
            {t.scamDetection.quickPresets}
          </span>
          <span className="text-[12px] font-normal text-slate-500 dark:text-slate-400">
            Click to auto-fill sample attack vectors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SCAM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-[13px] font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2 truncate">
                {preset.severity === 'critical' ? (
                  <Flame className="w-4 h-4 text-coral-600 dark:text-coral-400 flex-shrink-0" />
                ) : preset.severity === 'high' ? (
                  <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                ) : preset.severity === 'medium' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                )}
                <span className="truncate group-hover:text-trust-600 dark:group-hover:text-trust-400 transition-colors font-semibold">{preset.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analyzer Form */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.scamDetection.invoiceDesc} *</span>
              </label>
              <input
                type="text"
                required
                disabled={isAnalyzing}
                value={invoiceDescription}
                onChange={(e) => {
                  setInvoiceDescription(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
                placeholder="e.g., Annual GeekSquad BestBuy Total Tech Plan Auto-Renewal"
                className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.scamDetection.senderName} *</span>
              </label>
              <input
                type="text"
                required
                disabled={isAnalyzing}
                value={senderName}
                onChange={(e) => {
                  setSenderName(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
                placeholder="e.g., GeekSquad Billing Dept LLC"
                className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.scamDetection.senderEmail}</span>
              </label>
              <input
                type="text"
                disabled={isAnalyzing}
                value={senderEmail}
                onChange={(e) => {
                  setSenderEmail(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
                placeholder="e.g., billing@geeksquad-renew.online"
                className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.scamDetection.amount} *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                disabled={isAnalyzing}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
                placeholder="499.99"
                className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.scamDetection.messageText}</span>
            </label>
            <textarea
              rows={3}
              disabled={isAnalyzing}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (analysisError) setAnalysisError(null);
              }}
              placeholder="e.g., URGENT: Your card will be debited in 2 hours. Call 1-800-XXX to dispute or reverse charge..."
              className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleResetForm}
              className="text-[13px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Inputs</span>
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isAnalyzing}
              leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
            >
              {isAnalyzing ? t.scamDetection.analyzing : t.scamDetection.analyzeBtn}
            </Button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-8 text-center bg-white dark:bg-[#0B132B] border border-trust-200/80 dark:border-trust-900 rounded-xl shadow-soft-sm text-slate-600 dark:text-slate-300">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-trust-500/30 animate-ping" />
            <div className="w-12 h-12 rounded-full border-2 border-trust-600 border-t-transparent animate-spin flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-trust-600 dark:text-trust-400" />
            </div>
          </div>
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight">
            Evaluating Invoice Risk Profile...
          </h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Executing GPT-OSS-120B invoice understanding, fraud rules engine, and selective safeguard verification.
          </p>
        </div>
      )}

      {/* Error State */}
      {analysisError && !isAnalyzing && (
        <div className="p-5 bg-coral-50/80 dark:bg-coral-950/40 border border-coral-200 dark:border-coral-900/60 rounded-xl text-coral-950 dark:text-coral-200 shadow-soft-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-coral-600 dark:text-coral-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-bold text-coral-900 dark:text-coral-200">
                Fraud Analysis Request Failed
              </h4>
              <p className="text-[13px] text-coral-800 dark:text-coral-300 mt-1">
                {analysisError}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Analysis
                </Button>
                <span className="text-[12px] text-coral-700 dark:text-coral-400">
                  Tip: Ensure the backend is running with <code className="bg-coral-100 dark:bg-coral-900/60 px-1.5 py-0.5 rounded font-mono text-[11px]">uvicorn backend.main:app --reload</code>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Result Card */}
      {!isAnalyzing && lastAnalysis ? (
        <AnalysisResultCard
          analysis={lastAnalysis}
          onClear={() => setLastAnalysis(null)}
        />
      ) : !isAnalyzing && !analysisError ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
          <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
            No analysis results yet. Enter invoice details above or pick a sample preset to test.
          </p>
          <p className="text-[12px] font-normal text-slate-400 dark:text-slate-500 mt-1">
            PayGuard will inspect urgency cues, sender domain age, price psychology, and known fraud patterns.
          </p>
        </div>
      ) : null}
    </div>
  );
};
