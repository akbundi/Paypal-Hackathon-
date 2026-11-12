"""
Rules Engine for Scam Risk Scoring, Amount Anomaly Detection, and Merchant Mismatch.
Computes calibrated fraud risk scores (0-100) using deterministic Python logic.
"""

import re
from typing import Dict, Any, List, Tuple, Optional
from .models import RiskIndicator, ScoreBreakdown, PayerProfile


# Enterprise brands frequently impersonated in invoice scams
KNOWN_ENTERPRISE_BRANDS = {
    "paypal": ["paypal.com"],
    "geek squad": ["bestbuy.com", "geeksquad.com"],
    "best buy": ["bestbuy.com"],
    "norton": ["norton.com", "genstatic.com", "broadcom.com"],
    "mcafee": ["mcafee.com"],
    "apple": ["apple.com", "email.apple.com"],
    "amazon": ["amazon.com"],
    "microsoft": ["microsoft.com", "office.com"],
    "netflix": ["netflix.com"],
    "google": ["google.com"],
    "symantec": ["broadcom.com", "symantec.com"]
}

# Free webmail services that legitimate enterprises never use for official billing
FREE_WEBMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "proton.me", "protonmail.com", "aol.com", "icloud.com",
    "zoho.com", "mail.com", "gmx.com", "yandex.com"
}


class AmountAnomalyDetector:
    """Python-based amount anomaly detector."""

    # Typical tech support scam charge benchmarks
    SCAM_AMOUNT_RANGES = {
        "USD": (199.0, 1499.0),
        "EUR": (180.0, 1350.0),
        "GBP": (150.0, 1200.0),
        "INR": (15000.0, 120000.0)
    }

    @classmethod
    def analyze_amount(
        cls,
        amount: float,
        currency: str,
        payer_profile: Optional[PayerProfile] = None
    ) -> Tuple[float, List[RiskIndicator]]:
        """
        Calculates amount anomaly score (0 to 20 pts) and risk indicators.
        """
        score = 0.0
        indicators = []
        curr = currency.upper()

        # 1. Check for common scam price trap: ends in .99, .95, or .00 in typical tech support band
        cents = round(amount - int(amount), 2)
        min_range, max_range = cls.SCAM_AMOUNT_RANGES.get(curr, (199.0, 1499.0))

        if min_range <= amount <= max_range:
            if cents in [0.99, 0.95]:
                score += 10.0
                indicators.append(RiskIndicator(
                    category="suspicious_amount",
                    severity="medium",
                    description=f"Amount {amount:.2f} {curr} matches classic fake-subscription bait pricing (.99 trap).",
                    evidence=f"{amount:.2f} {curr}",
                    score_impact=10.0
                ))
            elif amount in [399.0, 499.0, 599.0, 699.0, 799.0, 899.0, 999.0, 1200.0, 1500.0]:
                score += 8.0
                indicators.append(RiskIndicator(
                    category="suspicious_amount",
                    severity="medium",
                    description=f"Amount {amount:.2f} {curr} matches recurring round-number tech support scam charges.",
                    evidence=f"{amount:.2f} {curr}",
                    score_impact=8.0
                ))
            else:
                score += 4.0

        # 2. Check deviation against payer historical baseline if provided
        if payer_profile and payer_profile.average_transaction_amount:
            avg = payer_profile.average_transaction_amount
            if avg > 0:
                ratio = amount / avg
                if ratio >= 8.0:
                    score += 10.0
                    indicators.append(RiskIndicator(
                        category="suspicious_amount",
                        severity="high",
                        description=f"Invoice amount is {ratio:.1f}x higher than user's historical average of {avg:.2f} {curr}.",
                        evidence=f"{amount:.2f} vs avg {avg:.2f}",
                        score_impact=10.0
                    ))
                elif ratio >= 4.0:
                    score += 5.0

        # Cap score contribution to 20
        final_score = min(score, 20.0)
        return final_score, indicators


