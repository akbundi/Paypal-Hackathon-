# PayGuard Frontend-Backend API Integration Guide

This guide provides technical specifications, architecture patterns, and data contracts to enable seamless integration between the **PayGuard React + TypeScript frontend** and the **FastAPI backend**.

---

## 1. Architecture & Directory Structure

The frontend API layer is centralized under `src/services/api/` with strict TypeScript contracts in `src/types/api.types.ts` and UI integration hooks in `src/hooks/useApi.ts`.

```
src/
├── services/
│   ├── api/
│   │   ├── http.ts                 # Centralized fetch wrapper (auth, timeout, error mapping)
│   │   ├── endpoints.ts            # Centralized dictionary of all API endpoint routes
│   │   ├── auth.api.ts             # Authentication & user profile API calls
│   │   ├── dashboard.api.ts        # Dashboard statistics & analytics API calls
│   │   ├── transactions.api.ts     # Payment transactions & audit logs API calls
│   │   ├── scamDetection.api.ts    # AI Fraud & Invoice scam analysis (ACTIVE)
│   │   ├── spendingGuard.api.ts    # Autonomous agent budget rules & policies API calls
│   │   ├── trustedCircle.api.ts    # Guardian contacts & escrow approvals API calls
│   │   ├── settings.api.ts         # User preferences & sandbox connectivity API calls
│   │   └── index.ts                # Unified barrel export
│   └── payguardService.ts          # Domain service bridging API calls with UI state
├── types/
│   ├── api.types.ts                # Request/response contracts & DTOs
│   └── index.ts                    # Frontend domain model types
├── hooks/
│   └── useApi.ts                   # Generic async state hook (loading, error, data, retry)
└── components/
    └── common/
        ├── ApiStateWrapper.tsx     # Reusable UI spinner, error banner, and empty state
        └── ConfirmModal.tsx        # Reusable modal for destructive/critical actions
```

---

## 2. Environment Configuration

### Backend URL Resolution
The API client dynamically reads the backend base URL via Vite environment variables:
- **Environment Variable**: `VITE_API_BASE_URL`
- **Fallback URL**: `http://localhost:8000` (FastAPI default)

### Setup Instructions
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Verify or update `VITE_API_BASE_URL`:
   ```ini
   # .env
   VITE_API_BASE_URL=http://localhost:8000
   ```
3. In `endpoints.ts`, the URL is sanitized to trim trailing slashes:
   ```typescript
   export const getApiBaseUrl = (): string => {
     const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
     return url.replace(/\/$/, '');
   };
   ```

