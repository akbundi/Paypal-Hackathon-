
import os
from dotenv import load_dotenv
from app.paypal.client import paypal_request

load_dotenv()

WEBHOOK_ID = os.getenv("PAYPAL_WEBHOOK_ID")


def verify_webhook(headers, event):
    if not WEBHOOK_ID:
        raise RuntimeError("PayPal webhook ID is missing")

    required_headers = {
        "auth_algo": headers.get("PAYPAL-AUTH-ALGO"),
        "cert_url": headers.get("PAYPAL-CERT-URL"),
        "transmission_id": headers.get("PAYPAL-TRANSMISSION-ID"),
        "transmission_sig": headers.get("PAYPAL-TRANSMISSION-SIG"),
        "transmission_time": headers.get("PAYPAL-TRANSMISSION-TIME")
    }

    if not all(required_headers.values()):
        return False

    payload = {
        **required_headers,
        "webhook_id": WEBHOOK_ID,
        "webhook_event": event
    }

    result = paypal_request(
        "POST",
        "/v1/notifications/verify-webhook-signature",
        payload
    )

    return result.get("verification_status") == "SUCCESS"
