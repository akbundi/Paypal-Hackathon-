"""
LLM Client handling GPT-OSS-120B and GPT-OSS-Safeguard-120B.
Supports standard OpenAI-compatible endpoints with high-fidelity deterministic fallback.
"""

import os
import re
import json
import logging
from typing import Dict, Any, Optional

try:
    from dotenv import load_dotenv
    # Load .env from current directory or app directory
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

logger = logging.getLogger("fraud_engine.llm")

# AWS Bedrock Mantle Settings
BEDROCK_ENABLED = os.getenv("BEDROCK_ENABLED", "false").lower() in ("true", "1", "yes")
BEDROCK_USE_MANTLE = os.getenv("BEDROCK_USE_MANTLE", "false").lower() in ("true", "1", "yes")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-1")
AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK", "")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "openai.gpt-oss-safeguard-120b")
BEDROCK_TEMPERATURE = float(os.getenv("BEDROCK_TEMPERATURE", "0.1"))

# Model identifiers & Base URL resolution
if BEDROCK_ENABLED and BEDROCK_USE_MANTLE:
    OPENAI_BASE_URL = os.getenv(
        "OPENAI_BASE_URL",
        f"https://bedrock-mantle.{AWS_REGION}.api.aws/openai/v1"
    )
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", AWS_BEARER_TOKEN_BEDROCK)
    MODEL_SAFEGUARD_120B = BEDROCK_MODEL_ID
    MODEL_INVOICE_120B = os.getenv("GPT_OSS_120B_MODEL", "openai.gpt-oss-120b")
else:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
    MODEL_INVOICE_120B = os.getenv("GPT_OSS_120B_MODEL", "gpt-oss-120b")
    MODEL_SAFEGUARD_120B = os.getenv("GPT_OSS_SAFEGUARD_120B_MODEL", "gpt-oss-safeguard-120b")


