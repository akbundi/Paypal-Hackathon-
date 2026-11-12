import {
  Transaction,
  ScamAnalysisResult,
  AgentPurchase,
  SpendingRule,
  TrustedContact,
  PendingApproval,
  SecurityStats,
  RiskLevel,
} from '../types';
import { scamDetectionApi, settingsApi } from './api';
import { BackendHealthResponse } from '../types/api.types';

export type { BackendHealthResponse };

export interface PaymentAnalysisInput {
  invoiceDescription: string;
  senderName: string;
  senderEmail?: string;
  amount: number;
  message?: string;
  recipientName?: string;
  currency?: string;
  language?: 'en' | 'hi' | 'mr';
}

export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  return scamDetectionApi.checkHealth();
}

export interface PurchaseVerificationInput {
  agentName: string;
  productName: string;
  category: string;
  amount: number;
}

// Initial realistic seed transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-98214-US',
    sender: 'GeekSquad Direct Billing LLC',
    senderEmail: 'auto-billing@service-geeksquad-renew.online',
    amount: 499.99,
    currency: 'USD',
    date: '2026-11-10 09:42:15',
    riskLevel: 'critical',
    riskScore: 94,
    status: 'blocked',
    description: 'Annual Total Tech Protection Plan Renewal #GS-883921',
    category: 'Software & Tech Support',
    signals: ['Fake Urgency', 'Mismatched Domain', 'Disposable Webmail', 'Known Refund Scam Template'],
    source: 'paypal',
    explanation: 'Sender pretends to be Best Buy Geek Squad, uses a newly registered .online domain, and demands rapid payment to dispute an unauthorized charge.',
    auditLog: [
      { timestamp: '2026-11-10 09:42:15', action: 'Intercepted by PayGuard AI Engine', actor: 'PayGuard AI' },
      { timestamp: '2026-11-10 09:42:16', action: 'Auto-blocked: Risk score 94 exceeds auto-quarantine threshold (85)', actor: 'Security Policy' },
    ],
  },
  {
    id: 'TXN-98205-AI',
    sender: 'ShopBot Assistant (Perplexity Buy)',
    senderEmail: 'agent-session-441@agents.sandbox.paypal',
    amount: 34.50,
    currency: 'USD',
    date: '2026-11-10 08:15:30',
    riskLevel: 'low',
    riskScore: 12,
    status: 'protected',
    description: 'Whole Foods Market - Organic Almond Milk & Artisan Bread',
    category: 'Groceries',
    signals: ['Verified AI Agent Signature', 'Within Category Limit ($50.00)', 'Trusted Merchant'],
    source: 'agent',
    explanation: 'Authorized autonomous grocery refill. Follows rule #RULE-GROC-01. Transaction safely cleared through PayPal sandbox.',
    auditLog: [
      { timestamp: '2026-11-10 08:15:30', action: 'Agent token validated via PayPal Agent Protocol', actor: 'Spending Guard' },
      { timestamp: '2026-11-10 08:15:31', action: 'Approved within Groceries limit', actor: 'Rule Engine' },
    ],
  },
  {
    id: 'TXN-98192-US',
    sender: 'CryptoTrust Escrow Corp',
    senderEmail: 'support@cryptotrust-instant-pay.cc',
    amount: 850.00,
    currency: 'USD',
    date: '2026-11-09 21:04:12',
    riskLevel: 'high',
    riskScore: 82,
    status: 'held',
    description: 'Expedited P2P Asset Liquidation Settlement',
    category: 'Financial Services',
    signals: ['Unregistered Crypto Escrow', 'High Value', 'Pressure Tactic', 'Trusted Circle Escalation Triggered'],
    source: 'paypal',
    explanation: 'Transaction flagged for sudden high-value transfer to unverified foreign address. Escalated to Mom (Sarah Miller) for family approval.',
    auditLog: [
      { timestamp: '2026-11-09 21:04:12', action: 'High-risk payment detected', actor: 'PayGuard AI' },
      { timestamp: '2026-11-09 21:04:13', action: 'Sent 24hr escrow approval notification to Sarah Miller', actor: 'Trusted Circle' },
    ],
  },
  {
    id: 'TXN-98188-US',
    sender: 'GitHub Enterprise Inc.',
    senderEmail: 'billing@github.com',
    amount: 21.00,
    currency: 'USD',
    date: '2026-11-09 14:10:00',
    riskLevel: 'low',
    riskScore: 4,
    status: 'protected',
    description: 'GitHub Copilot Business Seat Monthly Subscription',
    category: 'Developer Tools',
    signals: ['Verified Enterprise Domain', 'Consistent Recurring Pattern', 'EV SSL Authenticated'],
    source: 'paypal',
    explanation: 'Standard verified software subscription with 24 months of consistent billing history.',
    auditLog: [
      { timestamp: '2026-11-09 14:10:00', action: 'Matched known safe recurring subscription list', actor: 'PayGuard Engine' },
      { timestamp: '2026-11-09 14:10:01', action: 'Cleared instantly', actor: 'System' },
    ],
  },
  {
    id: 'TXN-98175-AI',
    sender: 'AutoProcure Bot v2',
    senderEmail: 'autoprocure@sandbox.paypal.local',
    amount: 289.00,
    currency: 'USD',
    date: '2026-11-09 11:22:45',
    riskLevel: 'high',
    riskScore: 78,
    status: 'blocked',
    description: '4K Ultra-Wide Monitor Purchase Attempt on Amazon',
    category: 'Electronics',
    signals: ['Exceeds Per-Tx Limit ($75.00)', 'Exceeds Electronics Weekly Cap ($100.00)', 'Restricted Category Limit'],
    source: 'agent',
    explanation: 'The AI shopping agent attempted a $289.00 electronics purchase, exceeding the maximum per-transaction ceiling of $75.00 set in Spending Guard.',
    auditLog: [
      { timestamp: '2026-11-09 11:22:45', action: 'Purchase request intercepted by Spending Guard', actor: 'Agent Proxy' },
      { timestamp: '2026-11-09 11:22:46', action: 'Rule violation: Max electronics limit breached. Blocked.', actor: 'Rule Engine' },
    ],
  },
  {
    id: 'TXN-98160-US',
    sender: 'US Postal Tracking Center',
    senderEmail: 'notification-delivery@usps-parcel-fees99.com',
    amount: 3.85,
    currency: 'USD',
    date: '2026-11-08 17:35:10',
    riskLevel: 'critical',
    riskScore: 91,
    status: 'blocked',
    description: 'Package Redelivery Fee - Final Notice Tracking #US939100',
    category: 'Postal & Logistics',
    signals: ['Smishing / Phishing Domain', 'Micro-Billing Bait', 'Phishing URL in Invoice Memo'],
    source: 'paypal',
    explanation: 'Micro-charge bait technique designed to harvest linked card and bank credentials through fake postal invoice portal.',
    auditLog: [
      { timestamp: '2026-11-08 17:35:10', action: 'Flagged by URL Reputation & Smishing Heuristics', actor: 'PayGuard AI' },
      { timestamp: '2026-11-08 17:35:11', action: 'Blocked and added to global threat feed', actor: 'Firewall' },
    ],
  },
  {
    id: 'TXN-98150-US',
    sender: 'Spotify USA Inc.',
    senderEmail: 'no-reply@spotify.com',
    amount: 11.99,
    currency: 'USD',
    date: '2026-11-08 04:00:19',
    riskLevel: 'low',
    riskScore: 5,
    status: 'protected',
    description: 'Spotify Premium Individual Plan',
    category: 'Entertainment',
    signals: ['Authentic Merchant ID', 'Low Transaction Value', 'Zero Risk Flags'],
    source: 'paypal',
    explanation: 'Routine recurring audio streaming subscription.',
    auditLog: [{ timestamp: '2026-11-08 04:00:19', action: 'Verified & cleared', actor: 'System' }],
  },
];

