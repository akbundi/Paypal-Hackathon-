/**
 * API Data Contracts and Type Definitions for PayGuard.
 * These interfaces mirror the backend API payloads and responses.
 * 
 * NOTE FOR BACKEND TEAMMATE:
 * - Types marked with [ACTIVE BACKEND] match the live FastAPI Scam Detection endpoints.
 * - Types marked with [PENDING BACKEND] are proposed contracts for auth, transactions,
 *   spending guard, and trusted circle. Review and confirm with the frontend team.
 */

import {
  SpendingRule,
  TrustedContact,
  PendingApproval,
  SecurityStats,
  RiskLevel,
  Language,
} from './index';

// ============================================================================
// 1. Generic API Wrappers & Error Handling
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiErrorDetail {
  loc?: (string | number)[];
  msg: string;
  type?: string;
}

export interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[];
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// 2. Authentication API Types [PENDING BACKEND SPECIFICATION]
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'approver' | 'member' | 'viewer';
  orgId?: string;
  orgName?: string;
  avatarUrl?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  orgName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================================
// 3. Dashboard API Types [PENDING BACKEND SPECIFICATION]
// ============================================================================

export interface DashboardSpendingTrend {
  day: string;
  agent: number;
  manual: number;
}

export interface FraudDistributionCategory {
  name: string;
  count: number;
  share: string;
}

export interface DashboardSummaryResponse {
  stats: SecurityStats;
  weeklySpendingTrends: DashboardSpendingTrend[];
  fraudDistribution: FraudDistributionCategory[];
  recentPendingApprovalsCount: number;
}

export interface RecentActivityItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  type: 'security_alert' | 'spending_limit' | 'approval_required' | 'policy_update';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 4. Transactions API Types [PENDING BACKEND SPECIFICATION]
// ============================================================================

export interface TransactionFilterParams extends PaginationParams {
  search?: string;
  status?: string;
  riskLevel?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTransactionRequest {
  recipient: string;
  recipientEmail?: string;
  amount: number;
  currency?: string;
  description: string;
  category?: string;
  source?: 'paypal' | 'agent' | 'card' | 'wire';
  idempotencyKey?: string;
}

// ============================================================================
// 5. Scam Detection API Types [ACTIVE BACKEND - FastAPI /api/v1/analyze]
// ============================================================================

export interface BackendPayerProfile {
  average_transaction_amount?: number;
  user_tier?: string;
  country?: string;
  is_elderly_or_vulnerable?: boolean;
}

export interface AnalyzeInvoiceRequest {
  invoice_id?: string;
  merchant_name: string;
  recipient_name: string;
  sender_email: string;
  amount: number;
  currency?: string;
  invoice_description: string;
  due_date?: string;
  language?: Language;
  payer_profile?: BackendPayerProfile;
}

export interface BackendRiskIndicator {
  category: 'fake_urgency' | 'merchant_mismatch' | 'suspicious_amount' | 'scam_language' | 'suspicious_contact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string | null;
  score_impact: number;
}

export interface BackendSafeguardAnalysis {
  invoked: boolean;
  scam_category?: string | null;
  confidence: number;
  scam_indicators: string[];
  reasoning?: string | null;
}

export interface BackendScoreBreakdown {
  urgency_score: number;
  amount_anomaly_score: number;
  merchant_mismatch_score: number;
  scam_language_score: number;
  total_score: number;
}

export interface BackendFraudAnalysisResponse {
  invoice_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'APPROVE' | 'REVIEW' | 'BLOCK';
  risk_indicators: BackendRiskIndicator[];
  safeguard_invoked: boolean;
  safeguard_details?: BackendSafeguardAnalysis | null;
  explanation: string;
  recommendations: string[];
  breakdown: BackendScoreBreakdown;
  metadata?: Record<string, unknown>;
}

export interface BackendHealthResponse {
  status: string;
  version?: string;
  components?: Record<string, string>;
}

export interface SupportedLanguageItem {
  code: string;
  name: string;
  native_name: string;
  description: string;
}

export interface SupportedLanguagesResponse {
  languages: SupportedLanguageItem[];
}

export interface DetectionHistoryItem {
  id: string;
  analyzedAt: string;
  merchantName: string;
  amount: number;
  currency: string;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: 'APPROVE' | 'REVIEW' | 'BLOCK';
}

// ============================================================================
// 6. Spending Guard API Types [PENDING BACKEND SPECIFICATION]
// ============================================================================

export interface SpendingRulesResponse {
  rules: SpendingRule[];
  weeklyBudget: number;
  agentSpentThisWeek: number;
  agentPurchasesEnabled: boolean;
}

export interface UpdateSpendingRulesRequest {
  rules?: SpendingRule[];
  weeklyBudget?: number;
  agentPurchasesEnabled?: boolean;
}

export interface SpendingSummaryResponse {
  weeklyBudget: number;
  agentSpentThisWeek: number;
  budgetRemaining: number;
  budgetPercentUsed: number;
  activeRulesCount: number;
}

// ============================================================================
// 7. Trusted Circle API Types [PENDING BACKEND SPECIFICATION]
// ============================================================================

export interface TrustedContactsResponse {
  contacts: TrustedContact[];
  pendingApprovals: PendingApproval[];
}

export interface AddTrustedContactRequest {
  name: string;
  relationship: string;
  email: string;
  phone: string;
  permissions?: string;
  notificationsEnabled?: boolean;
}

export interface UpdateTrustedContactRequest {
  name?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  permissions?: string;
  status?: 'active' | 'pending' | 'verified';
  notificationsEnabled?: boolean;
}

export interface ApprovalActionRequest {
  approvalId: string;
  action: 'approve' | 'reject';
  notes?: string;
}

// ============================================================================
// 8. Settings API Types [PENDING BACKEND SPECIFICATION]
// ============================================================================

export interface UserSettings {
  autoQuarantineThreshold: number;
  escrowTimerHours: number;
  llmEngine: string;
  smsAlerts: boolean;
  emailAlerts: boolean;
  language: Language;
  theme: 'light' | 'dark';
}

export interface UpdateSettingsRequest {
  autoQuarantineThreshold?: number;
  escrowTimerHours?: number;
  llmEngine?: string;
  smsAlerts?: boolean;
  emailAlerts?: boolean;
  language?: Language;
  theme?: 'light' | 'dark';
}