### Backend CORS Configuration (FastAPI)
The FastAPI backend must configure `CORSMiddleware` in `main.py` to allow the frontend origin:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite local dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Idempotency-Key", "X-Request-Id"],
)
```

---

## 3. Centralized HTTP Client (`http.ts`)

The HTTP client (`http.ts`) encapsulates `fetch` and provides:
1. **Methods**: `http.get`, `http.post`, `http.put`, `http.patch`, `http.delete`.
2. **Bearer Token Authentication**:
   - Stores tokens in `localStorage` via `authStorage.setToken(token)`.
   - Automatically attaches `Authorization: Bearer <token>` to all requests when a token exists.
   - Clears tokens via `authStorage.clearToken()` on logout or 401 response.
3. **Request Timeout**:
   - Native `AbortController` timeout defaulting to **15,000ms** (configurable per request).
   - Throws a descriptive `ApiError` if the backend fails to respond within the timeout window.
4. **Structured Error Handling (`ApiError`)**:
   - Formats FastAPI validation errors (`detail` array) into readable messages.
   - Standardizes network disconnects and HTTP status codes (400, 401, 403, 404, 422, 500).
   - Fires a window event (`payguard:unauthorized`) on `401 Unauthorized` so the frontend can redirect to login or show a re-auth modal.

---

## 4. Endpoint Specifications & Data Contracts

Status Legend:
- `[ACTIVE]`: Currently implemented in the FastAPI backend and functioning end-to-end.
- `[PENDING]`: Proposed contracts ready in frontend. Teammate needs to implement the endpoint.

---

### A. Scam Detection & AI Fraud Analysis (`scamDetection.api.ts`)

#### 1. Analyze Invoice / Payment `[ACTIVE]`
- **Method**: `POST`
- **Route**: `/api/v1/analyze`
- **Description**: Submits invoice details and payment context to the FastAPI AI heuristic and safeguard engine for real-time fraud scoring.
- **Request Body (`AnalyzeInvoiceRequest`)**:
```json
{
  "invoice_id": "INV-2026-X892",
  "merchant_name": "GeekSquad Direct Billing LLC",
  "recipient_name": "Alex Morgan",
  "sender_email": "auto-billing@service-geeksquad-renew.online",
  "amount": 499.99,
  "currency": "USD",
  "invoice_description": "Annual Total Tech Protection Plan Renewal #GS-883921. Call 1-800-XXX-XXXX to cancel within 24 hours.",
  "due_date": "2026-11-15",
  "language": "en",
  "payer_profile": {
    "average_transaction_amount": 75.0,
    "user_tier": "standard",
    "country": "US",
    "is_elderly_or_vulnerable": false
  }
}
```
- **Response Body (`BackendFraudAnalysisResponse`)**:
```json
{
  "invoice_id": "INV-2026-X892",
  "risk_score": 94,
  "risk_level": "CRITICAL",
  "decision": "BLOCK",
  "risk_indicators": [
    {
      "category": "fake_urgency",
      "severity": "high",
      "description": "Urgent deadline demands action within 24 hours to prevent recurring charge",
      "evidence": "within 24 hours",
      "score_impact": 25
    },
    {
      "category": "merchant_mismatch",
      "severity": "critical",
      "description": "Sender domain does not match official Best Buy / Geek Squad domain",
      "evidence": "service-geeksquad-renew.online",
      "score_impact": 35
    }
  ],
  "safeguard_invoked": true,
  "safeguard_details": {
    "invoked": true,
    "scam_category": "tech_support_refund_scam",
    "confidence": 0.96,
    "scam_indicators": ["tech_support_impersonation", "fake_invoice", "callback_phishing"],
    "reasoning": "Classic refund scam phishing template mimicking GeekSquad."
  },
  "explanation": "High-risk scam attempt detected mimicking Geek Squad tech support.",
  "recommendations": [
    "Do not call the phone number in the invoice",
    "Do not authorize or pay this invoice",
    "Report domain to anti-phishing database"
  ],
  "breakdown": {
    "urgency_score": 25,
    "amount_anomaly_score": 20,
    "merchant_mismatch_score": 35,
    "scam_language_score": 14,
    "total_score": 94
  },
  "metadata": {
    "domain_age": "< 15 days",
    "analysis_duration_ms": 128
  }
}
```

#### 2. Batch Analyze Invoices `[ACTIVE]`
- **Method**: `POST`
- **Route**: `/api/v1/analyze/batch`
- **Request Body**: Array of `AnalyzeInvoiceRequest`
- **Response Body**: Array of `BackendFraudAnalysisResponse`

#### 3. Backend Health Check `[ACTIVE]`
- **Method**: `GET`
- **Route**: `/api/v1/health`
- **Response Body (`BackendHealthResponse`)**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "components": {
    "ai_engine": "operational",
    "heuristic_rules": "loaded"
  }
}
```

#### 4. Supported Languages `[ACTIVE]`
- **Method**: `GET`
- **Route**: `/api/v1/languages`
- **Response Body (`SupportedLanguagesResponse`)**:
```json
{
  "languages": [
    { "code": "en", "name": "English", "native_name": "English", "description": "English" },
    { "code": "hi", "name": "Hindi", "native_name": "हिन्दी", "description": "Hindi" },
    { "code": "mr", "name": "Marathi", "native_name": "मराठी", "description": "Marathi" }
  ]
}
```