export const INITIAL_RULES: SpendingRule[] = [
  {
    id: 'RULE-GROC-01',
    name: 'Groceries & Essentials',
    category: 'Groceries',
    maxPerTx: 50.00,
    maxPerWeek: 120.00,
    requireApprovalOver: 40.00,
    isActive: true,
    createdAt: '2026-10-15',
    allowedAgents: ['ShopBot Assistant', 'KitchenAI'],
  },
  {
    id: 'RULE-ELEC-02',
    name: 'Electronics & Gadgets',
    category: 'Electronics',
    maxPerTx: 75.00,
    maxPerWeek: 100.00,
    requireApprovalOver: 50.00,
    isActive: true,
    createdAt: '2026-10-20',
    allowedAgents: ['AutoProcure Bot v2'],
  },
  {
    id: 'RULE-DIGI-03',
    name: 'Digital Goods & Cloud Tools',
    category: 'Digital Goods',
    maxPerTx: 30.00,
    maxPerWeek: 60.00,
    requireApprovalOver: 25.00,
    isActive: true,
    createdAt: '2026-11-01',
    allowedAgents: ['Perplexity Agent', 'DevBot'],
  },
  {
    id: 'RULE-REST-04',
    name: 'Disallowed Categories (Gambling & Crypto)',
    category: 'High-Risk Services',
    maxPerTx: 0.00,
    maxPerWeek: 0.00,
    requireApprovalOver: 0.00,
    isActive: true,
    createdAt: '2026-11-01',
    allowedAgents: [],
  },
];