class LLMClient:
    """Client for GPT-OSS-120B and GPT-OSS-Safeguard-120B models."""

    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.base_url = OPENAI_BASE_URL
        self._openai_client = None

        if self.api_key:
            try:
                import openai
                timeout = float(os.getenv("LLM_TIMEOUT", "6.0"))
                self._openai_client = openai.OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url if self.base_url else None,
                    timeout=timeout
                )
            except Exception as e:
                logger.warning(f"Could not initialize remote OpenAI client: {e}. Using deterministic engine.")

    def run_invoice_understanding(
        self,
        merchant_name: str,
        sender_email: str,
        recipient_name: str,
        amount: float,
        currency: str,
        invoice_description: str
    ) -> Dict[str, Any]:
        """
        Invoke GPT-OSS-120B for invoice understanding.
        Extracts intent, urgency signals, embedded numbers, and triage recommendation.
        """
        # If external OpenAI client configured, try calling it
        if self._openai_client:
            try:
                from .prompts import INVOICE_UNDERSTANDING_SYSTEM_PROMPT, INVOICE_UNDERSTANDING_USER_TEMPLATE
                user_content = INVOICE_UNDERSTANDING_USER_TEMPLATE.format(
                    merchant_name=merchant_name,
                    sender_email=sender_email,
                    recipient_name=recipient_name,
                    amount=amount,
                    currency=currency,
                    invoice_description=invoice_description
                )
                response = self._openai_client.chat.completions.create(
                    model=MODEL_INVOICE_120B,
                    messages=[
                        {"role": "system", "content": INVOICE_UNDERSTANDING_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                raw_json = response.choices[0].message.content
                return json.loads(raw_json)
            except Exception as e:
                logger.warning(f"Remote GPT-OSS-120B call failed ({e}); falling back to local engine.")

        # Local deterministic engine for GPT-OSS-120B Invoice Understanding
        return self._local_invoice_understanding(
            merchant_name, sender_email, recipient_name, amount, currency, invoice_description
        )

    def run_scam_safeguard(
        self,
        merchant_name: str,
        sender_email: str,
        amount: float,
        currency: str,
        invoice_description: str
    ) -> Dict[str, Any]:
        """
        SELECTIVE INVOCATION: Invoke GPT-OSS-Safeguard-120B for deep scam taxonomy classification.
        Only called when suspicious language or potential fraud triggers require deep classification.
        """
        if self._openai_client:
            try:
                from .prompts import SCAM_SAFEGUARD_SYSTEM_PROMPT, SCAM_SAFEGUARD_USER_TEMPLATE
                user_content = SCAM_SAFEGUARD_USER_TEMPLATE.format(
                    merchant_name=merchant_name,
                    sender_email=sender_email,
                    amount=amount,
                    currency=currency,
                    invoice_description=invoice_description
                )
                response = self._openai_client.chat.completions.create(
                    model=MODEL_SAFEGUARD_120B,
                    messages=[
                        {"role": "system", "content": SCAM_SAFEGUARD_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.0,
                    response_format={"type": "json_object"}
                )
                raw_json = response.choices[0].message.content
                return json.loads(raw_json)
            except Exception as e:
                logger.warning(f"Remote GPT-OSS-Safeguard-120B call failed ({e}); falling back to local engine.")

        # Local deterministic engine for GPT-OSS-Safeguard-120B
        return self._local_scam_safeguard(
            merchant_name, sender_email, amount, currency, invoice_description
        )

    def run_explainability(
        self,
        language: str,
        invoice_id: str,
        merchant_name: str,
        sender_email: str,
        amount: float,
        currency: str,
        risk_score: int,
        risk_level: str,
        risk_indicators_text: str,
        safeguard_summary: str
    ) -> Dict[str, Any]:
        """
        Invoke GPT-OSS-120B to synthesize understandable explanations
        in English, Hindi, or Marathi.
        """
        if self._openai_client:
            try:
                from .prompts import EXPLAINABILITY_SYSTEM_PROMPT, EXPLAINABILITY_USER_TEMPLATE
                user_content = EXPLAINABILITY_USER_TEMPLATE.format(
                    language=language,
                    invoice_id=invoice_id,
                    merchant_name=merchant_name,
                    sender_email=sender_email,
                    amount=amount,
                    currency=currency,
                    risk_score=risk_score,
                    risk_level=risk_level,
                    risk_indicators_text=risk_indicators_text,
                    safeguard_summary=safeguard_summary
                )
                response = self._openai_client.chat.completions.create(
                    model=MODEL_INVOICE_120B,
                    messages=[
                        {"role": "system", "content": EXPLAINABILITY_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                raw_json = response.choices[0].message.content
                return json.loads(raw_json)
            except Exception as e:
                logger.warning(f"Remote GPT-OSS-120B explainability call failed ({e}); falling back to translations engine.")

        # Use localized translation engine for explanation & recommendations
        from .translations import build_localized_explanation
        # Parse indicators text if available
        parsed_indicators = []
        for line in risk_indicators_text.splitlines():
            line = line.strip()
            if line:
                parsed_indicators.append({"category": "general", "evidence": line})
        return build_localized_explanation(
            language=language,
            risk_level=risk_level,
            risk_score=risk_score,
            merchant_name=merchant_name,
            indicators=parsed_indicators,
            safeguard_category=safeguard_summary
        )

    # -------------------------------------------------------------------------
    # Local Deterministic Engine Methods
    # -------------------------------------------------------------------------
    def _local_invoice_understanding(
        self,
        merchant_name: str,
        sender_email: str,
        recipient_name: str,
        amount: float,
        currency: str,
        invoice_description: str
    ) -> Dict[str, Any]:
        text_lower = invoice_description.lower()

        # Phone extraction (Toll-free / international numbers)
        phone_patterns = [
            r"\+?1?[-.\s]?\(?[8][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}",
            r"\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b",
            r"\+?\d{1,3}[-.\s]\d{3,4}[-.\s]\d{4,6}"
        ]
        embedded_contacts = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, invoice_description)
            for m in matches:
                if len(m.strip()) >= 10 and m not in embedded_contacts:
                    embedded_contacts.append(m.strip())

        # Urgency markers
        urgency_keywords = [
            "immediately", "within 24 hours", "within 48 hours", "auto-debit", "automatically debited",
            "cancel now", "avoid charges", "action required", "legal action", "arrest warrant",
            "overdue", "suspend your account", "urgent notice", "final notice", "call now"
        ]
        detected_urgency = [kw for kw in urgency_keywords if kw in text_lower]

        # Remote access tools
        remote_tools = ["anydesk", "teamviewer", "ultraviewer", "logmein", "zoho assist", "quick assist"]
        detected_remote = [tool for tool in remote_tools if tool in text_lower]

        # Scam keywords
        scam_keywords = [
            "tech support", "geek squad", "norton", "mcafee", "bitcoin", "crypto",
            "gift card", "walmart card", "apple card", "refund department", "billing desk",
            "help desk", "toll free", "not authorize", "call to dispute"
        ]
        scam_hits = [kw for kw in scam_keywords if kw in text_lower]

        # Intent detection
        if any(tool in detected_remote for tool in ["anydesk", "teamviewer"]) or "remote access" in text_lower:
            detected_intent = "remote_access_trojan_scam"
        elif "gift card" in text_lower or "crypto" in text_lower or "bitcoin" in text_lower:
            detected_intent = "crypto_or_giftcard_fraud"
        elif any(brand in text_lower for brand in ["geek squad", "norton", "mcafee", "tech support", "refund department"]):
            detected_intent = "tech_support_lure"
        elif len(detected_urgency) > 0 and len(embedded_contacts) > 0:
            detected_intent = "fake_invoice_phone_lure"
        else:
            detected_intent = "legitimate_service"

        # Triage calculation for Safeguard invocation
        has_urgency = len(detected_urgency) > 0
        has_phone = len(embedded_contacts) > 0
        has_scam_keyword = len(scam_hits) > 0

        # High suspicion conditions
        if detected_intent != "legitimate_service" or (has_urgency and has_phone) or has_scam_keyword:
            suspicion_level = "high"
            trigger_safeguard = True
        elif has_urgency or has_phone:
            suspicion_level = "medium"
            trigger_safeguard = True
        else:
            suspicion_level = "low"
            trigger_safeguard = False

        return {
            "detected_intent": detected_intent,
            "urgency_detected": has_urgency,
            "urgency_indicators": detected_urgency,
            "embedded_contacts": embedded_contacts,
            "remote_software_mentioned": detected_remote,
            "suspicion_level": suspicion_level,
            "trigger_safeguard": trigger_safeguard,
            "summary": f"Detected intent '{detected_intent}' with {len(detected_urgency)} urgency markers and {len(embedded_contacts)} contact numbers."
        }

    def _local_scam_safeguard(
        self,
        merchant_name: str,
        sender_email: str,
        amount: float,
        currency: str,
        invoice_description: str
    ) -> Dict[str, Any]:
        text_lower = invoice_description.lower()
        tactics = []
        evidence = []
        category = "brand_impersonation"
        confidence = 0.85
        coercion_score = 4.0

        if any(term in text_lower for term in ["auto-debit", "automatically debited", "deducted from your account"]):
            tactics.append("phantom_auto_debit_threat")
            coercion_score += 2.0
            evidence.append("Claims money will be automatically debited to provoke panic")

        if any(term in text_lower for term in ["call immediately", "call now", "toll free", "cancel your order"]):
            tactics.append("inbound_call_lure")
            coercion_score += 2.0
            evidence.append("Prompts victim to call a fraudulent number to reverse the charge")

        if any(brand in text_lower or brand in merchant_name.lower() for brand in ["geek squad", "norton", "mcafee"]):
            category = "tech_support_refund_scam"
            tactics.append("antivirus_subscription_impersonation")
            confidence = 0.96

        if any(brand in text_lower or brand in merchant_name.lower() for brand in ["paypal", "venmo", "zelle", "cashapp"]):
            if "bitcoin" in text_lower or "crypto" in text_lower:
                category = "crypto_authorization_scam"
                confidence = 0.95
            else:
                category = "payment_processor_impersonation"
                confidence = 0.92

        if "within 24 hours" in text_lower or "within 48 hours" in text_lower:
            tactics.append("artificial_deadline_pressure")
            coercion_score = min(coercion_score + 1.5, 10.0)

        is_scam = len(tactics) > 0 or confidence >= 0.80

        return {
            "is_scam": is_scam,
            "scam_category": category if is_scam else "none",
            "confidence": confidence if is_scam else 0.1,
            "manipulation_tactics": tactics,
            "coercion_score": min(coercion_score, 10.0),
            "evidence_phrases": evidence,
            "detailed_reasoning": (
                f"Identified {category} targeting victim via fake invoice with {len(tactics)} manipulation tactics. "
                f"Coercion rating: {coercion_score}/10."
            )
        }