class MerchantMismatchDetector:
    """Python + LLM merchant-recipient integrity verification."""

    @classmethod
    def extract_domain(cls, email: str) -> str:
        parts = email.strip().split("@")
        return parts[1].lower() if len(parts) > 1 else ""

    @classmethod
    def analyze_mismatch(
        cls,
        merchant_name: str,
        sender_email: str,
        recipient_name: str
    ) -> Tuple[float, List[RiskIndicator]]:
        """
        Evaluates merchant mismatch score (0 to 30 pts) and flags discrepancies.
        """
        score = 0.0
        indicators = []
        m_lower = merchant_name.lower().strip()
        sender_domain = cls.extract_domain(sender_email)

        # 1. Detect if claimed merchant is a known enterprise using a free webmail account
        for brand, valid_domains in KNOWN_ENTERPRISE_BRANDS.items():
            if brand in m_lower:
                if sender_domain in FREE_WEBMAIL_DOMAINS:
                    score += 30.0
                    indicators.append(RiskIndicator(
                        category="merchant_mismatch",
                        severity="critical",
                        description=(
                            f"Major enterprise brand '{merchant_name}' impersonation: "
                            f"sent from public free email address '{sender_email}' instead of official domain."
                        ),
                        evidence=f"Claimed: {merchant_name} | Sender: {sender_email}",
                        score_impact=30.0
                    ))
                    break
                elif not any(sender_domain.endswith(vd) for vd in valid_domains):
                    # Unrecognized domain claiming to be this brand
                    score += 25.0
                    indicators.append(RiskIndicator(
                        category="merchant_mismatch",
                        severity="high",
                        description=(
                            f"Sender domain '{sender_domain}' is not an authorized domain for '{merchant_name}'."
                        ),
                        evidence=f"Claimed: {merchant_name} | Domain: {sender_domain}",
                        score_impact=25.0
                    ))
                    break

        # 2. Generic check: merchant claims to be "Billing Department" or "Customer Support" on free webmail
        if score == 0.0:
            support_terms = ["billing", "support", "invoice", "desk", "service", "security"]
            if any(term in m_lower for term in support_terms) and sender_domain in FREE_WEBMAIL_DOMAINS:
                score += 20.0
                indicators.append(RiskIndicator(
                    category="merchant_mismatch",
                    severity="high",
                    description=f"Commercial entity '{merchant_name}' is sending invoices from public email domain '@{sender_domain}'.",
                    evidence=sender_email,
                    score_impact=20.0
                ))

        # 3. Recipient name equals merchant name or recipient is generic placeholder
        r_lower = recipient_name.lower().strip()
        if r_lower in ["customer", "client", "user", "valuable customer", "undisclosed-recipients"]:
            score += 5.0
            indicators.append(RiskIndicator(
                category="merchant_mismatch",
                severity="low",
                description="Invoice lacks personal recipient name and uses generic greeting.",
                evidence=recipient_name,
                score_impact=5.0
            ))

        final_score = min(score, 30.0)
        return final_score, indicators


class FakeUrgencyDetector:
    """Python detection for fake urgency and coercion."""

    URGENCY_REGEX = [
        (r"\bwithin 24 hours?\b", "Within 24 hours pressure", 8.0),
        (r"\bwithin 48 hours?\b", "Within 48 hours pressure", 5.0),
        (r"\bcall immediately\b", "Call immediately demand", 9.0),
        (r"\bautomatically debited\b|\bauto-debit\b", "Auto-debit intimidation", 7.0),
        (r"\bdeducted from your (account|checking|balance)\b", "Account deduction threat", 8.0),
        (r"\bavoid (charges|disconnection|suspension)\b", "Penalty avoidance lure", 6.0),
        (r"\blegal action\b|\barrest warrant\b|\blaw enforcement\b", "Legal intimidation", 10.0),
        (r"\bcancel immediately\b|\bstop this charge\b", "Cancellation bait", 7.0)
    ]

    @classmethod
    def analyze_urgency(cls, description: str) -> Tuple[float, List[RiskIndicator]]:
        """
        Calculates urgency score (0 to 25 pts) and extracts evidence.
        """
        score = 0.0
        indicators = []
        desc_lower = description.lower()

        for pattern, label, weight in cls.URGENCY_REGEX:
            match = re.search(pattern, desc_lower)
            if match:
                score += weight
                indicators.append(RiskIndicator(
                    category="fake_urgency",
                    severity="high" if weight >= 8.0 else "medium",
                    description=f"Fake urgency detected: {label}.",
                    evidence=match.group(0),
                    score_impact=weight
                ))

        final_score = min(score, 25.0)
        return final_score, indicators


class ScamRiskScoringEngine:
    """Comprehensive rules engine synthesizing risk scores (0-100)."""

    @classmethod
    def calculate_total_score(
        cls,
        urgency_score: float,
        amount_score: float,
        mismatch_score: float,
        scam_language_score: float,
        has_embedded_phone: bool,
        has_remote_tool: bool
    ) -> ScoreBreakdown:
        """
        Synthesizes individual components into 0-100 score with compound rules.
        """
        raw_total = urgency_score + amount_score + mismatch_score + scam_language_score

        # Compound rule 1: Free webmail + Brand impersonation + Urgent call lure = Minimum 85
        if mismatch_score >= 25.0 and urgency_score >= 12.0 and has_embedded_phone:
            raw_total = max(raw_total, 88.0)

        # Compound rule 2: Remote tool mentioned (AnyDesk/TeamViewer) = Severe risk boost
        if has_remote_tool:
            raw_total = max(raw_total + 15.0, 92.0)

        clamped_total = int(round(min(max(raw_total, 0.0), 100.0)))

        return ScoreBreakdown(
            urgency_score=round(urgency_score, 1),
            amount_anomaly_score=round(amount_score, 1),
            merchant_mismatch_score=round(mismatch_score, 1),
            scam_language_score=round(scam_language_score, 1),
            total_score=clamped_total
        )

    @classmethod
    def determine_decision(cls, total_score: int) -> Tuple[str, str]:
        """Maps score to risk level and recommended system decision."""
        if total_score >= 90:
            return "CRITICAL", "BLOCK"
        elif total_score >= 70:
            return "HIGH", "BLOCK"
        elif total_score >= 31:
            return "MEDIUM", "REVIEW"
        else:
            return "LOW", "APPROVE"

