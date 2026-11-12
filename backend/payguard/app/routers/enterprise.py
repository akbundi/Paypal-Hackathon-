import csv, io, json, secrets, uuid
import psycopg.errors
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from psycopg.types.json import Jsonb
from .. import audit, db, engine
from ..events import emit
from ..models import ApiKeyIn, MandateIn, OrgIn, PolicyIn, VendorIn, VendorPatch, WebhookCfg
from ..security import Principal, get_principal, require, require_admin_key, sha

router = APIRouter(prefix="/api", tags=["enterprise"])


# ---------- organization ----------
@router.post("/admin/orgs", status_code=201, tags=["admin"], dependencies=[Depends(require_admin_key)])
async def create_org(b: OrgIn):
    """Provision an organization with an initial service API key (for machine-to-machine integrations)."""
    oid, kid, key = uuid.uuid4().hex, uuid.uuid4().hex, "pg_live_" + secrets.token_urlsafe(32)
    async with db.tx() as c:
        await c.ex("INSERT INTO orgs(id,name) VALUES(%s,%s)", (oid, b.name.strip()))
        await c.ex("INSERT INTO api_keys(id,org_id,name,prefix,key_hash,created_by) VALUES(%s,%s,'default',%s,%s,'admin')", (kid, oid, key[:12], sha(key)))
        await audit.log(oid, "admin", "org.created", oid, {"name": b.name.strip()}, c=c)
    return {"org_id": oid, "api_key": key, "note": "Store this key now; it is not shown again."}


@router.get("/org")
async def get_org(p: Principal = Depends(get_principal)):
    o = p.org
    counts = await db.default.q("SELECT (SELECT COUNT(*) FROM users WHERE org_id=%s AND is_active) AS users, (SELECT COUNT(*) FROM payments WHERE org_id=%s) AS payments", (o["id"], o["id"]), one=True)
    return {"id": o["id"], "name": o["name"], "created_at": o["created_at"], "webhook_url": o["webhook_url"], **counts}


@router.patch("/org")
async def rename_org(b: OrgIn, p: Principal = Depends(require("org:write"))):
    await db.default.ex("UPDATE orgs SET name=%s WHERE id=%s", (b.name.strip(), p.org["id"]))
    await audit.log(p.org["id"], p.actor, "org.renamed", p.org["id"], {"name": b.name.strip()})
    return {"id": p.org["id"], "name": b.name.strip()}


@router.put("/webhook-config")
async def webhook_config(b: WebhookCfg, p: Principal = Depends(require("webhook:write"))):
    secret = "whsec_" + secrets.token_urlsafe(24)
    await db.default.ex("UPDATE orgs SET webhook_url=%s, webhook_secret=%s WHERE id=%s", (b.url, secret, p.org["id"]))
    await audit.log(p.org["id"], p.actor, "webhook.configured", p.org["id"], {"url": b.url})
    return {"url": b.url, "signing_secret": secret, "signature_header": "X-PayGuard-Signature: sha256=<hmac of raw body>"}


@router.delete("/webhook-config")
async def webhook_disable(p: Principal = Depends(require("webhook:write"))):
    await db.default.ex("UPDATE orgs SET webhook_url=NULL, webhook_secret=NULL WHERE id=%s", (p.org["id"],))
    await audit.log(p.org["id"], p.actor, "webhook.disabled", p.org["id"], {})
    return {"ok": True}


# ---------- API keys ----------
@router.post("/api-keys", status_code=201)
async def create_api_key(b: ApiKeyIn, p: Principal = Depends(require("apikeys:manage"))):
    kid, key = uuid.uuid4().hex, "pg_live_" + secrets.token_urlsafe(32)
    async with db.tx() as c:
        await c.ex("INSERT INTO api_keys(id,org_id,name,prefix,key_hash,created_by) VALUES(%s,%s,%s,%s,%s,%s)", (kid, p.org["id"], b.name.strip(), key[:12], sha(key), p.actor))
        await audit.log(p.org["id"], p.actor, "apikey.created", kid, {"name": b.name.strip()}, c=c)
    return {"id": kid, "name": b.name.strip(), "api_key": key, "note": "Store this key now; it is not shown again."}


@router.get("/api-keys")
async def list_api_keys(p: Principal = Depends(require("apikeys:manage"))):
    return await db.default.q("SELECT id,name,prefix,created_by,created_at,last_used_at,revoked_at FROM api_keys WHERE org_id=%s ORDER BY created_at DESC", (p.org["id"],))