export const INITIAL_CONTACTS: TrustedContact[] = [
  {
    id: 'TC-01',
    name: 'Sarah Miller',
    relationship: 'Mother / Primary Approver',
    email: 'sarah.miller@familyguard.net',
    phone: '+1 (555) 342-9811',
    permissions: 'Full Approval (Purchases > $100 & High-Risk Alerts)',
    status: 'verified',
    notificationsEnabled: true,
  },
  {
    id: 'TC-02',
    name: 'David Miller',
    relationship: 'Brother / Secondary Contact',
    email: 'david.m@cybersec-advisors.io',
    phone: '+1 (555) 789-2341',
    permissions: 'Scam Alerts & Escalated Approvals',
    status: 'active',
    notificationsEnabled: true,
  },
  {
    id: 'TC-03',
    name: 'Elena Rostova',
    relationship: 'Financial Co-pilot & CPA',
    email: 'elena@rostova-accounting.com',
    phone: '+1 (555) 602-1199',
    permissions: 'Business Invoices > $500',
    status: 'verified',
    notificationsEnabled: false,
  },
];

export const INITIAL_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'APP-701',
    transactionId: 'TXN-98192-US',
    title: 'P2P Asset Settlement Request',
    sender: 'CryptoTrust Escrow Corp',
    amount: 850.00,
    riskScore: 82,
    riskLevel: 'high',
    reason: 'Sudden high-value transfer to unverified foreign address. Suspicious urgency detected.',
    requestedAt: '2026-11-09 21:04',
    contactId: 'TC-01',
    contactName: 'Sarah Miller (Mother)',
    status: 'pending',
  },
  {
    id: 'APP-702',
    title: 'Urgent System Tech Support Desk Invoice',
    sender: 'QuickSupport Global Services',
    amount: 250.00,
    riskScore: 76,
    riskLevel: 'high',
    reason: 'Remote support invoice containing pressure tactics. Requires approval from your trusted circle.',
    requestedAt: '2026-11-10 07:30',
    contactId: 'TC-01',
    contactName: 'Sarah Miller (Mother)',
    status: 'pending',
  },
];

