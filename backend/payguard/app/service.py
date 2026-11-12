"""Payment orchestration: screening, approvals workflow, PayPal release. Every state change that must be
atomic (payment row + approvals + audit entry) happens inside one PostgreSQL transaction."""
import logging, secrets, uuid
import psycopg.errors
from fastapi import HTTPException
from psycopg.types.json import Jsonb
from . import audit, config, db, engine, paypal
from .events import emit

log = logging.getLogger("payguard.service")
PUBLIC_FIELDS = ("id", "amount", "currency", "recipient", "requester", "invoice_no", "risk_score", "reasons", "explanation", "status", "required_approvals")


async def attach(c, rows):
    if not rows:
        return []
    ids = [r["id"] for r in rows]
    appr = await c.q("SELECT payment_id, approver, action, comment, decided_at, designated FROM approvals "
                     "WHERE payment_id = ANY(%s) ORDER BY approver", (ids,))
    by = {}
    for a in appr:
        by.setdefault(a.pop("payment_id"), []).append(a)
    for r in rows:
        r.pop("idempotency_key", None)
        r["approvals"] = by.get(r["id"], [])
        r["needs_release"] = r["status"] in ("allowed", "approved") and not r["paypal_order_id"]
    return rows


async def view(c, pid, org_id=None):
    sql, args = ("SELECT * FROM payments WHERE id=%s", (pid,)) if org_id is None else ("SELECT * FROM payments WHERE id=%s AND org_id=%s", (pid, org_id))
    r = await c.q(sql, args, one=True)
    if not r:
        raise HTTPException(404, "Payment not found")
    return (await attach(c, [r]))[0]


async def org_by_id(org_id):
    return await db.default.q("SELECT * FROM orgs WHERE id=%s", (org_id,), one=True)


async def set_status(c, pid, status, **extra):
    cols = {"status": status, **extra}
    await c.ex(f"UPDATE payments SET {','.join(k + '=%s' for k in cols)}, updated_at=now() WHERE id=%s", (*cols.values(), pid))


async def release(pid):
    r = await db.default.q("SELECT * FROM payments WHERE id=%s", (pid,), one=True)
    oid, url = await paypal.create_order(pid, r["amount"], r["currency"], r["recipient"])
    await db.default.ex("UPDATE payments SET paypal_order_id=%s, approve_url=%s, updated_at=now() WHERE id=%s AND paypal_order_id IS NULL", (oid, url, pid))


async def release_safe(org, pid) -> bool:
    """Create the PayPal order; on failure keep the (valid) decision and flag needs_release for retry."""
    try:
        await release(pid)
        return True
    except Exception as e:
        log.error("PayPal release failed for %s: %s", pid, e)
        await audit.log(org["id"], "system", "payment.release_failed", pid, {"error": str(getattr(e, "detail", e))[:200]})
        emit(org, "payment.release_failed", {"payment_id": pid})
        return False


async def screen(org, p, idem=None, dry_run=False):
    if idem and not dry_run:
        old = await db.default.q("SELECT id FROM payments WHERE org_id=%s AND idempotency_key=%s", (org["id"], idem), one=True)
        if old:
            return await view(db.default, old["id"])
    policy = await engine.get_policy(db.default, org["id"])
    t = await engine.analyze_text(f"To: {p.recipient_email or 'unknown'}. Invoice {p.invoice_no or '-'}. {p.message}", p.amount, p.language)
    if dry_run:
        return {"dry_run": True, **await engine.decide(db.default, org["id"], p, policy, t)}
    pid, links = uuid.uuid4().hex, []
    try:
        async with db.tx() as c:
            await c.lock(f"pay:{org['id']}")  # serialises decide+insert per org so duplicate/mandate checks can't race
            d = await engine.decide(c, org["id"], p, policy, t)
            status = {"allow": "allowed", "hold": "held", "block": "blocked"}[d["verdict"]]
            designated = []
            if status == "held":
                designated = list(dict.fromkeys(a.strip().lower() for a in (p.approvers or policy["approvers"]) if a.strip()))
                designated = [a for a in designated if a != p.requester.strip().lower()]
                if designated and len(designated) < d["required_approvals"]:
                    raise HTTPException(422, f"Policy needs {d['required_approvals']} approvers but only {len(designated)} eligible were designated")
            await c.ex("INSERT INTO payments(id,org_id,requester,agent_id,vendor_id,amount,currency,recipient,category,invoice_no,invoice_hash,message,"
                       "status,risk_score,reasons,explanation,trace,required_approvals,idempotency_key) "
                       "VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                       (pid, org["id"], p.requester, p.agent_id, d["vendor_id"], p.amount, p.currency, d["recipient"], p.category, p.invoice_no,
                        d["invoice_hash"], p.message, status, d["risk_score"], Jsonb(d["reasons"]), d["explanation"], Jsonb(d["trace"]),
                        d["required_approvals"], idem))
            for name in designated:
                tok = secrets.token_urlsafe(24)
                await c.ex("INSERT INTO approvals(token,payment_id,org_id,approver,designated) VALUES(%s,%s,%s,%s,TRUE)", (tok, pid, org["id"], name))
                links.append({"approver": name, "review_url": f"{config.PUBLIC_URL}/api/approve/{tok}"})
            await audit.log(org["id"], p.requester, f"payment.{status}", pid,
                            {"amount": p.amount, "currency": p.currency, "risk": d["risk_score"], "reasons": d["reasons"]}, c=c)
    except psycopg.errors.UniqueViolation:
        old = idem and await db.default.q("SELECT id FROM payments WHERE org_id=%s AND idempotency_key=%s", (org["id"], idem), one=True)
        if old:
            return await view(db.default, old["id"])
        raise
    if status == "held":
        emit(org, "approval.requested", {"payment_id": pid, "amount": p.amount, "currency": p.currency, "required_approvals": d["required_approvals"],
                                         "reasons": d["reasons"], "approvers": links})
    elif status == "allowed":
        await release_safe(org, pid)
    emit(org, f"payment.{status}", {"payment_id": pid, "amount": p.amount, "risk_score": d["risk_score"], "reasons": d["reasons"]})
    return await view(db.default, pid)