@router.delete("/api-keys/{kid}")
async def revoke_api_key(kid: str, p: Principal = Depends(require("apikeys:manage"))):
    n = await db.default.ex("UPDATE api_keys SET revoked_at=now() WHERE id=%s AND org_id=%s AND revoked_at IS NULL", (kid, p.org["id"]))
    if not n:
        raise HTTPException(404, "API key not found or already revoked")
    await audit.log(p.org["id"], p.actor, "apikey.revoked", kid, {})
    return {"ok": True}


# ---------- policy / mandates ----------
@router.get("/policy")
async def get_policy(p: Principal = Depends(require("policy:read"))):
    return await engine.get_policy(db.default, p.org["id"])


@router.put("/policy")
async def put_policy(b: PolicyIn, p: Principal = Depends(require("policy:write"))):
    async with db.tx() as c:
        await c.ex("INSERT INTO policies(org_id,data) VALUES(%s,%s) ON CONFLICT(org_id) DO UPDATE SET data=excluded.data", (p.org["id"], Jsonb(b.model_dump())))
        await audit.log(p.org["id"], p.actor, "policy.updated", p.org["id"], b.model_dump(), c=c)
    return b


@router.put("/mandates")
async def put_mandate(m: MandateIn, p: Principal = Depends(require("mandates:write"))):
    async with db.tx() as c:
        await c.ex("INSERT INTO mandates(org_id,agent_id,weekly_limit,per_order_limit,categories,active) VALUES(%s,%s,%s,%s,%s,TRUE) "
                   "ON CONFLICT(org_id,agent_id) DO UPDATE SET weekly_limit=excluded.weekly_limit, per_order_limit=excluded.per_order_limit, "
                   "categories=excluded.categories, active=TRUE", (p.org["id"], m.agent_id, m.weekly_limit, m.per_order_limit, Jsonb(m.categories)))
        await audit.log(p.org["id"], p.actor, "mandate.set", m.agent_id, m.model_dump(), c=c)
    return {"ok": True, "agent_id": m.agent_id}


@router.get("/mandates")
async def list_mandates(p: Principal = Depends(require("mandates:read"))):
    return await db.default.q("SELECT agent_id, weekly_limit, per_order_limit, categories, active FROM mandates WHERE org_id=%s ORDER BY agent_id", (p.org["id"],))


@router.delete("/mandates/{agent_id}")
async def revoke_mandate(agent_id: str, p: Principal = Depends(require("mandates:write"))):
    n = await db.default.ex("UPDATE mandates SET active=FALSE WHERE org_id=%s AND agent_id=%s", (p.org["id"], agent_id))
    if not n:
        raise HTTPException(404, "Mandate not found")
    await audit.log(p.org["id"], p.actor, "mandate.revoked", agent_id, {})
    return {"ok": True}


# ---------- vendors ----------
@router.post("/vendors", status_code=201)
async def add_vendor(b: VendorIn, p: Principal = Depends(require("vendors:write"))):
    vid = uuid.uuid4().hex
    try:
        async with db.tx() as c:
            await c.ex("INSERT INTO vendors(id,org_id,name,email,domain,trusted) VALUES(%s,%s,%s,%s,%s,%s)", (vid, p.org["id"], b.name.strip(), b.email, engine.domain(b.email), b.trusted))
            await audit.log(p.org["id"], p.actor, "vendor.created", vid, {"name": b.name.strip(), "email": b.email}, c=c)
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, "A vendor with this email already exists")
    return await db.default.q("SELECT * FROM vendors WHERE id=%s", (vid,), one=True)


@router.get("/vendors")
async def list_vendors(p: Principal = Depends(require("vendors:read"))):
    return await db.default.q("SELECT * FROM vendors WHERE org_id=%s ORDER BY name", (p.org["id"],))


