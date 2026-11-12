from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional
import requests

from app.paypal.orders import create_order
from app.paypal.payments import capture_payment
from app.paypal.webhook_handler import verify_webhook
from app.spending_control import policy_engine

router = APIRouter(prefix="/api/paypal", tags=["PayPal"])

_fraud_engine = None


def _get_fraud_engine():
    global _fraud_engine
    if _fraud_engine is None:
        from app.fraud_detection.analyzer import ScamDetectionEngine
        _fraud_engine = ScamDetectionEngine()
    return _fraud_engine


class CreateOrderRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = "USD"
    agent_id: Optional[str] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    recipient_name: Optional[str] = None
    sender_email: Optional[str] = None
    invoice_description: Optional[str] = None


class CapturePaymentRequest(BaseModel):
    order_id: str


@router.post("/create-order")
def create_paypal_order(data: CreateOrderRequest):
    # Gate 1: fraud check, sirf jab invoice details aayein
    if data.merchant and data.sender_email and data.invoice_description:
        from app.fraud_detection.models import InvoiceRequest
        result = _get_fraud_engine().analyze_invoice(
            InvoiceRequest(
                merchant_name=data.merchant,
                recipient_name=data.recipient_name or "Customer",
                sender_email=data.sender_email,
                amount=float(data.amount),
                currency=data.currency,
                invoice_description=data.invoice_description,
            )
        )
        if str(result.decision) != "APPROVE":
            raise HTTPException(
                status_code=403,
                detail={
                    "status": "blocked",
                    "reasons": [f"Fraud check: {result.decision} (score {result.risk_score})"],
                },
            )

    # Gate 2: spending check, sirf jab agent_id aaye
    if data.agent_id:
        decision = policy_engine.evaluate(
            data.agent_id,
            float(data.amount),
            data.category,
            data.merchant,
        )
        if decision["status"] != "approved":
            raise HTTPException(status_code=403, detail=decision)

    try:
        order = create_order(data.amount, data.currency)

        approval_url = next(
            (
                link["href"]
                for link in order.get("links", [])
                if link.get("rel") == "approve"
            ),
            None
        )

        return {
            "order_id": order.get("id"),
            "status": order.get("status"),
            "approval_url": approval_url
        }

    except (ValueError, requests.RequestException) as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/capture-payment")
def capture_paypal_payment(data: CapturePaymentRequest):
    try:
        result = capture_payment(data.order_id)

        return {
            "order_id": data.order_id,
            "status": result.get("status"),
            "payment_details": result
        }

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="PayPal payment capture failed"
        )


@router.post("/webhook")
async def paypal_webhook(request: Request):
    try:
        event = await request.json()

        if not verify_webhook(request.headers, event):
            raise HTTPException(
                status_code=400,
                detail="Invalid PayPal webhook signature"
            )

        return {
            "verified": True,
            "event_type": event.get("event_type"),
            "message": "PayPal webhook verified"
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Webhook processing failed"
        )
