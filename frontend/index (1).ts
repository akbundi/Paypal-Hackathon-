export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TransactionStatus = 'protected' | 'blocked' | 'held' | 'refunded';

export type PaymentSource = 'paypal' | 'agent' | 'card' | 'wire';

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
}

export interface Transaction {
  id: string;
  sender: string;
  senderEmail: string;
  amount: number;
  currency: string;
  date: string;
  riskLevel: RiskLevel;
  riskScore: number;
  status: TransactionStatus;
  description: string;
  category: string;
  signals: string[];
  source: PaymentSource;
  explanation?: string;
  auditLog: AuditLogEntry[];
}

export interface FraudSignal {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedText?: string;
}

export interface ScamAnalysisResult {
  id: string;
  invoiceDescription: string;
  senderName: string;
  senderEmail?: string;
  amount: number;
  message?: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  fraudSignals: FraudSignal[];
  explanation: {
    summary: string;
    whySuspicious: string[];
    scammerTactic: string;
  };
  recommendedAction: 'HOLD' | 'APPROVE' | 'BLOCK' | 'NOTIFY_TRUSTED_CONTACT';
  confidence: number;
  analysisTimestamp: string;
  senderReputation: {
    domainAge: string;
    disposableEmail: boolean;
    priorReports: number;
    paypalVerified: boolean;
  };
}

export interface SpendingRule {
  id: string;
  name: string;
  category: string;
  maxPerTx: number;
  maxPerWeek: number;
  requireApprovalOver: number;
  isActive: boolean;
  createdAt: string;
  allowedAgents?: string[];
}

export interface AgentPurchase {
  id: string;
  agentName: string;
  productName: string;
  category: string;
  amount: number;
  status: 'approved' | 'blocked' | 'held';
  reason: string;
  timestamp: string;
  matchedRuleId?: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  permissions: string;
  status: 'active' | 'pending' | 'verified';
  avatar?: string;
  notificationsEnabled: boolean;
}

export interface PendingApproval {
  id: string;
  transactionId?: string;
  title: string;
  sender: string;
  amount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  reason: string;
  requestedAt: string;
  contactId: string;
  contactName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  timestamp: string;
  read: boolean;
  actionPath?: string;
}

export interface SecurityStats {
  totalProtectedAmount: number;
  protectedCount: number;
  scamsDetectedCount: number;
  moneySavedAmount: number;
  agentSpentThisWeek: number;
  agentWeeklyBudget: number;
}

export type Language = 'en' | 'hi' | 'mr';

export type Theme = 'light' | 'dark';

export type ActiveTab = 'overview' | 'scam-detection' | 'transactions' | 'spending-guard' | 'trusted-circle' | 'settings';