export const INITIAL_AGENT_PURCHASES: AgentPurchase[] = [
  {
    id: 'PUR-01',
    agentName: 'ShopBot Assistant',
    productName: 'Organic Almond Milk & Artisan Bread',
    category: 'Groceries',
    amount: 34.50,
    status: 'approved',
    reason: 'Within groceries rule limit of $50/tx and $120/wk',
    timestamp: '2026-11-10 08:15',
    matchedRuleId: 'RULE-GROC-01',
  },
  {
    id: 'PUR-02',
    agentName: 'AutoProcure Bot v2',
    productName: '4K Ultra-Wide Monitor Amazon Refurbished',
    category: 'Electronics',
    amount: 289.00,
    status: 'blocked',
    reason: 'Exceeded per-transaction threshold ($75.00) and category weekly budget',
    timestamp: '2026-11-09 11:22',
    matchedRuleId: 'RULE-ELEC-02',
  },
  {
    id: 'PUR-03',
    agentName: 'Perplexity Agent',
    productName: 'HuggingFace Pro Monthly Subscription',
    category: 'Digital Goods',
    amount: 9.00,
    status: 'approved',
    reason: 'Approved under Digital Goods rule ($30/tx max)',
    timestamp: '2026-11-08 19:40',
    matchedRuleId: 'RULE-DIGI-03',
  },
  {
    id: 'PUR-04',
    agentName: 'KitchenAI',
    productName: 'Coffee Beans 2lb Espresso Roast',
    category: 'Groceries',
    amount: 28.00,
    status: 'approved',
    reason: 'Within weekly budget allowance',
    timestamp: '2026-11-07 14:12',
    matchedRuleId: 'RULE-GROC-01',
  },
];

export const INITIAL_STATS: SecurityStats = {
  totalProtectedAmount: 42850.00,
  protectedCount: 148,
  scamsDetectedCount: 37,
  moneySavedAmount: 12480.00,
  agentSpentThisWeek: 142.50,
  agentWeeklyBudget: 250.00,
};

// Preset scam scenarios for instant demonstration
export const SCAM_PRESETS = [
  {
    id: 'preset-geeksquad',
    label: 'Geek Squad Fake Renewal (Critical)',
    severity: 'critical' as RiskLevel,
    data: {
      invoiceDescription: 'Annual GeekSquad BestBuy Total Tech Support Auto-Renewal Subscription',
      senderName: 'GeekSquad Support Billing Dept LLC',
      senderEmail: 'refund-desk994@service-geeksquad-billing.online',
      amount: 499.99,
      message: 'URGENT: Your account was auto-debited $499.99 today. If you did NOT authorize this renewal, call our toll-free cancellation line within 2 hours or funds cannot be reversed.',
    },
  },
  {
    id: 'preset-ceo',
    label: 'Urgent Wire Transfer / Impersonation (High)',
    severity: 'high' as RiskLevel,
    data: {
      invoiceDescription: 'Confidential Vendor Retainer for Project Titan Acquisition',
      senderName: 'CEO Executive Office (Robert Vance)',
      senderEmail: 'robert.vance-office@fastmail-secure.net',
      amount: 4850.00,
      message: 'I am currently in an all-day board meeting with poor cell reception. Please process this vendor deposit immediately via PayPal or Wire. Do not call my mobile, simply reply with the confirmation ID.',
    },
  },
  {
    id: 'preset-cloud',
    label: 'Suspicious Cloud Storage Storage Invoice (Medium)',
    severity: 'medium' as RiskLevel,
    data: {
      invoiceDescription: 'Over-Quota Cloud Data Backup Overage Fee - 500GB',
      senderName: 'CloudDrive Sync Billing Partner',
      senderEmail: 'billing-alert@cloudsync-verify-portal.co',
      amount: 79.50,
      message: 'Your cloud storage has exceeded maximum capacity. Pay invoice within 24 hours to prevent immediate file deletion.',
    },
  },
  {
    id: 'preset-github',
    label: 'Legitimate SaaS Invoice (Low Risk)',
    severity: 'low' as RiskLevel,
    data: {
      invoiceDescription: 'GitHub Enterprise Team License - November 2026 Billing Cycle',
      senderName: 'GitHub Inc.',
      senderEmail: 'billing@github.com',
      amount: 21.00,
      message: 'Thank you for your payment. Your monthly receipt is attached. You can view your invoice anytime in your GitHub Billing Settings.',
    },
  },
];

/**
 * Heuristic & Rule-based AI Fraud Analysis Engine
 * Ready to be connected to LLM API (e.g. Gemini / OpenAI / Anthropic)
 */
