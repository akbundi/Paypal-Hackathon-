import React, { useState } from 'react';
import { usePayGuard } from '../context/PayGuardContext';
import { Language } from '../types';
import { Button } from '../components/common/Button';
import { testPayPalSandboxConnection } from '../services/payguardService';
import {
  Settings as SettingsIcon,
  Globe,
  Shield,
  Bell,
  Key,
  RotateCcw,
  CheckCircle2,
  Radio,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    resetDemoData,
    addToast,
  } = usePayGuard();

  const [autoQuarantineThreshold, setAutoQuarantineThreshold] = useState('85');
  const [escrowTimerHours, setEscrowTimerHours] = useState('24');
  const [llmEngine, setLlmEngine] = useState('gpt-oss-120b');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isTestingSandbox, setIsTestingSandbox] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<{
    tested: boolean;
    connected: boolean;
    latencyMs: number;
  }>({
    tested: true,
    connected: true,
    latencyMs: 142,
  });

  const languages: { code: Language; name: string; native: string; flag: string }[] = [
    { code: 'en', name: 'English', native: 'English (US)', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  ];

  const handleTestSandbox = async () => {
    setIsTestingSandbox(true);
    try {
      const res = await testPayPalSandboxConnection();
      setSandboxStatus({
        tested: true,
        connected: res.connected,
        latencyMs: res.latencyMs,
      });
      addToast(
        'PayPal Sandbox Active',
        `Simulated PayPal REST v2 round-trip ping: ${res.latencyMs}ms. Webhooks healthy.`,
        'success'
      );
    } catch {
      addToast('Connection Failed', 'Sandbox endpoint unreachable.', 'error');
    } finally {
      setIsTestingSandbox(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Settings Saved', 'Your security parameters have been updated.', 'success');
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-trust-50 dark:bg-trust-950/70 text-trust-700 dark:text-trust-300 text-[11px] font-mono font-medium uppercase tracking-wider mb-2 border border-trust-200/80 dark:border-trust-800">
          <SettingsIcon className="w-3.5 h-3.5 text-trust-600 dark:text-trust-400" />
          <span>System Parameters & Localizations</span>
        </div>
        <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t.settings.title}
        </h1>
        <p className="text-[14px] font-normal text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
          {t.settings.subtitle}
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Language Selection Card */}
        <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Globe className="w-4.5 h-4.5 text-trust-600 dark:text-trust-400" />
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">{t.settings.language}</h3>
          </div>
          <p className="text-[13px] sm:text-[14px] font-normal text-slate-500 dark:text-slate-400 mb-4">{t.settings.languageDesc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <div
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    addToast('Language Updated', `Switched UI language to ${l.native}.`, 'info');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-trust-500 bg-trust-50/60 dark:bg-trust-950/60 shadow-sm ring-1 ring-trust-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{l.flag}</span>
                    <div>
                      <div className="text-[13.5px] font-semibold text-slate-900 dark:text-white">{l.native}</div>
                      <div className="text-[12px] font-normal text-slate-500 dark:text-slate-400">{l.name}</div>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-trust-600 dark:text-trust-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Auto-Quarantine Rules */}
        <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Shield className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">{t.settings.security}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Auto-Block Risk Score Threshold (0–100)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={autoQuarantineThreshold}
                onChange={(e) => setAutoQuarantineThreshold(e.target.value)}
                className="w-full px-3.5 py-2 text-[13.5px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 font-mono text-slate-900 dark:text-white"
              />
              <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-1">
                Any invoice scoring at or above this value is automatically quarantined with zero fund transfer.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Escrow Hold Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={escrowTimerHours}
                onChange={(e) => setEscrowTimerHours(e.target.value)}
                className="w-full px-3.5 py-2 text-[13.5px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 font-mono text-slate-900 dark:text-white"
              />
              <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-1">
                Held transactions remain in temporary escrow awaiting Trusted Circle review before automatic cancellation.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              AI Fraud Reasoning Model Engine
            </label>
            <select
              value={llmEngine}
              onChange={(e) => setLlmEngine(e.target.value)}
              className="w-full max-w-full truncate px-3.5 py-2 text-[13.5px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-trust-500/20 focus:border-trust-500 text-slate-900 dark:text-white"
            >
              <option value="gpt-oss-120b">OpenAI GPT-OSS-120B (Recommended – Advanced Fraud Reasoning)</option>
              <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Multimodal & Cross-Document Analysis)</option>
              <option value="gpt-4o">OpenAI GPT-4o Invoicing Sentinel</option>
              <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
            </select>
          </div>
        </div>

        {/* PayPal Sandbox & Webhook Configuration */}
        <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="w-4.5 h-4.5 text-trust-600 dark:text-trust-400" />
              <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">{t.settings.sandbox}</h3>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {sandboxStatus.latencyMs}ms REST Latency
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 text-[12px]">
                PayPal Sandbox Client ID
              </label>
              <input
                type="text"
                readOnly
                value="sb-client-payguard-sandbox-prod-4829"
                className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-600 dark:text-slate-400 text-[12px] font-normal"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 text-[12px]">
                Webhook Interception Route
              </label>
              <input
                type="text"
                readOnly
                value="https://api.payguard.security/v1/paypal-intercept"
                className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-600 dark:text-slate-400 text-[12px] font-normal"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal">
              Simulates real PayPal IPN / Webhooks for checkout intercept and AI policy verification.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isTestingSandbox}
              onClick={handleTestSandbox}
              leftIcon={<Radio className="w-4 h-4 text-trust-600 dark:text-trust-400" />}
              className="font-semibold self-start sm:self-auto"
            >
              Ping Sandbox Connection
            </Button>
          </div>
        </div>

        {/* Notification Alert Preferences */}
        <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm space-y-3">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Bell className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">{t.settings.notifications}</h3>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
              />
              <div className="text-[13px]">
                <span className="font-medium text-slate-900 dark:text-white block">Instant SMS Dispatch</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal text-[12px]">
                  Sends urgent text messages to you and Trusted Contacts whenever an invoice is blocked.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
              />
              <div className="text-[13px]">
                <span className="font-medium text-slate-900 dark:text-white block">Weekly Digest & Audit Logs</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal text-[12px]">
                  Detailed breakdown of spending guardrail usage and intercepted scam attempts.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Save button and reset action */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetDemoData}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-coral-600 dark:text-coral-400" />}
            className="text-coral-600 dark:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-950/40 hover:text-coral-700"
          >
            Reset All Demo Data to Defaults
          </Button>

          <Button type="submit" variant="primary" size="md">
            {t.settings.saveChanges}
          </Button>
        </div>
      </form>
    </div>
  );
};
