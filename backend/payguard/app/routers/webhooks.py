import json
from fastapi import APIRouter, HTTPException, Request
from .. import audit, db, paypal, service
from ..events import emit

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/paypal")
async def paypal_inbound(request: Request):
    try:
        ev = json.loads(await request.body())
    except ValueError:
        raise HTTPException(400, "Body must be JSON")
    if not isinstance(ev, dict) or not await paypal.verify_webhook(request.headers, ev):
        raise HTTPException(401, "Bad webhook signature")
    res, kind = ev.get("resource") or {}, ev.get("event_type")
    oid = res.get("id") if kind == "CHECKOUT.ORDER.APPROVED" else (res.get("supplementary_data") or {}).get("related_ids", {}).get("order_id")
    row = await db.default.q("SELECT * FROM payments WHERE paypal_order_id=%s", (oid,), one=True) if oid else None
    if row and row["status"] in ("allowed", "approved"):
        if kind == "PAYMENT.CAPTURE.COMPLETED" or (kind == "CHECKOUT.ORDER.APPROVED" and await paypal.capture(oid)):
            async with db.tx() as c:
                await service.set_status(c, row["id"], "captured")
                await audit.log(row["org_id"], "paypal", "payment.captured", row["id"], {"event": kind}, c=c)
            emit(await service.org_by_id(row["org_id"]), "payment.captured", {"payment_id": row["id"], "amount": row["amount"]})
    return {"received": True}
