import logging, time
from fastapi import HTTPException
from . import config, state

log = logging.getLogger("payguard.paypal")
_tok = {"v": None, "exp": 0.0}


async def token():
    if _tok["v"] and time.time() < _tok["exp"] - 60:
        return _tok["v"]
    r = await state.http.post(f"{config.PAYPAL_BASE}/v1/oauth2/token", auth=(config.PP_ID, config.PP_SECRET), data={"grant_type": "client_credentials"})
    if r.status_code != 200:
        raise HTTPException(502, "PayPal auth failed")
    j = r.json()
    _tok.update(v=j["access_token"], exp=time.time() + j["expires_in"])
    return _tok["v"]


async def create_order(pay_id, amount, currency, recipient):
    if not config.PP_CONFIGURED:
        return f"SIM-{pay_id[:12]}", None
    unit = {"reference_id": pay_id, "custom_id": pay_id, "amount": {"currency_code": currency, "value": f"{amount:.2f}"}}
    if recipient:
        unit["payee"] = {"email_address": recipient}
    r = await state.http.post(f"{config.PAYPAL_BASE}/v2/checkout/orders",
        headers={"Authorization": f"Bearer {await token()}", "PayPal-Request-Id": pay_id},
        json={"intent": "CAPTURE", "purchase_units": [unit], "payment_source": {"paypal": {"experience_context": {
            "return_url": f"{config.PUBLIC_URL}/health", "cancel_url": f"{config.PUBLIC_URL}/health", "user_action": "PAY_NOW"}}}})
    if r.status_code not in (200, 201):
        log.error("create order failed: %s %s", r.status_code, r.text)
        raise HTTPException(502, "PayPal order creation failed")
    j = r.json()
    return j["id"], next((l["href"] for l in j.get("links", []) if l["rel"] in ("payer-action", "approve")), None)


async def capture(order_id):
    if order_id.startswith("SIM-"):
        return True
    r = await state.http.post(f"{config.PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
        headers={"Authorization": f"Bearer {await token()}", "Content-Type": "application/json", "PayPal-Request-Id": f"cap-{order_id}"})
    return r.status_code in (200, 201) or "ORDER_ALREADY_CAPTURED" in r.text


async def verify_webhook(h, event) -> bool:
    if not config.PP_WEBHOOK_ID:
        return True
    r = await state.http.post(f"{config.PAYPAL_BASE}/v1/notifications/verify-webhook-signature",
        headers={"Authorization": f"Bearer {await token()}"},
        json={"auth_algo": h.get("paypal-auth-algo"), "cert_url": h.get("paypal-cert-url"),
              "transmission_id": h.get("paypal-transmission-id"), "transmission_sig": h.get("paypal-transmission-sig"),
              "transmission_time": h.get("paypal-transmission-time"), "webhook_id": config.PP_WEBHOOK_ID, "webhook_event": event})
    return r.status_code == 200 and r.json().get("verification_status") == "SUCCESS"
