import asyncio, json
from collections import Counter
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from .. import db, engine, service
from ..models import AnalyzeIn, BatchIn, PaymentIn, TokenVoteIn, VoteIn
from ..security import Principal, require

router = APIRouter(prefix="/api", tags=["payments"])


def _with_requester(p: Principal, body: PaymentIn) -> PaymentIn:
    """User logins can't spoof the requester: it is always their own email."""
    if p.via == "jwt":
        return body.model_copy(update={"requester": p.user["email"]})
    if not body.requester or not body.requester.strip():
        raise HTTPException(422, "requester is required when using an API key")
    return body.model_copy(update={"requester": body.requester.strip()})


@router.post("/analyze")
async def analyze(b: AnalyzeIn, p: Principal = Depends(require("payments:create"))):
    return await engine.analyze_text(b.text, b.amount, b.language)


@router.post("/payments", status_code=201)
async def create(body: PaymentIn, dry_run: bool = False, idempotency_key: Optional[str] = Header(None, max_length=120),
                 p: Principal = Depends(require("payments:create"))):
    """dry_run=true is the policy simulator: full decision + trace, nothing stored or sent to PayPal."""
    return await service.screen(p.org, _with_requester(p, body), idempotency_key, dry_run)


@router.post("/payments/batch")
async def batch(b: BatchIn, p: Principal = Depends(require("payments:create"))):
    """Screen a whole AP run (up to 100 payments) concurrently."""
    sem = asyncio.Semaphore(5)

    async def one(i, item):
        async with sem:
            try:
                return {"index": i, "result": await service.screen(p.org, _with_requester(p, item), None, b.dry_run)}
            except HTTPException as e:
                return {"index": i, "error": e.detail}
    res = await asyncio.gather(*[one(i, it) for i, it in enumerate(b.items)])
    outcome = Counter((r["result"].get("verdict") or r["result"]["status"]) if "result" in r else "error" for r in res)
    return {"count": len(res), "summary": dict(outcome), "results": res}


@router.get("/payments")
async def list_payments(status: Optional[str] = None, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                        p: Principal = Depends(require("payments:read", "payments:read_own"))):
    sql, args = "SELECT * FROM payments WHERE org_id=%s", [p.org["id"]]
    if not p.can("payments:read"):  # members only see their own
        sql, args = sql + " AND requester=%s", args + [p.actor]
    if status:
        sql, args = sql + " AND status=%s", args + [status]
    rows = await db.default.q(sql + " ORDER BY created_at DESC LIMIT %s OFFSET %s", (*args, limit, offset))
    return await service.attach(db.default, rows)


@router.get("/payments/{pid}")
async def get_payment(pid: str, p: Principal = Depends(require("payments:read", "payments:read_own"))):
    d = await service.view(db.default, pid, p.org["id"])
    if not p.can("payments:read") and d["requester"].lower() != p.actor.lower():
        raise HTTPException(404, "Payment not found")
    trail = await db.default.q("SELECT ts, actor, event, data FROM audit WHERE org_id=%s AND ref=%s ORDER BY id", (p.org["id"], pid))
    d["audit_trail"] = [{**r, "data": json.loads(r["data"])} for r in trail]
    return d


@router.post("/payments/{pid}/approvals")
async def vote(pid: str, b: VoteIn, p: Principal = Depends(require("payments:approve"))):
    approver = p.user["email"] if p.via == "jwt" else b.approver
    if not approver:
        raise HTTPException(422, "approver is required when using an API key")
    return await service.vote(p.org, pid, approver, b.action, b.comment)


@router.get("/approve/{token}", tags=["magic-link"])
async def view_token(token: str):
    a = await db.default.q("SELECT * FROM approvals WHERE token=%s", (token,), one=True)
    if not a:
        raise HTTPException(404, "Invalid link")
    d = await service.view(db.default, a["payment_id"])
    return {"you_are": a["approver"], "already_voted": a["action"], "payment": {k: d[k] for k in service.PUBLIC_FIELDS}}


@router.post("/approve/{token}", tags=["magic-link"])
async def vote_token(token: str, b: TokenVoteIn):
    a = await db.default.q("SELECT * FROM approvals WHERE token=%s", (token,), one=True)
    if not a:
        raise HTTPException(404, "Invalid link")
    return await service.vote(await service.org_by_id(a["org_id"]), a["payment_id"], a["approver"], b.action, b.comment)


@router.post("/payments/{pid}/capture")
async def capture(pid: str, p: Principal = Depends(require("payments:capture"))):
    return await service.capture(p.org, pid, p.actor)


@router.post("/payments/{pid}/release")
async def release(pid: str, p: Principal = Depends(require("payments:capture"))):
    """Retry PayPal order creation for a payment whose decision succeeded but whose PayPal call failed (needs_release=true)."""
    return await service.retry_release(p.org, pid, p.actor)