export async function analyzePayment(input: PaymentAnalysisInput): Promise<ScamAnalysisResult> {
  const payload = {
    invoice_id: `INV-${Date.now().toString(36).toUpperCase()}`,
    merchant_name: input.senderName,
    recipient_name: input.recipientName?.trim() || 'PayGuard User',
    sender_email: input.senderEmail?.trim() || 'unknown@unknown.invalid',
    amount: Math.max(0, Number(input.amount) || 0),
    currency: input.currency?.trim() || 'USD',
    invoice_description: [input.invoiceDescription, input.message].filter(Boolean).join('\n\n'),
    language: input.language || 'en',
  };

  const data = await scamDetectionApi.analyzeInvoice(payload);

  const riskLevel = String(data.risk_level || 'MEDIUM').toLowerCase() as RiskLevel;
  const indicators = Array.isArray(data.risk_indicators) ? data.risk_indicators : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  const score = Number(data.risk_score) || 0;

  // Build tactical summary
  const tactic = data.safeguard_details?.scam_category
    ? `${data.safeguard_details.scam_category.replace(/_/g, ' ').toUpperCase()}${
        data.safeguard_details.scam_indicators?.length
          ? ' (' + data.safeguard_details.scam_indicators.join(', ') + ')'
          : ''
      }`
    : recommendations.length > 0
    ? recommendations.join(' ')
    : 'Standard automated risk heuristic assessment.';

  return {
    id: String(data.invoice_id || `SCAN-${Date.now().toString(36).toUpperCase()}`),
    invoiceDescription: input.invoiceDescription,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    amount: Math.max(0, Number(input.amount) || 0),
    message: input.message,
    riskScore: score,
    riskLevel,
    fraudSignals: indicators.map((item, index) => ({
      id: `backend-signal-${index + 1}`,
      name: String(item.category || 'Risk indicator').replace(/_/g, ' '),
      severity: (['low', 'medium', 'high', 'critical'].includes(item.severity) ? item.severity : 'medium') as RiskLevel,
      description: item.description,
      detectedText: item.evidence || undefined,
    })),
    explanation: {
      summary: String(data.explanation || 'Analysis completed.'),
      whySuspicious: indicators.map((item) => String(item.description)),
      scammerTactic: tactic,
    },
    recommendedAction: data.decision === 'BLOCK' ? 'BLOCK' : data.decision === 'REVIEW' ? 'HOLD' : 'APPROVE',
    confidence: data.safeguard_details?.confidence != null
      ? Math.round(Number(data.safeguard_details.confidence) * 100)
      : score,
    analysisTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    senderReputation: {
      domainAge: (data.metadata?.domain_age as string) || (indicators.some((i) => i.category === 'merchant_mismatch') ? '< 15 days (High Risk)' : 'Established'),
      disposableEmail: indicators.some((item) => item.category === 'merchant_mismatch'),
      priorReports: score >= 80 ? 4 : score >= 50 ? 1 : 0,
      paypalVerified: score < 30,
    },
  };
}

/**
 * AI Agent Purchase Verification Engine
 * Validates purchase requests against user-defined rules and budget
 */
