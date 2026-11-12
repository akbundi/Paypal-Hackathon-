/**
 * Centralized API Endpoints Directory for PayGuard.
 * 
 * BACKEND INTEGRATION GUIDE:
 * - ACTIVE: Verified and working against the current FastAPI AI fraud engine.
 * - PENDING: Proposed paths for authentication, user management, and transactional APIs.
 *   These are marked as [TODO: Confirm with backend teammate].
 */

export const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return url.replace(/\/$/, '');
};

export const API_ENDPOINTS = {
  // ==========================================================================
  // Authentication & Users [TODO: Confirm with backend teammate]
  // ==========================================================================
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    LOGOUT_ALL: '/api/auth/logout-all',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // ==========================================================================
  // Dashboard & Real-Time Stats [TODO: Confirm with backend teammate]
  // ==========================================================================
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
    STATS: '/api/dashboard/stats',
    RECENT_ACTIVITY: '/api/dashboard/recent-activity',
  },

  // ==========================================================================
  // Transactions & Payments [TODO: Confirm with backend teammate]
  // Note: Reference tests use /api/payments
  // ==========================================================================
  TRANSACTIONS: {
    LIST: '/api/payments',
    DETAIL: (id: string) => `/api/payments/${encodeURIComponent(id)}`,
    CREATE: '/api/payments',
  },

  // ==========================================================================
  // Scam Detection [ACTIVE - Connected to FastAPI AI Fraud Engine]
  // ==========================================================================
  SCAM_DETECTION: {
    ANALYZE: '/api/v1/analyze',
    BATCH_ANALYZE: '/api/v1/analyze/batch',
    HEALTH: '/api/v1/health',
    LANGUAGES: '/api/v1/languages',
    // [TODO: Confirm with backend teammate if historical scans will be persisted]
    HISTORY: '/api/v1/history',
  },

  // ==========================================================================
  // Spending Guard & Policy Rules [TODO: Confirm with backend teammate]
  // ==========================================================================
  SPENDING_GUARD: {
    RULES: '/api/spending/rules',
    RULE_BY_ID: (id: string) => `/api/spending/rules/${encodeURIComponent(id)}`,
    SUMMARY: '/api/spending/summary',
    VERIFY_PURCHASE: '/api/spending/verify-purchase',
  },

  // ==========================================================================
  // Trusted Circle & Escrow Approvals [TODO: Confirm with backend teammate]
  // ==========================================================================
  TRUSTED_CIRCLE: {
    CONTACTS: '/api/trusted-circle/contacts',
    CONTACT_BY_ID: (id: string) => `/api/trusted-circle/contacts/${encodeURIComponent(id)}`,
    APPROVALS: '/api/trusted-circle/approvals',
    APPROVE: (id: string) => `/api/trusted-circle/approvals/${encodeURIComponent(id)}/approve`,
    REJECT: (id: string) => `/api/trusted-circle/approvals/${encodeURIComponent(id)}/reject`,
    PING_CONTACT: (id: string) => `/api/trusted-circle/contacts/${encodeURIComponent(id)}/test-alert`,
  },

  // ==========================================================================
  // Settings & Configuration [TODO: Confirm with backend teammate]
  // ==========================================================================
  SETTINGS: {
    GET: '/api/settings',
    UPDATE: '/api/settings',
    PAYPAL_PING: '/api/settings/paypal-sandbox-ping',
  },
} as const;
