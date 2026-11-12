"""
Data models and schemas for Scam Detection Engine.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class PayerProfile(BaseModel):
    """Historical context for the recipient/payer to assess anomalies."""
    average_transaction_amount: Optional[float] = Field(default=None, description="Typical average amount spent by user")
    user_tier: Optional[str] = Field(default="standard", description="Account tier: standard, business, premier")
    country: Optional[str] = Field(default="US", description="Account country code")
    is_elderly_or_vulnerable: Optional[bool] = Field(default=False, description="Flag for accounts vulnerable to tech support scams")


class InvoiceRequest(BaseModel):
    """Incoming invoice payload for scam detection."""
    invoice_id: Optional[str] = Field(default="INV-GENERIC", description="Unique invoice identifier")
    merchant_name: str = Field(..., description="Claimed merchant or business name (e.g., 'Geek Squad', 'Apple Inc.')")
    recipient_name: str = Field(..., description="Name of the person being billed")
    sender_email: str = Field(..., description="Sender's email address")
    amount: float = Field(..., ge=0.0, description="Invoiced amount")
    currency: str = Field(default="USD", description="Currency ISO code (USD, INR, EUR, GBP)")
    invoice_description: str = Field(..., description="Invoice description, notes, line items, and terms")
    due_date: Optional[str] = Field(default=None, description="Due date string if present")
    language: Literal["en", "hi", "mr"] = Field(
        default="en",
        description="Desired explanation language: 'en' (English), 'hi' (Hindi), 'mr' (Marathi)"
    )
    payer_profile: Optional[PayerProfile] = Field(default=None, description="Optional payer profile")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "invoice_id": "INV-2026-94812",
                "merchant_name": "Geek Squad Total Tech Support",
                "recipient_name": "John Doe",
                "sender_email": "geeksquad.billingdesk9481@gmail.com",
                "amount": 499.99,
                "currency": "USD",
                "invoice_description": "Auto-renewal charge for 3-Year Total Tech Protection. $499.99 will be automatically debited from your checking account within 24 hours. If you did not authorize this charge or wish to cancel, CALL IMMEDIATELY at +1 (800) 555-0199. Do not ignore this email.",
                "language": "en"
            }
        }
    )


class RiskIndicator(BaseModel):
    """An individual flagged risk indicator."""
    category: Literal[
        "fake_urgency",
        "merchant_mismatch",
        "suspicious_amount",
        "scam_language",
        "suspicious_contact"
    ]
    severity: Literal["low", "medium", "high", "critical"]
    description: str
    evidence: Optional[str] = None
    score_impact: float = Field(ge=0.0, le=100.0)


class SafeguardAnalysis(BaseModel):
    """Detailed output from selective invocation of GPT-OSS-Safeguard-120B."""
    invoked: bool = False
    scam_category: Optional[str] = None  # e.g., tech_support_scam, advance_fee, phishing
    confidence: float = 0.0  # 0.0 to 1.0
    scam_indicators: List[str] = Field(default_factory=list)
    reasoning: Optional[str] = None


class ScoreBreakdown(BaseModel):
    """Component contribution to total risk score."""
    urgency_score: float = Field(ge=0.0, le=25.0)
    amount_anomaly_score: float = Field(ge=0.0, le=20.0)
    merchant_mismatch_score: float = Field(ge=0.0, le=30.0)
    scam_language_score: float = Field(ge=0.0, le=25.0)
    total_score: int = Field(ge=0, le=100)


class FraudAnalysisResponse(BaseModel):
    """API response containing risk score, indicators, and recommendations."""
    invoice_id: str
    risk_score: int = Field(ge=0, le=100, description="Fraud risk score from 0 (clean) to 100 (critical fraud)")
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    decision: Literal["APPROVE", "REVIEW", "BLOCK"]
    risk_indicators: List[RiskIndicator]
    safeguard_invoked: bool = Field(description="Whether GPT-OSS-Safeguard-120B was invoked selectively")
    safeguard_details: Optional[SafeguardAnalysis] = None
    explanation: str = Field(description="Human-readable explanation in requested language")
    recommendations: List[str] = Field(description="Actionable safety recommendations in requested language")
    breakdown: ScoreBreakdown
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BatchAnalysisRequest(BaseModel):
    """Batch analysis request."""
    invoices: List[InvoiceRequest]


class BatchAnalysisResponse(BaseModel):
    """Batch analysis response."""
    results: List[FraudAnalysisResponse]
    total_processed: int
    high_risk_count: int
