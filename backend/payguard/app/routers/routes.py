
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from decimal import Decimal
import requests

from app.paypal.orders import create_order
from app.paypal.payments import capture_payment
from app.paypal.webhook_handler import verify_webhook

router = APIRouter(prefix="/api/paypal", tags=["PayPal"])


class CreateOrderRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = "USD"


class CapturePaymentRequest(BaseModel):
    order_id: str


@router.post("/create-order")
def create_paypal_order(data: CreateOrderRequest):
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
