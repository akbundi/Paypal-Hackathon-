"""
Core Fraud Analyzer Orchestrator.
Coordinates GPT-OSS-120B, GPT-OSS-Safeguard-120B (selectively), Python Anomaly Detection,
and Rules Engine scoring.
"""

import time
import logging
from typing import List, Dict, Any, Optional

from .models import (
    InvoiceRequest,
    FraudAnalysisResponse,
    RiskIndicator,
    SafeguardAnalysis,
    ScoreBreakdown
)
from .risk_scoring import (
    AmountAnomalyDetector,
    MerchantMismatchDetector,
    FakeUrgencyDetector,
    ScamRiskScoringEngine
)
from .explainability import ExplainabilityEngine
from .llm_client import LLMClient

logger = logging.getLogger("fraud_engine.analyzer")


class ScamDetectionEngine:
    """End-to-end scam detection engine."""

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()
        self.explainability_engine = ExplainabilityEngine(self.llm_client)

    def analyze_invoice(self, request: InvoiceRequest) -> FraudAnalysisResponse:
        """
        Executes complete multi-stage analysis pipeline.
        Selectively invokes GPT-OSS-Safeguard-120B when suspicious signals are present.
        """
        start_time = time.time()
        all_indicators: List[RiskIndicator] = []

        # -------------------------------------------------------------
        # Stage 1: Python Amount Anomaly Detection
        # -------------------------------------------------------------
        amount_score, amount_indicators = AmountAnomalyDetector.analyze_amount(
            amount=request.amount,
            currency=request.currency,
            payer_profile=request.payer_profile
        )
        all_indicators.extend(amount_indicators)

        # -------------------------------------------------------------
        # Stage 2: Python + LLM Merchant Mismatch Detection
        # -------------------------------------------------------------
        mismatch_score, mismatch_indicators = MerchantMismatchDetector.analyze_mismatch(
            merchant_name=request.merchant_name,
            sender_email=request.sender_email,
            recipient_name=request.recipient_name
        )
        all_indicators.extend(mismatch_indicators)

        # -------------------------------------------------------------
        # Stage 3: Python Fake Urgency Detection
        # -------------------------------------------------------------
        urgency_score, urgency_indicators = FakeUrgencyDetector.analyze_urgency(
            description=request.invoice_description
        )
        all_indicators.extend(urgency_indicators)

        # -------------------------------------------------------------
        # Stage 4: GPT-OSS-120B Invoice Understanding
        # -------------------------------------------------------------
        invoice_understanding = self.llm_client.run_invoice_understanding(
            merchant_name=request.merchant_name,
            sender_email=request.sender_email,
            recipient_name=request.recipient_name,
            amount=request.amount,
            currency=request.currency,
            invoice_description=request.invoice_description
        )

        embedded_contacts = invoice_understanding.get("embedded_contacts", [])
        remote_tools = invoice_understanding.get("remote_software_mentioned", [])
        intent = invoice_understanding.get("detected_intent", "unknown")
        trigger_safeguard = invoice_understanding.get("trigger_safeguard", False)

        # Flag embedded phone numbers in invoice text (hallmark of tech support scams)
        if embedded_contacts:
            contacts_str = ", ".join(embedded_contacts)
            all_indicators.append(RiskIndicator(
                category="suspicious_contact",
                severity="critical" if mismatch_score > 0 else "high",
                description=f"Invoice text embeds direct contact phone number(s): {contacts_str}. Legitimate invoices do not urge calls to cancel.",
                evidence=contacts_str,
                score_impact=15.0
            ))

        # Flag remote software mentions (AnyDesk, TeamViewer)
        if remote_tools:
            tools_str = ", ".join(remote_tools)
            all_indicators.append(RiskIndicator(
                category="scam_language",
                severity="critical",
                description=f"Invoice references remote access software: {tools_str}. This is an active remote takeover threat.",
                evidence=tools_str,
                score_impact=25.0
            ))

        # -------------------------------------------------------------
        # Stage 5: Selective Invocation of GPT-OSS-Safeguard-120B
        # -------------------------------------------------------------
        # "One important point: You don't need to call both 120B models for every transaction.
        #  Use Safeguard selectively when suspicious language needs deeper classification."
        needs_safeguard = (
            trigger_safeguard or
            urgency_score >= 8.0 or
            mismatch_score >= 20.0 or
            len(embedded_contacts) > 0 or
            len(remote_tools) > 0 or
            intent not in ["legitimate_service", "unknown"]
        )

        safeguard_analysis = SafeguardAnalysis(invoked=False)
        scam_language_score = 0.0

        if needs_safeguard:
            # SELECTIVE INVOCATION
            logger.info("Suspicious language detected: invoking GPT-OSS-Safeguard-120B for deep classification.")
            safeguard_raw = self.llm_client.run_scam_safeguard(
                merchant_name=request.merchant_name,
                sender_email=request.sender_email,
                amount=request.amount,
                currency=request.currency,
                invoice_description=request.invoice_description
            )
            
            is_scam = safeguard_raw.get("is_scam", False)
            category = safeguard_raw.get("scam_category", "unclassified")
            confidence = safeguard_raw.get("confidence", 0.0)
            tactics = safeguard_raw.get("manipulation_tactics", [])
            reasoning = safeguard_raw.get("detailed_reasoning", "")

            safeguard_analysis = SafeguardAnalysis(
                invoked=True,
                scam_category=category,
                confidence=confidence,
                scam_indicators=tactics,
                reasoning=reasoning
            )

            if is_scam:
                # Calculate scam language score (up to 25 pts)
                scam_language_score = min(confidence * 25.0, 25.0)
                all_indicators.append(RiskIndicator(
                    category="scam_language",
                    severity="high" if confidence < 0.9 else "critical",
                    description=f"Safeguard classified scam taxonomy: '{category}' with {confidence*100:.1f}% confidence.",
                    evidence=", ".join(tactics) if tactics else None,
                    score_impact=scam_language_score
                ))
        else:
            logger.info("Invoice clean/routine: skipping GPT-OSS-Safeguard-120B invocation.")

        # -------------------------------------------------------------
        # Stage 6: Python Rules Engine Risk Scoring (0-100)
        # -------------------------------------------------------------
        breakdown = ScamRiskScoringEngine.calculate_total_score(
            urgency_score=urgency_score,
            amount_score=amount_score,
            mismatch_score=mismatch_score,
            scam_language_score=scam_language_score,
            has_embedded_phone=bool(embedded_contacts),
            has_remote_tool=bool(remote_tools)
        )

        risk_score = breakdown.total_score
        risk_level, decision = ScamRiskScoringEngine.determine_decision(risk_score)

        # -------------------------------------------------------------
        # Stage 7: Explainability & Multilingual Output (en, hi, mr)
        # -------------------------------------------------------------
        explanation, recommendations = self.explainability_engine.generate_explanation(
            language=request.language,
            invoice_id=request.invoice_id,
            merchant_name=request.merchant_name,
            sender_email=request.sender_email,
            amount=request.amount,
            currency=request.currency,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_indicators=all_indicators,
            safeguard_details=safeguard_analysis
        )

        processing_time_ms = round((time.time() - start_time) * 1000, 2)

        return FraudAnalysisResponse(
            invoice_id=request.invoice_id,
            risk_score=risk_score,
            risk_level=risk_level,
            decision=decision,
            risk_indicators=all_indicators,
            safeguard_invoked=safeguard_analysis.invoked,
            safeguard_details=safeguard_analysis if safeguard_analysis.invoked else None,
            explanation=explanation,
            recommendations=recommendations,
            breakdown=breakdown,
            metadata={
                "processing_time_ms": processing_time_ms,
                "models_used": {
                    "invoice_understanding": "GPT-OSS-120B",
                    "scam_language_safeguard": "GPT-OSS-Safeguard-120B" if safeguard_analysis.invoked else "BYPASSED",
                    "amount_anomaly": "Python",
                    "merchant_mismatch": "Python + GPT-OSS-120B",
                    "rules_engine": "Python",
                    "explainability": f"GPT-OSS-120B ({request.language.upper()})"
                },
                "language": request.language
            }
        )