async def vote(org, pid, approver, action, comment=""):
    approver = approver.strip().lower()
    async with db.tx() as c:
        pay = await c.q("SELECT * FROM payments WHERE id=%s AND org_id=%s FOR UPDATE", (pid, org["id"]), one=True)  # serialises votes
        if not pay:
            raise HTTPException(404, "Payment not found")
        if pay["status"] != "held":
            raise HTTPException(409, f"Payment is {pay['status']}, not awaiting approval")
        if approver == pay["requester"].strip().lower():
            raise HTTPException(403, "Separation of duties: the requester cannot approve their own payment")
        n = await c.ex("UPDATE approvals SET action=%s, comment=%s, decided_at=now() WHERE payment_id=%s AND lower(approver)=%s AND action IS NULL",
                       (action, comment, pid, approver))
        if n == 0:
            if await c.q("SELECT 1 FROM approvals WHERE payment_id=%s AND lower(approver)=%s", (pid, approver), one=True):
                raise HTTPException(409, "This approver has already voted")
            if await c.q("SELECT 1 FROM approvals WHERE payment_id=%s AND designated", (pid,), one=True):
                raise HTTPException(403, "Approver is not designated for this payment")
            await c.ex("INSERT INTO approvals(token,payment_id,org_id,approver,designated,action,comment,decided_at) VALUES(%s,%s,%s,%s,FALSE,%s,%s,now())",
                       (secrets.token_urlsafe(24), pid, org["id"], approver, action, comment))
        await audit.log(org["id"], approver, f"approval.{action}", pid, {"comment": comment}, c=c)
        outcome = None
        if action == "decline":
            outcome = "declined"
        elif (await c.q("SELECT COUNT(*) AS n FROM approvals WHERE payment_id=%s AND action='approve'", (pid,), one=True))["n"] >= pay["required_approvals"]:
            outcome = "approved"
        if outcome:
            await set_status(c, pid, outcome)
            await audit.log(org["id"], "system", f"payment.{outcome}", pid, {"by": approver}, c=c)
    if outcome:
        emit(org, f"payment.{outcome}", {"payment_id": pid, "by": approver})
    if outcome == "approved":
        await release_safe(org, pid)
    return await view(db.default, pid)


async def capture(org, pid, actor):
    r = await db.default.q("SELECT * FROM payments WHERE id=%s AND org_id=%s", (pid, org["id"]), one=True)
    if not r:
        raise HTTPException(404, "Payment not found")
    if r["status"] not in ("allowed", "approved"):
        raise HTTPException(409, f"Cannot capture a {r['status']} payment")
    if not r["paypal_order_id"]:
        raise HTTPException(409, "No PayPal order yet; call POST /api/payments/{id}/release first")
    if not await paypal.capture(r["paypal_order_id"]):
        raise HTTPException(502, "Capture failed (has the buyer approved the order?)")
    async with db.tx() as c:
        await set_status(c, pid, "captured")
        await audit.log(org["id"], actor, "payment.captured", pid, {}, c=c)
    emit(org, "payment.captured", {"payment_id": pid, "amount": r["amount"]})
    return await view(db.default, pid)


async def retry_release(org, pid, actor):
    r = await db.default.q("SELECT * FROM payments WHERE id=%s AND org_id=%s", (pid, org["id"]), one=True)
    if not r:
        raise HTTPException(404, "Payment not found")
    if r["status"] not in ("allowed", "approved") or r["paypal_order_id"]:
        raise HTTPException(409, "Nothing to release for this payment")
    await release(pid)
    await audit.log(org["id"], actor, "payment.release_retried", pid, {})
    return await view(db.default, pid)