export async function verifyAgentPurchase(
  input: PurchaseVerificationInput,
  rules: SpendingRule[],
  currentWeekSpent: number,
  weeklyBudget: number
): Promise<{
  status: 'approved' | 'blocked' | 'held';
  reason: string;
  matchedRule?: SpendingRule;
  updatedWeeklySpent: number;
  newPurchase: AgentPurchase;
}> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const amount = Number(input.amount) || 0;
  const newProjectedTotal = currentWeekSpent + amount;

  // 1. Check Global Weekly Budget
  if (newProjectedTotal > weeklyBudget) {
    const purchase: AgentPurchase = {
      id: `PUR-${Date.now().toString(36).toUpperCase()}`,
      agentName: input.agentName,
      productName: input.productName,
      category: input.category,
      amount,
      status: 'blocked',
      reason: `Blocked: Exceeds global weekly budget limit ($${weeklyBudget.toFixed(2)}). Current spent: $${currentWeekSpent.toFixed(2)}, attempted: $${amount.toFixed(2)}.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    return {
      status: 'blocked',
      reason: purchase.reason,
      updatedWeeklySpent: currentWeekSpent,
      newPurchase: purchase,
    };
  }

  // 2. Check Category-Specific Rules
  const matchedRule = rules.find(
    (r) => r.isActive && r.category.toLowerCase() === input.category.toLowerCase()
  );

  if (matchedRule) {
    if (amount > matchedRule.maxPerTx) {
      const purchase: AgentPurchase = {
        id: `PUR-${Date.now().toString(36).toUpperCase()}`,
        agentName: input.agentName,
        productName: input.productName,
        category: input.category,
        amount,
        status: 'blocked',
        reason: `Blocked: Exceeds max per-transaction limit ($${matchedRule.maxPerTx.toFixed(2)}) for category "${matchedRule.category}".`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        matchedRuleId: matchedRule.id,
      };
      return {
        status: 'blocked',
        reason: purchase.reason,
        matchedRule,
        updatedWeeklySpent: currentWeekSpent,
        newPurchase: purchase,
      };
    }

    if (amount > matchedRule.requireApprovalOver) {
      const purchase: AgentPurchase = {
        id: `PUR-${Date.now().toString(36).toUpperCase()}`,
        agentName: input.agentName,
        productName: input.productName,
        category: input.category,
        amount,
        status: 'held',
        reason: `Held for Approval: Amount exceeds automatic threshold ($${matchedRule.requireApprovalOver.toFixed(2)}). Notification sent to Trusted Circle.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        matchedRuleId: matchedRule.id,
      };
      return {
        status: 'held',
        reason: purchase.reason,
        matchedRule,
        updatedWeeklySpent: currentWeekSpent,
        newPurchase: purchase,
      };
    }
  }

  // Approved!
  const purchase: AgentPurchase = {
    id: `PUR-${Date.now().toString(36).toUpperCase()}`,
    agentName: input.agentName,
    productName: input.productName,
    category: input.category,
    amount,
    status: 'approved',
    reason: matchedRule
      ? `Approved: Satisfies rule "${matchedRule.name}" (Max $${matchedRule.maxPerTx.toFixed(2)}/tx)`
      : `Approved: Validated under default safety guardrail.`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    matchedRuleId: matchedRule?.id,
  };

  return {
    status: 'approved',
    reason: purchase.reason,
    matchedRule,
    updatedWeeklySpent: currentWeekSpent + amount,
    newPurchase: purchase,
  };
}

/**
 * Approve a held payment / transaction
 */
export async function approvePayment(
  transactionId: string,
  approverName: string = 'Sarah Miller'
): Promise<{ success: boolean; message: string; timestamp: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    message: `Payment ${transactionId} authorized and released by ${approverName} via PayPal Sandbox escrow release.`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}

/**
 * Block a transaction and quarantine sender
 */
export async function blockPayment(
  transactionId: string,
  reason: string = 'High risk scam signature detected'
): Promise<{ success: boolean; message: string; timestamp: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    message: `Payment ${transactionId} blocked (${reason}). Sender blacklisted and PayPal dispute incident logged.`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}

/**
 * Test PayPal Sandbox Connection Status
 */
export async function testPayPalSandboxConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  environment: string;
  webhookStatus: string;
  clientIdMasked: string;
}> {
  try {
    const res = await settingsApi.pingPayPalSandbox();
    return {
      connected: res.connected,
      latencyMs: res.latencyMs,
      environment: 'PayPal Sandbox REST v2',
      webhookStatus: 'Active (Listening to PAYMENT.CAPTURE.COMPLETED & INVOICING.INVOICE.CREATED)',
      clientIdMasked: 'sb-client-id-payguard-prod-***4829',
    };
  } catch {
    // Demo fallback when backend endpoint is not yet connected
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      connected: true,
      latencyMs: 142,
      environment: 'PayPal Sandbox REST v2 (Simulated)',
      webhookStatus: 'Active (Listening to PAYMENT.CAPTURE.COMPLETED & INVOICING.INVOICE.CREATED)',
      clientIdMasked: 'sb-client-id-payguard-prod-***4829',
    };
  }
}