#### 5. Detection History `[PENDING]`
- **Method**: `GET`
- **Route**: `/api/v1/history`
- **Description**: Returns past scanned invoices for the current user.
- **Response Body**: `DetectionHistoryItem[]`

---

### B. Authentication & User Profile (`auth.api.ts`) `[PENDING]`

#### 1. User Login
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Request Body (`LoginRequest`)**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```
- **Response Body (`AuthResponse`)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "d8a1f29...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "usr-9941",
    "email": "user@example.com",
    "fullName": "Alex Morgan",
    "role": "owner",
    "orgName": "Morgan Labs"
  }
}
```

#### 2. User Registration
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Request Body (`SignupRequest`)**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "fullName": "Alex Morgan",
  "orgName": "Morgan Labs"
}
```
- **Response Body**: Same as `AuthResponse`.

#### 3. Current User Profile
- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response Body**: `UserProfile`

#### 4. Logout
- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response Body**: `{ "success": true, "message": "Logged out successfully" }`

#### 5. Token Refresh
- **Method**: `POST`
- **Route**: `/api/auth/refresh`
- **Request Body (`RefreshTokenRequest`)**:
```json
{
  "refreshToken": "d8a1f29..."
}
```
- **Response Body**: `{ "accessToken": "new_token...", "expiresIn": 86400 }`

---

### C. Dashboard & Analytics (`dashboard.api.ts`) `[PENDING]`

#### 1. Dashboard Summary
- **Method**: `GET`
- **Route**: `/api/dashboard/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Response Body (`DashboardSummaryResponse`)**:
```json
{
  "stats": {
    "totalScanned": 1284,
    "scamsBlocked": 37,
    "moneySaved": 14250.00,
    "activeProtections": 8,
    "escrowProtectedAmount": 3400.00
  },
  "weeklySpendingTrends": [
    { "day": "Mon", "agent": 120.50, "manual": 450.00 },
    { "day": "Tue", "agent": 80.00, "manual": 310.00 }
  ],
  "fraudDistribution": [
    { "name": "Fake Invoice Phishing", "count": 18, "share": "48%" },
    { "name": "Impersonation", "count": 11, "share": "30%" }
  ],
  "recentPendingApprovalsCount": 2
}
```

#### 2. Recent Security & Audit Activity
- **Method**: `GET`
- **Route**: `/api/dashboard/recent-activity`
- **Response Body**: `RecentActivityItem[]`

---

### D. Transactions & Payments (`transactions.api.ts`) `[PENDING]`

#### 1. List Transactions
- **Method**: `GET`
- **Route**: `/api/payments`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `search` (string)
  - `status` (`protected` | `quarantined` | `blocked` | `escrow_pending`)
  - `riskLevel` (`low` | `medium` | `high` | `critical`)
- **Response Body (`PaginatedResponse<Transaction>`)**:
```json
{
  "items": [
    {
      "id": "TXN-98214-US",
      "sender": "GeekSquad Direct Billing LLC",
      "senderEmail": "auto-billing@service-geeksquad-renew.online",
      "amount": 499.99,
      "currency": "USD",
      "date": "2026-11-10 09:42:15",
      "riskLevel": "critical",
      "riskScore": 94,
      "status": "blocked",
      "description": "Annual Total Tech Protection Plan Renewal #GS-883921",
      "category": "Software & Tech Support",
      "signals": ["Fake Urgency", "Mismatched Domain"],
      "source": "paypal",
      "explanation": "Phishing domain attempting unauthorized subscription renewal."
    }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

#### 2. Create / Simulate Transaction
- **Method**: `POST`
- **Route**: `/api/payments`
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <unique-uuid>`
- **Request Body (`CreateTransactionRequest`)**:
```json
{
  "recipient": "ShopBot Assistant",
  "recipientEmail": "agent-session-441@agents.sandbox.paypal",
  "amount": 34.50,
  "currency": "USD",
  "description": "Artisan Groceries Order #5541",
  "category": "Groceries",
  "source": "agent"
}
```

