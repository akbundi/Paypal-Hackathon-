"""
Comprehensive Test Suite for AI-Powered Scam Detection Engine.
Tests all required capabilities:
- Suspicious invoice descriptions
- Fake urgency detection
- Amount anomaly detection
- Merchant mismatch detection
- Risk score (0-100) rules engine
- Understandable explanations in English, Hindi, and Marathi
- Selective invocation of GPT-OSS-Safeguard-120B
"""

import pytest
from app.models import InvoiceRequest, PayerProfile
from app.analyzer import ScamDetectionEngine
from app.risk_scoring import (
    AmountAnomalyDetector,
    MerchantMismatchDetector,
    FakeUrgencyDetector,
    ScamRiskScoringEngine
)


@pytest.fixture
def engine():
    return ScamDetectionEngine()


def test_clean_legitimate_invoice(engine):
    """Clean invoice: should have low risk and BYPASS Safeguard model."""
    req = InvoiceRequest(
        invoice_id="INV-CLEAN-001",
        merchant_name="Netflix Inc.",
        recipient_name="Alice Smith",
        sender_email="info@mailer.netflix.com",
        amount=19.99,
        currency="USD",
        invoice_description="Your monthly Standard subscription for Netflix has been renewed successfully. Thank you for being a customer.",
        language="en"
    )
    result = engine.analyze_invoice(req)

    assert result.risk_score <= 30
    assert result.risk_level == "LOW"
    assert result.decision == "APPROVE"
    # Selective invocation: Safeguard MUST be bypassed for clean invoice!
    assert result.safeguard_invoked is False
    assert result.safeguard_details is None
    assert "low risk" in result.explanation.lower()
    assert len(result.recommendations) > 0


def test_tech_support_scam_with_fake_urgency_and_mismatch(engine):
    """High-risk tech support scam: triggers urgency, mismatch, amount anomaly, and Safeguard."""
    req = InvoiceRequest(
        invoice_id="INV-SCAM-002",
        merchant_name="Geek Squad Total Support",
        recipient_name="Robert Johnson",
        sender_email="geeksquad.billingdesk9481@gmail.com",
        amount=499.99,
        currency="USD",
        invoice_description=(
            "Annual renewal of Geek Squad 24/7 Security. $499.99 will be automatically debited "
            "from your checking account within 24 hours. If you did not authorize this charge or wish to cancel, "
            "CALL IMMEDIATELY at +1 (800) 555-0199. AnyDesk remote session may be initiated by our tech support."
        ),
        language="en"
    )
    result = engine.analyze_invoice(req)

    assert result.risk_score >= 80
    assert result.risk_level in ["HIGH", "CRITICAL"]
    assert result.decision == "BLOCK"
    # Selective invocation: Safeguard MUST be invoked for suspicious language!
    assert result.safeguard_invoked is True
    assert result.safeguard_details is not None
    assert result.safeguard_details.scam_category in ["tech_support_refund_scam", "brand_impersonation"]
    
    # Check indicators
    categories = [ind.category for ind in result.risk_indicators]
    assert "fake_urgency" in categories
    assert "merchant_mismatch" in categories
    assert "suspicious_amount" in categories
    assert "suspicious_contact" in categories


def test_hindi_explanation_generation(engine):
    """Verify Hindi explanation and security recommendations."""
    req = InvoiceRequest(
        invoice_id="INV-SCAM-HI",
        merchant_name="PayPal Security Department",
        recipient_name="Amit Sharma",
        sender_email="paypal.security.alerts749@yahoo.com",
        amount=899.00,
        currency="USD",
        invoice_description="Urgent notice: Unauthorized transaction of $899.00 detected. Call immediately at 1-888-401-2290 within 24 hours to cancel.",
        language="hi"
    )
    result = engine.analyze_invoice(req)

    assert result.risk_score >= 70
    assert result.safeguard_invoked is True
    # Verify Hindi script (Devanagari)
    assert any(ord(char) >= 0x0900 and ord(char) <= 0x097F for char in result.explanation)
    # Check that Hindi recommendations are populated
    assert len(result.recommendations) >= 3
    assert any("कॉल न करें" in rec or "भुगतान" in rec for rec in result.recommendations)


def test_marathi_explanation_generation(engine):
    """Verify Marathi explanation and security recommendations."""
    req = InvoiceRequest(
        invoice_id="INV-SCAM-MR",
        merchant_name="Norton Antivirus LifeLock",
        recipient_name="Sunil Patil",
        sender_email="norton.billing442@gmail.com",
        amount=649.99,
        currency="USD",
        invoice_description="Your Norton LifeLock has auto-renewed. $649.99 deducted from your account. To cancel immediately call +1-800-421-9988.",
        language="mr"
    )
    result = engine.analyze_invoice(req)

    assert result.risk_score >= 70
    assert result.safeguard_invoked is True
    # Verify Marathi script (Devanagari)
    assert any(ord(char) >= 0x0900 and ord(char) <= 0x097F for char in result.explanation)
    # Check that Marathi recommendations are populated
    assert len(result.recommendations) >= 3
    assert any("कॉल करू नका" in rec or "पेमेंटला" in rec or "फसवणूक" in rec for rec in result.recommendations)


def test_amount_anomaly_historical_deviation():
    """Verify amount anomaly fires when amount significantly exceeds historical baseline."""
    profile = PayerProfile(average_transaction_amount=35.0)
    score, indicators = AmountAnomalyDetector.analyze_amount(
        amount=499.99,
        currency="USD",
        payer_profile=profile
    )
    assert score >= 15.0
    assert any("higher than user's historical average" in ind.description for ind in indicators)


def test_merchant_mismatch_free_webmail():
    """Verify merchant mismatch flags enterprise on free webmail."""
    score, indicators = MerchantMismatchDetector.analyze_mismatch(
        merchant_name="Apple Support",
        sender_email="applecare.billing2391@gmail.com",
        recipient_name="Customer"
    )
    assert score >= 25.0
    assert any(ind.category == "merchant_mismatch" for ind in indicators)


def test_fake_urgency_detector():
    """Verify detection of various urgency phrases."""
    score, indicators = FakeUrgencyDetector.analyze_urgency(
        "Action required within 24 hours. Call immediately to avoid charges or legal action."
    )
    assert score >= 20.0
    assert len(indicators) >= 2


def test_risk_score_clamping_and_bounds():
    """Ensure rules engine bounds score strictly between 0 and 100."""
    breakdown_high = ScamRiskScoringEngine.calculate_total_score(
        urgency_score=25.0,
        amount_score=20.0,
        mismatch_score=30.0,
        scam_language_score=25.0,
        has_embedded_phone=True,
        has_remote_tool=True
    )
    assert breakdown_high.total_score == 100

    breakdown_zero = ScamRiskScoringEngine.calculate_total_score(
        urgency_score=0.0,
        amount_score=0.0,
        mismatch_score=0.0,
        scam_language_score=0.0,
        has_embedded_phone=False,
        has_remote_tool=False
    )
    assert breakdown_zero.total_score == 0