@router.patch("/vendors/{vid}")
async def patch_vendor(vid: str, b: VendorPatch, p: Principal = Depends(require("vendors:write"))):
    """Dual control: changing payee details flags the vendor; a DIFFERENT person must re-verify before it is trusted again."""
    payee_event = None
    try:
        async with db.tx() as c:
            v = await c.q("SELECT * FROM vendors WHERE id=%s AND org_id=%s FOR UPDATE", (vid, p.org["id"]), one=True)
            if not v:
                raise HTTPException(404, "Vendor not found")
            if b.email and b.email.lower() != v["email"]:
                new, v_old = b.email.lower(), v["email"]
                v = await c.q("UPDATE vendors SET email=%s, domain=%s, trusted=FALSE, pending_verification=TRUE, changed_by=%s WHERE id=%s RETURNING *", (new, engine.domain(new), p.actor, vid), one=True)
                await audit.log(p.org["id"], p.actor, "vendor.payee_changed", vid, {"old": v_old, "new": new}, c=c)
                payee_event = {"vendor_id": vid, "new": new, "changed_by": p.actor}
            if b.trusted is not None:
                if b.trusted and v["pending_verification"]:
                    if (v["changed_by"] or "").lower() == p.actor.lower():
                        raise HTTPException(403, "Dual control: a different person must verify this payee change")
                    await c.ex("UPDATE vendors SET pending_verification=FALSE WHERE id=%s", (vid,))
                await c.ex("UPDATE vendors SET trusted=%s WHERE id=%s", (b.trusted, vid))
                await audit.log(p.org["id"], p.actor, "vendor.trust_set", vid, {"trusted": b.trusted}, c=c)
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, "Another vendor already uses this email")
    if payee_event:
        emit(p.org, "vendor.payee_changed", payee_event)
    return await db.default.q("SELECT * FROM vendors WHERE id=%s", (vid,), one=True)


# ---------- audit ----------
@router.get("/audit")
async def get_audit(limit: int = Query(100, ge=1, le=1000), event: str = None, ref: str = None, p: Principal = Depends(require("audit:read"))):
    rows = await db.default.q("SELECT id, ts, actor, event, ref, data, hash FROM audit WHERE org_id=%s AND (%s::text IS NULL OR event=%s) AND (%s::text IS NULL OR ref=%s) "
                              "ORDER BY id DESC LIMIT %s", (p.org["id"], event, event, ref, ref, limit))
    return [{**r, "data": json.loads(r["data"])} for r in rows]


@router.get("/audit/verify")
async def verify_audit(p: Principal = Depends(require("audit:read"))):
    return await audit.verify(p.org["id"])


@router.get("/audit/export")
async def export_audit(p: Principal = Depends(require("audit:read"))):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "timestamp", "actor", "event", "ref", "data", "prev_hash", "hash"])
    for r in await db.default.q("SELECT * FROM audit WHERE org_id=%s ORDER BY id", (p.org["id"],)):
        w.writerow([r["id"], r["ts"].isoformat(), r["actor"], r["event"], r["ref"], r["data"], r["prev_hash"], r["hash"]])
    return Response(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=payguard-audit.csv"})


# ---------- analytics ----------
@router.get("/analytics/summary")
async def summary(days: int = Query(30, ge=1, le=365), p: Principal = Depends(require("analytics:read"))):
    org = p.org["id"]
    by = {r["status"]: {"count": r["c"], "amount": round(r["s"], 2), "avg_risk": round(r["r"], 1)} for r in await db.default.q(
        "SELECT status, COUNT(*)::int AS c, COALESCE(SUM(amount),0) AS s, COALESCE(AVG(risk_score),0) AS r FROM payments "
        "WHERE org_id=%s AND created_at > now() - make_interval(days => %s) GROUP BY status", (org, days))}
    protected = sum(by.get(s, {}).get("amount", 0) for s in ("blocked", "declined"))
    reasons = await db.default.q("SELECT r AS reason, COUNT(*)::int AS n FROM payments, jsonb_array_elements_text(reasons) AS r "
                                 "WHERE org_id=%s AND created_at > now() - make_interval(days => %s) AND status IN ('blocked','declined','held') "
                                 "GROUP BY r ORDER BY n DESC, r LIMIT 8", (org, days))
    ta = (await db.default.q("SELECT AVG(EXTRACT(EPOCH FROM (a.decided_at - p.created_at))) AS t FROM approvals a JOIN payments p ON p.id=a.payment_id "
                             "WHERE a.org_id=%s AND a.decided_at IS NOT NULL AND p.created_at > now() - make_interval(days => %s)", (org, days), one=True))["t"]
    daily = await db.default.q("SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day, COUNT(*)::int AS payments, "
                               "COUNT(*) FILTER (WHERE status IN ('blocked','declined'))::int AS stopped FROM payments "
                               "WHERE org_id=%s AND created_at > now() - make_interval(days => %s) GROUP BY day ORDER BY day", (org, days))
    return {"period_days": days, "by_status": by, "money_protected": round(protected, 2), "pending_review": by.get("held", {"count": 0, "amount": 0}),
            "top_risk_reasons": [[r["reason"], r["n"]] for r in reasons], "avg_approval_turnaround_seconds": round(float(ta), 1) if ta is not None else None, "daily": daily}