---

### E. Spending Guard & Autonomous Agent Rules (`spendingGuard.api.ts`) `[PENDING]`

#### 1. Get Spending Rules & Budget
- **Method**: `GET`
- **Route**: `/api/spending/rules`
- **Response Body (`SpendingRulesResponse`)**:
```json
{
  "rules": [
    {
      "id": "RULE-1",
      "name": "Cloud API Services",
      "category": "Cloud & Infrastructure",
      "maxPerTransaction": 150.00,
      "maxPerWeek": 500.00,
      "currentSpentThisWeek": 240.00,
      "requireApprovalAbove": 100.00,
      "status": "active"
    }
  ],
  "weeklyBudget": 2000.00,
  "agentSpentThisWeek": 645.50,
  "agentPurchasesEnabled": true
}
```

#### 2. Create Rule
- **Method**: `POST`
- **Route**: `/api/spending/rules`
- **Request Body**: `Omit<SpendingRule, 'id'>`

#### 3. Update Rule
- **Method**: `PUT`
- **Route**: `/api/spending/rules/:id`
- **Request Body**: `Partial<SpendingRule>`

#### 4. Delete Rule
- **Method**: `DELETE`
- **Route**: `/api/spending/rules/:id`

---

### F. Trusted Circle & Escrow Approvals (`trustedCircle.api.ts`) `[PENDING]`

#### 1. Get Contacts & Pending Approvals
- **Method**: `GET`
- **Route**: `/api/trusted-circle/contacts`
- **Response Body (`TrustedContactsResponse`)**:
```json
{
  "contacts": [
    {
      "id": "TC-1",
      "name": "Sarah Connor",
      "relationship": "Spouse / Co-Signer",
      "email": "sarah.connor@example.com",
      "phone": "+1 (555) 234-5678",
      "permissions": "Full Escrow Release Authority",
      "status": "active",
      "notificationsEnabled": true
    }
  ],
  "pendingApprovals": [
    {
      "id": "APP-2026-001",
      "transactionId": "TXN-98210-HOLD",
      "recipient": "Hardware Depot Express",
      "amount": 750.00,
      "requestedBy": "Autonomous Procurement Bot",
      "escrowHoldUntil": "2026-11-14 18:00:00",
      "reason": "Exceeds $500 single transaction threshold for hardware"
    }
  ]
}
```

#### 2. Add Trusted Contact
- **Method**: `POST`
- **Route**: `/api/trusted-circle/contacts`
- **Request Body (`AddTrustedContactRequest`)**:
```json
{
  "name": "David Miller",
  "relationship": "Financial Advisor",
  "email": "dmiller@advisor-group.com",
  "phone": "+1 (555) 876-5432",
  "permissions": "View & Approve Escrow > $500",
  "notificationsEnabled": true
}
```

#### 3. Approve Escrow Release
- **Method**: `POST`
- **Route**: `/api/trusted-circle/approvals/:id/approve`
- **Request Body**: `{ "approvalId": "APP-2026-001", "action": "approve", "notes": "Verified receipt." }`

#### 4. Reject / Block Escrow Transaction
- **Method**: `POST`
- **Route**: `/api/trusted-circle/approvals/:id/reject`
- **Request Body**: `{ "approvalId": "APP-2026-001", "action": "reject", "notes": "Unrecognized charge." }`

---

### G. Settings & PayPal Sandbox (`settings.api.ts`) `[PENDING]`

#### 1. Get User Preferences
- **Method**: `GET`
- **Route**: `/api/settings`
- **Response Body (`UserSettings`)**:
```json
{
  "autoQuarantineThreshold": 80,
  "escrowTimerHours": 24,
  "llmEngine": "gemini-2.5-flash",
  "smsAlerts": true,
  "emailAlerts": true,
  "language": "en",
  "theme": "dark"
}
```

