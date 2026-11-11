# AI-Powered Scam Detection Engine

A production-grade fraud and scam detection system designed for analyzing suspicious invoices, detecting tech support scams, phishing attempts, artificial urgency, and impersonation fraud.

---

## Component & Model Architecture

| Component | Model / Technology | Invocation Policy |
| :--- | :--- | :--- |
| **Invoice Understanding** | `GPT-OSS-120B` | Every transaction (extracts intent, tone, contact lures, triage flag) |
| **Scam Language Detection** | `GPT-OSS-Safeguard-120B` | **Selective** (Invoked *only* when suspicious urgency, brand mismatch, or scam keywords are detected) |
| **Amount Anomaly Detection** | Python | Deterministic rules (checks scam price patterns like `.99` traps, historical user deviation) |
| **Merchant Mismatch** | Python + `GPT-OSS-120B` | Enterprise brand dictionary, free webmail detection (`@gmail.com`), typosquatting |
| **Risk Score (0–100)** | Python Rules Engine | Multi-factor calibrated scoring (Urgency + Amount + Merchant + Scam language) |
| **Explanations & Guidance** | `GPT-OSS-120B` / Localization Engine | Supports **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** |

> [!NOTE]
> **Selective 120B Model Invocation**: Both 120B models are **not** called for every transaction. `GPT-OSS-Safeguard-120B` is called selectively when suspicious signals are detected by the first-pass triage, saving inference latency and compute costs on routine transactions.

---

## Directory Structure

```
c:\my paypal code\
├── app/
│   ├── __init__.py          # Package initialization
│   ├── analyzer.py          # Pipeline orchestrator and selective invocation logic
│   ├── risk_scoring.py      # Python rules engine, amount anomaly & merchant mismatch
│   ├── prompts.py           # System and user prompts for GPT-OSS-120B & Safeguard-120B
│   ├── explainability.py    # Transparent explanation synthesis & actionable guidance
│   ├── translations.py      # Multilingual dictionaries & templates (EN, HI, MR)
│   ├── models.py            # Pydantic data contracts (Request, Response, Breakdown)
│   ├── llm_client.py        # LLM client with local deterministic fallback
│   └── main.py              # FastAPI application exposing REST API endpoints
├── tests/
│   ├── __init__.py
│   └── test_engine.py       # Full test suite covering all requirements
├── demo.py                  # Interactive scenario demonstrations
├── requirements.txt         # Dependencies
└── README.md                # Documentation
```

---

## Key Capabilities

1. **Suspicious Invoice Description Analysis**: Detects refund scams, fake antivirus renewals, crypto authorizations, and embedded call-center lures.
2. **Fake Urgency Detection**: Identifies pressure tactics such as "within 24 hours", "automatically debited", "call immediately", and legal intimidation.
3. **Amount Anomaly Detection**: Highlights typical scam price points (e.g. `$499.99`, `$699.99`), high-volume deviations against user baselines, and currency inconsistencies.
4. **Merchant-Recipient Mismatch**: Automatically detects major enterprise impersonation (e.g. Geek Squad, PayPal, Norton, Apple) originating from public free webmail accounts (`@gmail.com`, `@yahoo.com`, etc.).
5. **Calibrated Risk Scores (0–100)**:
   - `0 - 30`: **LOW** (Approve)
   - `31 - 69`: **MEDIUM** (Review)
   - `70 - 89`: **HIGH** (Block / Warn)
   - `90 - 100`: **CRITICAL** (Block immediately)
6. **Multilingual Explanations**:
   - **English (`en`)**: Clear, jargon-free security warnings and safety steps.
   - **Hindi (`hi`)**: स्वाभाविक हिंदी में स्पष्टीकरण एवं सुरक्षा मार्गदर्शन (Devanagari script).
   - **Marathi (`mr`)**: नैसर्गिक मराठीत स्पष्टीकरण आणि कृतीयोग्य सुरक्षा सूचना (Devanagari script).

---

## API Endpoints

Start the FastAPI server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs are available at `http://localhost:8000/docs`.

### Analyze Invoice: `POST /api/v1/analyze`

#### Sample Request (Geek Squad Scam):
```json
{
  "invoice_id": "INV-2026-94812",
  "merchant_name": "Geek Squad Protection Plan",
  "recipient_name": "John Doe",
  "sender_email": "geeksquad.billingdesk9481@gmail.com",
  "amount": 499.99,
  "currency": "USD",
  "invoice_description": "Annual renewal of Geek Squad 24/7 Security. $499.99 will be automatically debited from your checking account within 24 hours. If you did not authorize this charge or wish to cancel, CALL IMMEDIATELY at +1 (800) 555-0199.",
  "language": "hi"
}
```

#### Sample Response:
```json
{
  "invoice_id": "INV-2026-94812",
  "risk_score": 98,
  "risk_level": "CRITICAL",
  "decision": "BLOCK",
  "safeguard_invoked": true,
  "safeguard_details": {
    "invoked": true,
    "scam_category": "tech_support_refund_scam",
    "confidence": 0.96,
    "scam_indicators": [
      "phantom_auto_debit_threat",
      "inbound_call_lure",
      "antivirus_subscription_impersonation",
      "artificial_deadline_pressure"
    ],
    "reasoning": "Identified tech_support_refund_scam targeting victim via fake invoice with 4 manipulation tactics. Coercion rating: 9.5/10."
  },
  "explanation": "चेतावनी: इस चालान (Invoice) को उच्च जोखिम (98/100) के रूप में चिह्नित किया गया है। यह 'Geek Squad Protection Plan' के नाम पर किया गया संभावित घोटाला है।",
  "recommendations": [
    "इस इनवॉइस विवरण या ईमेल में दिए गए किसी भी फोन नंबर पर कॉल न करें।",
    "इस भुगतान को अधिकृत (Authorize) न करें और न ही अपना बैंक विवरण या ओटीपी साझा करें।",
    "प्रेषक के कहने पर कभी भी रिमोट एक्सेस ऐप (जैसे AnyDesk, TeamViewer, या UltraViewer) डाउनलोड न करें।",
    "इस इनवॉइस को धोखाधड़ी रोकथाम विभाग को अग्रेषित (Forward) करें और इसे फ़िशिंग के रूप में चिह्नित करें।"
  ],
  "breakdown": {
    "urgency_score": 24.0,
    "amount_anomaly_score": 20.0,
    "merchant_mismatch_score": 30.0,
    "scam_language_score": 24.0,
    "total_score": 98
  }
}
```

---

## Running Tests & Demo

Run pytest:
```bash
python -m pytest -v tests/test_engine.py
```

Run demo scenarios:
```bash
python demo.py
```

