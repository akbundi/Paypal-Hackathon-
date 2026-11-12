import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  Language,
  Theme,
  Transaction,
  SpendingRule,
  TrustedContact,
  PendingApproval,
  AgentPurchase,
  SecurityStats,
  NotificationItem,
  ScamAnalysisResult,
} from '../types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_RULES,
  INITIAL_CONTACTS,
  INITIAL_PENDING_APPROVALS,
  INITIAL_AGENT_PURCHASES,
  INITIAL_STATS,
} from '../services/payguardService';
import { translations, Translations } from '../i18n/translations';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface PayGuardContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  transactions: Transaction[];
  spendingRules: SpendingRule[];
  trustedContacts: TrustedContact[];
  pendingApprovals: PendingApproval[];
  agentPurchases: AgentPurchase[];
  stats: SecurityStats;
  agentPurchasesEnabled: boolean;
  setAgentPurchasesEnabled: (enabled: boolean) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  // Actions
  addRule: (rule: Omit<SpendingRule, 'id' | 'createdAt'>) => void;
  updateRule: (id: string, updates: Partial<SpendingRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  addContact: (contact: Omit<TrustedContact, 'id'>) => void;
  deleteContact: (id: string) => void;
  approvePendingApproval: (approvalId: string) => Promise<void>;
  rejectPendingApproval: (approvalId: string) => Promise<void>;
  processPaymentAction: (
    action: 'HOLD' | 'APPROVE' | 'BLOCK' | 'NOTIFY_TRUSTED_CONTACT',
    analysis: ScamAnalysisResult
  ) => void;
  recordAgentPurchaseItem: (purchase: AgentPurchase, amount: number) => void;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  resetDemoData: () => void;
  lastAnalysis: ScamAnalysisResult | null;
  setLastAnalysis: (res: ScamAnalysisResult | null) => void;
}

const PayGuardContext = createContext<PayGuardContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'payguard_state_v1';