#### 2. Ping PayPal Sandbox
- **Method**: `GET`
- **Route**: `/api/settings/paypal-sandbox-ping`
- **Response Body**: `{ "status": "online", "latencyMs": 42, "mode": "sandbox" }`

---

## 5. How to Connect Frontend Pages to API Modules

The frontend provides two ready patterns for connecting pages:

### Pattern A: Using the `useApi` Hook (Recommended for Page Components)

```tsx
import React from 'react';
import { useApi } from '../hooks/useApi';
import { dashboardApi } from '../services/api';
import { ApiStateWrapper } from '../components/common/ApiStateWrapper';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error, execute } = useApi(
    () => dashboardApi.getDashboardSummary(),
    { immediate: true }
  );

  return (
    <ApiStateWrapper
      isLoading={isLoading}
      error={error}
      isEmpty={!data}
      onRetry={execute}
    >
      {data && (
        <div>
          <h2>Total Scanned: {data.stats.totalScanned}</h2>
          <p>Scams Blocked: {data.stats.scamsBlocked}</p>
        </div>
      )}
    </ApiStateWrapper>
  );
};
```

### Pattern B: Connecting Context State (`PayGuardContext.tsx`)

In `src/context/PayGuardContext.tsx`, asynchronous data loading can replace the initial static state once endpoints are active:

```typescript
// Example: Loading rules from backend on mount
useEffect(() => {
  async function loadInitialData() {
    try {
      const response = await spendingGuardApi.getSpendingRules();
      setSpendingRules(response.rules);
      setWeeklyBudget(response.weeklyBudget);
    } catch (err) {
      console.warn('Backend unavailable, preserving demo data:', err);
    }
  }
  loadInitialData();
}, []);
```

### Pattern C: Mutation Actions with Confirmation Modal

```tsx
import React, { useState } from 'react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { trustedCircleApi } from '../services/api';

export const ContactRow = ({ contact, onRefresh }: { contact: any; onRefresh: () => void }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    await trustedCircleApi.deleteTrustedContact(contact.id);
    onRefresh();
  };

  return (
    <>
      <button onClick={() => setIsConfirmOpen(true)}>Delete Contact</button>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to remove ${contact.name}?`}
        variant="danger"
        confirmLabel="Remove"
      />
    </>
  );
};
```

---

## 6. Information & Requirements Needed from Backend Teammate

To complete full end-to-end integration, please clarify and coordinate on the following points:

1. **Authentication Strategy**:
   - Confirm whether authentication will use **Bearer JWT tokens** (handled by `authStorage` in `localStorage`), or **HttpOnly secure cookies**.
   - If Bearer JWT, please confirm token expiration time and the refresh token endpoint (`/api/auth/refresh`).

2. **Database Persistence**:
   - Provide database migrations or confirm when `rules`, `contacts`, and `transactions` tables will be backed by a persistent database (PostgreSQL/SQLite) instead of in-memory dictionaries.

3. **Scam Detection History Persistence**:
   - Determine whether the backend will automatically persist scanned invoices called via `POST /api/v1/analyze`, or if the frontend must make a secondary call to record them in transaction history.

4. **Error Response Format**:
   - The frontend handles FastAPI's standard validation structure:
     ```json
     { "detail": [{ "loc": ["body", "field"], "msg": "Field required", "type": "value_error" }] }
     ```
   - For business rule rejections (e.g., escrow already approved, contact not found), please use standard HTTP status codes (`400`, `404`, `409`, `422`) with a `{ "detail": "Human-readable message" }` payload.

5. **Payment Webhook & PayPal Sandbox**:
   - Clarify how PayPal webhook events will be pushed or polled to update transaction status in real-time (e.g., WebSockets, Server-Sent Events, or polling `/api/payments`).
