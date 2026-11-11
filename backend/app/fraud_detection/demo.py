"""
Interactive Demonstration of the AI-Powered Scam Detection Engine.
Runs through realistic real-world scenarios in English, Hindi, and Marathi,
demonstrating selective invocation of GPT-OSS-Safeguard-120B.
"""

import json
from app.models import InvoiceRequest, PayerProfile
from app.analyzer import ScamDetectionEngine


def print_banner(title: str):
    print("\n" + "=" * 80)
    print(f" {title} ")
    print("=" * 80)


def display_result(result):
    print(f"\n[Invoice ID]        : {result.invoice_id}")
    print(f"[Risk Score]         : {result.risk_score} / 100")
    print(f"[Risk Level]         : {result.risk_level}")
    print(f"[Decision]           : {result.decision}")
    print(f"[Safeguard Invoked?] : {'YES (GPT-OSS-Safeguard-120B invoked)' if result.safeguard_invoked else 'NO (Bypassed - latency & compute saved)'}")
    
    if result.safeguard_details:
        print(f"  └─ Scam Category   : {result.safeguard_details.scam_category}")
        print(f"  └─ Confidence      : {result.safeguard_details.confidence * 100:.1f}%")
        print(f"  └─ Tactics         : {', '.join(result.safeguard_details.scam_indicators)}")

    print("\n[Score Breakdown]:")
    print(f"  • Urgency Score          : {result.breakdown.urgency_score} / 25")
    print(f"  • Amount Anomaly Score   : {result.breakdown.amount_anomaly_score} / 20")
    print(f"  • Merchant Mismatch Score: {result.breakdown.merchant_mismatch_score} / 30")
    print(f"  • Scam Language Score    : {result.breakdown.scam_language_score} / 25")

    print(f"\n[Flagged Risk Indicators] ({len(result.risk_indicators)} found):")
    for idx, ind in enumerate(result.risk_indicators, 1):
        print(f"  {idx}. [{ind.severity.upper()}] {ind.description}")
        if ind.evidence:
            print(f"     Evidence: \"{ind.evidence}\"")

    print(f"\n[Explanation]:\n  {result.explanation}")
    
    print("\n[Actionable Recommendations]:")
    for idx, rec in enumerate(result.recommendations, 1):
        print(f"  {idx}. {rec}")


def main():
    engine = ScamDetectionEngine()

    # -------------------------------------------------------------------------
    # Scenario 1: Legitimate Monthly Subscription (Safeguard Bypassed)
    # -------------------------------------------------------------------------
    print_banner("SCENARIO 1: Legitimate Subscription Invoice (Safeguard Bypassed)")
    req_clean = InvoiceRequest(
        invoice_id="INV-LEGIT-001",
        merchant_name="Netflix Inc.",
        recipient_name="David Miller",
        sender_email="billing@mailer.netflix.com",
        amount=19.99,
        currency="USD",
        invoice_description="Thank you for subscribing to Netflix Premium. Your monthly renewal fee of $19.99 was processed. Manage your account settings online anytime.",
        language="en"
    )
    res_clean = engine.analyze_invoice(req_clean)
    display_result(res_clean)

    # -------------------------------------------------------------------------
    # Scenario 2: Geek Squad Tech Support Refund Scam (English)
    # -------------------------------------------------------------------------
    print_banner("SCENARIO 2: Geek Squad Tech Support Scam (English)")
    req_geek = InvoiceRequest(
        invoice_id="INV-GEEK-002",
        merchant_name="Geek Squad Protection Plan",
        recipient_name="Sarah Jenkins",
        sender_email="geeksquad.renewaldept491@gmail.com",
        amount=499.99,
        currency="USD",
        invoice_description="Notice: Your 3-year Geek Squad Total Tech Care has auto-renewed. $499.99 will be automatically debited from your checking account within 24 hours. If you did not authorize this charge or wish to cancel, CALL IMMEDIATELY at +1 (800) 555-0199. Failure to call will result in immediate charge deduction.",
        language="en",
        payer_profile=PayerProfile(average_transaction_amount=35.0)
    )
    res_geek = engine.analyze_invoice(req_geek)
    display_result(res_geek)

    # -------------------------------------------------------------------------
    # Scenario 3: PayPal Bitcoin / Wire Authorization Scam (Hindi - हिंदी)
    # -------------------------------------------------------------------------
    print_banner("SCENARIO 3: PayPal Bitcoin Scam - Hindi (हिंदी) Explanation")
    req_hindi = InvoiceRequest(
        invoice_id="INV-HINDI-003",
        merchant_name="PayPal Inc Billing Team",
        recipient_name="Rajesh Kumar",
        sender_email="paypal.security-resolution@yahoo.com",
        amount=849.00,
        currency="USD",
        invoice_description="Urgent Alert: You authorized payment of $849.00 to Bitcoin Exchange Ltd. If you did not make this transaction, call our fraud desk immediately at 1-888-234-9011 within 24 hours to dispute and cancel payment.",
        language="hi"
    )
    res_hindi = engine.analyze_invoice(req_hindi)
    display_result(res_hindi)

    # -------------------------------------------------------------------------
    # Scenario 4: Norton Antivirus Renewal Scam (Marathi - मराठी)
    # -------------------------------------------------------------------------
    print_banner("SCENARIO 4: Norton Antivirus Scam - Marathi (मराठी) Explanation")
    req_marathi = InvoiceRequest(
        invoice_id="INV-MARATHI-004",
        merchant_name="Norton LifeLock Security",
        recipient_name="Ganesh Deshmukh",
        sender_email="norton.lifelock.desk98@gmail.com",
        amount=699.99,
        currency="USD",
        invoice_description="Invoice Confirmation: Your annual subscription for Norton 360 has auto-renewed. $699.99 deducted from your checking account. Call toll-free immediately at +1-800-432-8765 within 48 hours to cancel or refund.",
        language="mr"
    )
    res_marathi = engine.analyze_invoice(req_marathi)
    display_result(res_marathi)


if __name__ == "__main__":
    main()