export const PayGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('payguard_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('payguard_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('payguard_lang');
    return (saved as Language) || 'en';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tx`);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [spendingRules, setSpendingRules] = useState<SpendingRule[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_rules`);
      return saved ? JSON.parse(saved) : INITIAL_RULES;
    } catch {
      return INITIAL_RULES;
    }
  });

  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_contacts`);
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_approvals`);
      return saved ? JSON.parse(saved) : INITIAL_PENDING_APPROVALS;
    } catch {
      return INITIAL_PENDING_APPROVALS;
    }
  });

  const [agentPurchases, setAgentPurchases] = useState<AgentPurchase[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_agent_purchases`);
      return saved ? JSON.parse(saved) : INITIAL_AGENT_PURCHASES;
    } catch {
      return INITIAL_AGENT_PURCHASES;
    }
  });

  const [stats, setStats] = useState<SecurityStats>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_stats`);
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  const [agentPurchasesEnabled, setAgentPurchasesEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<ScamAnalysisResult | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'GeekSquad Scam Auto-Blocked',
      message: 'Suspicious $499.99 invoice was intercepted before authorization.',
      type: 'alert',
      timestamp: '10 mins ago',
      read: false,
      actionPath: 'transactions',
    },
    {
      id: 'notif-2',
      title: 'Approval Required: $250.00 Support Invoice',
      message: 'Escalated to Sarah Miller for family verification.',
      type: 'warning',
      timestamp: '1 hour ago',
      read: false,
      actionPath: 'trusted-circle',
    },
    {
      id: 'notif-3',
      title: 'PayPal Sandbox Webhook Active',
      message: 'Secure channel connected to simulated merchant endpoint.',
      type: 'info',
      timestamp: '2 hours ago',
      read: true,
      actionPath: 'settings',
    },
  ]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_tx`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_rules`, JSON.stringify(spendingRules));
  }, [spendingRules]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_contacts`, JSON.stringify(trustedContacts));
  }, [trustedContacts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_approvals`, JSON.stringify(pendingApprovals));
  }, [pendingApprovals]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_agent_purchases`, JSON.stringify(agentPurchases));
  }, [agentPurchases]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_stats`, JSON.stringify(stats));
  }, [stats]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('payguard_lang', lang);
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Rule management
  const addRule = (newRule: Omit<SpendingRule, 'id' | 'createdAt'>) => {
    const id = `RULE-${Date.now().toString(36).toUpperCase()}`;
    const rule: SpendingRule = {
      ...newRule,
      id,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setSpendingRules((prev) => [rule, ...prev]);
    addToast('Rule Created', `Spending guardrail "${rule.name}" is now active.`, 'success');
  };

  const updateRule = (id: string, updates: Partial<SpendingRule>) => {
    setSpendingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    addToast('Rule Updated', 'Spending rule settings have been updated.', 'success');
  };

  const deleteRule = (id: string) => {
    setSpendingRules((prev) => prev.filter((r) => r.id !== id));
    addToast('Rule Deleted', 'Spending rule removed.', 'info');
  };

  const toggleRule = (id: string) => {
    setSpendingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  // Contact management
  const addContact = (newContact: Omit<TrustedContact, 'id'>) => {
    const id = `TC-${Date.now().toString(36).toUpperCase()}`;
    const contact: TrustedContact = {
      ...newContact,
      id,
    };
    setTrustedContacts((prev) => [...prev, contact]);
    addToast('Trusted Contact Added', `${contact.name} was added to your Trusted Circle.`, 'success');
  };

  const deleteContact = (id: string) => {
    setTrustedContacts((prev) => prev.filter((c) => c.id !== id));
    addToast('Contact Removed', 'Trusted contact removed from Circle.', 'info');
  };

  // Pending Approvals
  const approvePendingApproval = async (approvalId: string) => {
    const target = pendingApprovals.find((p) => p.id === approvalId);
    if (!target) return;

    setPendingApprovals((prev) => prev.filter((p) => p.id !== approvalId));

    // Update corresponding transaction if it exists
    if (target.transactionId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === target.transactionId
            ? {
                ...t,
                status: 'protected',
                auditLog: [
                  ...t.auditLog,
                  {
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    action: `Payment manually approved by ${target.contactName}`,
                    actor: target.contactName,
                  },
                ],
              }
            : t
        )
      );
    }

    addToast(
      'Payment Approved',
      `Payment of $${target.amount.toFixed(2)} to "${target.sender}" was cleared by trusted contact.`,
      'success'
    );
  };

  const rejectPendingApproval = async (approvalId: string) => {
    const target = pendingApprovals.find((p) => p.id === approvalId);
    if (!target) return;

    setPendingApprovals((prev) => prev.filter((p) => p.id !== approvalId));

    if (target.transactionId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === target.transactionId
            ? {
                ...t,
                status: 'blocked',
                auditLog: [
                  ...t.auditLog,
                  {
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    action: `Payment rejected and blocked by ${target.contactName}`,
                    actor: target.contactName,
                  },
                ],
              }
            : t
        )
      );
    }

    setStats((prev) => ({
      ...prev,
      scamsDetectedCount: prev.scamsDetectedCount + 1,
      moneySavedAmount: prev.moneySavedAmount + target.amount,
    }));

    addToast(
      'Payment Blocked',
      `Suspicious transaction of $${target.amount.toFixed(2)} declined and blocked. Funds are safe!`,
      'error'
    );
  };

  // Process Scam Detection actions
  const processPaymentAction = (
    action: 'HOLD' | 'APPROVE' | 'BLOCK' | 'NOTIFY_TRUSTED_CONTACT',
    analysis: ScamAnalysisResult
  ) => {
    const txId = `TXN-${Date.now().toString(36).toUpperCase()}-PG`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (action === 'BLOCK') {
      const newTx: Transaction = {
        id: txId,
        sender: analysis.senderName,
        senderEmail: analysis.senderEmail || 'unknown@domain.com',
        amount: analysis.amount,
        currency: 'USD',
        date: now,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        status: 'blocked',
        description: analysis.invoiceDescription,
        category: 'Scam Intercept',
        signals: analysis.fraudSignals.map((s) => s.name),
        source: 'paypal',
        explanation: analysis.explanation.summary,
        auditLog: [
          { timestamp: now, action: 'Manual Block initiated by user via Scam Detection', actor: 'User' },
          { timestamp: now, action: 'Sender blacklisted across all linked PayPal channels', actor: 'PayGuard Firewall' },
        ],
      };

      setTransactions((prev) => [newTx, ...prev]);
      setStats((prev) => ({
        ...prev,
        scamsDetectedCount: prev.scamsDetectedCount + 1,
        moneySavedAmount: prev.moneySavedAmount + analysis.amount,
      }));

      addToast(
        'Transaction Blocked & Blacklisted',
        `$${analysis.amount.toFixed(2)} to "${analysis.senderName}" permanently blocked. Money saved!`,
        'error'
      );
    } else if (action === 'HOLD') {
      const newTx: Transaction = {
        id: txId,
        sender: analysis.senderName,
        senderEmail: analysis.senderEmail || 'unknown@domain.com',
        amount: analysis.amount,
        currency: 'USD',
        date: now,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        status: 'held',
        description: analysis.invoiceDescription,
        category: 'Escrow Hold',
        signals: analysis.fraudSignals.map((s) => s.name),
        source: 'paypal',
        explanation: analysis.explanation.summary,
        auditLog: [
          { timestamp: now, action: 'Placed in 24h Escrow Quarantine', actor: 'User' },
        ],
      };

      setTransactions((prev) => [newTx, ...prev]);
      addToast(
        'Payment Placed on Hold',
        `$${analysis.amount.toFixed(2)} locked in 24-hour verification escrow.`,
        'warning'
      );
    } else if (action === 'NOTIFY_TRUSTED_CONTACT') {
      const newApproval: PendingApproval = {
        id: `APP-${Date.now().toString(36).toUpperCase()}`,
        transactionId: txId,
        title: analysis.invoiceDescription,
        sender: analysis.senderName,
        amount: analysis.amount,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        reason: analysis.explanation.whySuspicious[0] || 'Flagged for family circle verification.',
        requestedAt: now.substring(0, 16),
        contactId: trustedContacts[0]?.id || 'TC-01',
        contactName: trustedContacts[0] ? `${trustedContacts[0].name} (${trustedContacts[0].relationship.split('/')[0].trim()})` : 'Trusted Contact',
        status: 'pending',
      };

      const newTx: Transaction = {
        id: txId,
        sender: analysis.senderName,
        senderEmail: analysis.senderEmail || 'unknown@domain.com',
        amount: analysis.amount,
        currency: 'USD',
        date: now,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        status: 'held',
        description: analysis.invoiceDescription,
        category: 'Escalated to Trusted Circle',
        signals: analysis.fraudSignals.map((s) => s.name),
        source: 'paypal',
        explanation: analysis.explanation.summary,
        auditLog: [
          { timestamp: now, action: `Escalated to ${newApproval.contactName} for two-party authorization`, actor: 'User' },
        ],
      };

      setTransactions((prev) => [newTx, ...prev]);
      setPendingApprovals((prev) => [newApproval, ...prev]);

      addToast(
        'Sent to Trusted Circle',
        `Approval request sent to ${newApproval.contactName}. Payment held safely.`,
        'info'
      );
    } else if (action === 'APPROVE') {
      const newTx: Transaction = {
        id: txId,
        sender: analysis.senderName,
        senderEmail: analysis.senderEmail || 'unknown@domain.com',
        amount: analysis.amount,
        currency: 'USD',
        date: now,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        status: 'protected',
        description: analysis.invoiceDescription,
        category: 'Authorized Payment',
        signals: analysis.fraudSignals.map((s) => s.name),
        source: 'paypal',
        explanation: 'User explicitly approved payment after reviewing AI risk assessment.',
        auditLog: [
          { timestamp: now, action: 'Payment authorized and released by user override', actor: 'User' },
        ],
      };

      setTransactions((prev) => [newTx, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalProtectedAmount: prev.totalProtectedAmount + analysis.amount,
        protectedCount: prev.protectedCount + 1,
      }));

      addToast('Payment Approved', `$${analysis.amount.toFixed(2)} to "${analysis.senderName}" released.`, 'success');
    }
  };

  const recordAgentPurchaseItem = (purchase: AgentPurchase, amount: number) => {
    setAgentPurchases((prev) => [purchase, ...prev]);
    if (purchase.status === 'approved') {
      setStats((prev) => ({
        ...prev,
        agentSpentThisWeek: prev.agentSpentThisWeek + amount,
        totalProtectedAmount: prev.totalProtectedAmount + amount,
        protectedCount: prev.protectedCount + 1,
      }));

      // Also create a transaction record
      const newTx: Transaction = {
        id: `TXN-AI-${Date.now().toString(36).toUpperCase()}`,
        sender: `${purchase.agentName}`,
        senderEmail: 'agent@sandbox.paypal.local',
        amount: purchase.amount,
        currency: 'USD',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        riskLevel: 'low',
        riskScore: 8,
        status: 'protected',
        description: `${purchase.productName} (${purchase.category})`,
        category: purchase.category,
        signals: ['Verified Autonomous Purchase', 'Within Spending Guard Rule Limits'],
        source: 'agent',
        explanation: purchase.reason,
        auditLog: [
          {
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            action: 'Authorized by Spending Guard automated rule engine',
            actor: 'Spending Guard',
          },
        ],
      };
      setTransactions((prev) => [newTx, ...prev]);
    } else if (purchase.status === 'blocked') {
      setStats((prev) => ({
        ...prev,
        scamsDetectedCount: prev.scamsDetectedCount + 1,
        moneySavedAmount: prev.moneySavedAmount + amount,
      }));
    }
  };

  const resetDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setSpendingRules(INITIAL_RULES);
    setTrustedContacts(INITIAL_CONTACTS);
    setPendingApprovals(INITIAL_PENDING_APPROVALS);
    setAgentPurchases(INITIAL_AGENT_PURCHASES);
    setStats(INITIAL_STATS);
    setLastAnalysis(null);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_tx`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_rules`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_contacts`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_approvals`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_agent_purchases`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_stats`);
    addToast('Demo Reset', 'PayGuard demo data has been reset to defaults.', 'info');
  };

  const t = translations[language] || translations.en;

  return (
    <PayGuardContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        t,
        transactions,
        spendingRules,
        trustedContacts,
        pendingApprovals,
        agentPurchases,
        stats,
        agentPurchasesEnabled,
        setAgentPurchasesEnabled,
        notifications,
        markNotificationRead,
        clearNotifications,
        searchQuery,
        setSearchQuery,
        selectedTransaction,
        setSelectedTransaction,
        addRule,
        updateRule,
        deleteRule,
        toggleRule,
        addContact,
        deleteContact,
        approvePendingApproval,
        rejectPendingApproval,
        processPaymentAction,
        recordAgentPurchaseItem,
        toasts,
        addToast,
        removeToast,
        resetDemoData,
        lastAnalysis,
        setLastAnalysis,
      }}
    >
      {children}
    </PayGuardContext.Provider>
  );
};

export const usePayGuard = (): PayGuardContextType => {
  const context = useContext(PayGuardContext);
  if (!context) {
    throw new Error('usePayGuard must be used within a PayGuardProvider');
  }
  return context;
};
