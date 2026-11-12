"""
Explainability Module.
Generates user-friendly, transparent explanations and actionable recommendations
in English, Hindi, and Marathi using GPT-OSS-120B and localization templates.
"""

from typing import List, Dict, Any, Tuple
from .models import RiskIndicator, SafeguardAnalysis
from .translations import build_localized_explanation, CATEGORY_NAMES
from .llm_client import LLMClient


class ExplainabilityEngine:
    """Generates transparent, human-readable explanations in English, Hindi, and Marathi."""

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def generate_explanation(
        self,
        language: str,
        invoice_id: str,
        merchant_name: str,
        sender_email: str,
        amount: float,
        currency: str,
        risk_score: int,
        risk_level: str,
        risk_indicators: List[RiskIndicator],
        safeguard_details: SafeguardAnalysis = None
    ) -> Tuple[str, List[str]]:
        """
        Produces understandable explanations and actionable recommendations
        in the requested language ('en', 'hi', or 'mr').
        """
        lang = language.lower() if language in ["en", "hi", "mr"] else "en"

        # Format indicators for prompt context
        indicator_lines = []
        indicator_dicts = []
        for ind in risk_indicators:
            cat_label = CATEGORY_NAMES.get(lang, CATEGORY_NAMES["en"]).get(ind.category, ind.category)
            evidence_str = f" [Evidence: '{ind.evidence}']" if ind.evidence else ""
            indicator_lines.append(f"- {cat_label}: {ind.description}{evidence_str}")
            indicator_dicts.append({
                "category": ind.category,
                "evidence": ind.evidence or ind.description
            })

        indicators_text = "\n".join(indicator_lines) if indicator_lines else "None detected."

        safeguard_summary = "None"
        if safeguard_details and safeguard_details.invoked:
            safeguard_summary = (
                f"{safeguard_details.scam_category} (confidence: {safeguard_details.confidence:.2f})"
            )

        # Call GPT-OSS-120B explainability (with fallback to verified localization engine)
        llm_result = self.llm_client.run_explainability(
            language=lang,
            invoice_id=invoice_id,
            merchant_name=merchant_name,
            sender_email=sender_email,
            amount=amount,
            currency=currency,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_indicators_text=indicators_text,
            safeguard_summary=safeguard_summary
        )

        explanation = llm_result.get("explanation")
        recommendations = llm_result.get("recommendations", [])

        # If LLM response was incomplete, fallback to deterministic localization builder
        if not explanation or not recommendations:
            local_res = build_localized_explanation(
                language=lang,
                risk_level=risk_level,
                risk_score=risk_score,
                merchant_name=merchant_name,
                indicators=indicator_dicts,
                safeguard_category=safeguard_summary
            )
            explanation = local_res["explanation"]
            recommendations = local_res["recommendations"]

        return explanation, recommendations

