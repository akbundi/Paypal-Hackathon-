"""Signed outbound webhooks (HMAC-SHA256) so ERP / Slack / SIEM systems can react in real time."""
import asyncio, hashlib, hmac, json, logging, time, uuid
from . import state

log = logging.getLogger("payguard.events")


def emit(org: dict, event: str, data: dict):
    if org and org.get("webhook_url") and org.get("webhook_secret"):
        t = asyncio.create_task(_deliver(org["webhook_url"], org["webhook_secret"], event, data))
        state.tasks.add(t)
        t.add_done_callback(state.tasks.discard)


async def _deliver(url, secret, event, data):
    body = json.dumps({"id": uuid.uuid4().hex, "event": event, "created": int(time.time()), "data": data}, default=str)
    sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    for attempt in range(3):
        try:
            r = await state.http.post(url, content=body, headers={
                "Content-Type": "application/json", "X-PayGuard-Event": event, "X-PayGuard-Signature": f"sha256={sig}"})
            if r.status_code < 300:
                return
        except Exception as e:
            log.warning("webhook delivery failed (%s/3): %s", attempt + 1, e)
        await asyncio.sleep(2 ** attempt)
