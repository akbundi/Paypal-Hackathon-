# PayGuard 🛡️
> **"Your money. Your rules. Your protection."**  
> *AI detects the scam. PayGuard explains the risk. You stay in control.*

PayGuard is a modern, premium AI-powered payment security platform built to protect individuals, families, and small businesses from predatory payment scams, fraudulent invoices, and unconstrained autonomous AI shopping agents.

---


## 🌟 Key Product Features

### 1. Overview Dashboard (Security Operations Center)
- **Real-time KPI Metrics**:
  - **Total Payments Protected** ($42,850.00 / 148 verified transactions)
  - **Scams Detected** (37 attacks intercepted / 100% loss prevention)
  - **Money Saved** ($12,480.00 prevented losses)
  - **AI Agent Spending This Week** ($142.50 of $250.00 weekly budget)
- **Interactive Visualizations**:
  - **Weekly Spending Chart**: Recharts Area Chart comparing safe manual volume vs. autonomous AI agent checkouts.
  - **Fraud Threat Category Distribution**: Interactive donut chart detailing brand impersonation, urgent renewal scams, and micro-charge phishing.
- **PayPal Sandbox Status Banner**: Live simulated REST API v2 webhook receiver status (`/v1/paypal-intercept`).
- **Recent Intercepted & Cleared Transactions**: Audit summary with one-click deep drill-down.

### 2. AI Scam & Fraud Analyzer (`/scam-detection`)
- **Multi-Vector Analysis Form**:
  - Enter Invoice Description, Sender Name, Sender Email, Amount, and Urgency message.
  - Or click one of the **4 Quick Scenario Presets**:
    - *Geek Squad Fake Renewal (Critical Risk)*
    - *Urgent CEO Impersonation Wire (High Risk)*
    - *Suspicious Cloud Storage Overage (Medium Risk)*
    - *Legitimate SaaS Invoice (Low Risk)*
- **AI-Style Output Card**:
  - **Risk Score (0–100)** with dynamic SVG gauge indicator.
  - **Risk Level**: Low, Medium, High, Critical.
  - **Detected Fraud Signals**: Fake urgency, mismatched sender domain, pricing anchor trap ($299-$499), off-platform phone coercion.
  - **AI Plain-Language Risk Breakdown**: Explains the danger simply, avoiding obscure jargon, plus details on how scammers execute the attack.
  - **Action Controls**:
    - `Hold Payment (24h Escrow)`
    - `Approve Payment`
    - `Block & Blacklist Sender`
    - `Notify Trusted Contact`

### 3. AI Spending Guard (`/spending-guard`)
- **Autonomous Agent Budget Guardrails**:
  - Weekly limit progress bar with real-time remaining budget calculation.
  - **Emergency AI Kill-Switch**: Master toggle to halt all agent purchasing instantly across all connected bots (AutoGPT, Perplexity Buy, ChatGPT Operator).
- **Spending Rules Engine**:
  - Add, edit, delete, and toggle category-specific spending rules.
  - Configurable max per transaction, weekly cap, and 2-party authorization thresholds.
- **Purchase Verification Simulator**:
  - Test simulated agent purchase requests.
  - Real-time rule evaluation returns immediate **APPROVED**, **BLOCKED**, or **HELD** verification status with full reasoning and budget projection.
- **AI Agent Purchase History**: Complete audit table of previous autonomous orders.

### 4. Trusted Circle & Family Guard (`/trusted-circle`)
- **Multi-Party Authorization System**:
  - Protects elderly family members, teenagers, and business accounts from unilateral scam authorizations.
  - Approver cards with relationship, contact info, status, and permissions.
  - "Add Trusted Contact" modal form with real-time validation.
- **Pending Approvals Queue**:
  - Interactive cards for high-risk or escrow-held payments.
  - Approver can click **Authorize Payment** or **Block & Decline**, updating global statistics and transaction history in real-time.

### 5. Transaction Audit Trail (`/transactions`)
- Complete immutable record of all PayPal Sandbox captures and AI intercepts.
- Search by ID, sender, email, or invoice memo.
- Multi-dimensional filters (Status, Risk Level, Source: PayPal vs. AI Agent).
- **Transaction Details Modal**:
  - Full AI explanation
  - Behavioral signature tags
  - Immutable audit trail
  - Expandable raw PayPal Sandbox webhook JSON payload
- **CSV Log Export**: One-click export to `.csv`.

### 6. Settings & Localization (`/settings`)
- **Tri-Lingual Localization**: Switch instantly between **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
- **PayPal Sandbox Credentials**: Configurable client ID, webhook URLs, and real-time sandbox round-trip ping latency tester.
- **Security Thresholds**: Auto-quarantine score sliders, escrow timer hours, and AI engine selector (Gemini 2.0 Flash, Gemini 1.5 Pro, GPT-4o, Claude 3.5 Sonnet).
- **Persistent Demo State**: Stores transactions, rules, contacts, and preferences in `localStorage` with a 1-click **Reset Demo Data** option.

---



---

## 🔌 PayPal Sandbox & LLM API Integration Guide

To connect PayGuard to live sandbox credentials:
1. Open [`src/services/payguardService.ts`](file:///c:/Users/user/Downloads/PayGuard/src/services/payguardService.ts).
2. Replace mock endpoints in `analyzePayment()` with your Google Gemini API key or backend endpoint.
3. Configure your PayPal Developer Sandbox Webhook to route to `https://your-domain.com/v1/paypal-intercept`.

**PayGuard Enterprise API**  
*Secure Payments. Intelligent Risk Control. Trusted Approvals.*
