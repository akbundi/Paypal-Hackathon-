import uuid
import psycopg.errors
from fastapi import APIRouter, Depends, HTTPException
from .. import audit, config, db, mailer
from ..models import InviteIn, UserPatch
from ..security import Principal, can_assign, new_token, require, sha
from .auth import public_user, revoke_sessions

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/invite", status_code=201)
async def invite(b: InviteIn, p: Principal = Depends(require("users:manage"))):
    if not can_assign(p.role, b.role):
        raise HTTPException(403, f"Your role '{p.role}' cannot grant the '{b.role}' role")
    if await db.default.q("SELECT 1 FROM users WHERE lower(email)=%s", (b.email,), one=True):
        raise HTTPException(409, "A user with this email already exists")
    tok, iid = new_token(32), uuid.uuid4().hex
    async with db.tx() as c:
        await c.ex("DELETE FROM invites WHERE org_id=%s AND lower(email)=%s AND accepted_at IS NULL", (p.org["id"], b.email))
        await c.ex("INSERT INTO invites(id,org_id,email,full_name,role,token_hash,invited_by,expires_at) VALUES(%s,%s,%s,%s,%s,%s,%s, now() + interval '7 days')",
                   (iid, p.org["id"], b.email, b.full_name.strip(), b.role, sha(tok), p.actor))
        await audit.log(p.org["id"], p.actor, "user.invited", iid, {"email": b.email, "role": b.role}, c=c)
    await mailer.send(b.email, f"You're invited to {p.org['name']} on PayGuard", f"Accept your invite: {config.PUBLIC_URL}/accept-invite?token={tok}\nThis link expires in 7 days.")
    out = {"id": iid, "email": b.email, "role": b.role, "expires_in_days": 7}
    if config.EXPOSE_TOKENS_IN_RESPONSE:
        out["invite_token"] = tok
    return out


@router.get("/invites")
async def list_invites(p: Principal = Depends(require("users:read"))):
    return await db.default.q("SELECT id,email,full_name,role,invited_by,expires_at,created_at FROM invites WHERE org_id=%s AND accepted_at IS NULL AND expires_at > now() ORDER BY created_at DESC", (p.org["id"],))


@router.delete("/invites/{iid}")
async def revoke_invite(iid: str, p: Principal = Depends(require("users:manage"))):
    n = await db.default.ex("DELETE FROM invites WHERE id=%s AND org_id=%s AND accepted_at IS NULL", (iid, p.org["id"]))
    if not n:
        raise HTTPException(404, "Invite not found")
    await audit.log(p.org["id"], p.actor, "user.invite_revoked", iid, {})
    return {"ok": True}


@router.get("")
async def list_users(include_inactive: bool = True, p: Principal = Depends(require("users:read"))):
    rows = await db.default.q("SELECT * FROM users WHERE org_id=%s AND (%s OR is_active) ORDER BY created_at", (p.org["id"], include_inactive))
    return [public_user(u) for u in rows]


@router.get("/{uid}")
async def get_user(uid: str, p: Principal = Depends(require("users:read"))):
    u = await db.default.q("SELECT * FROM users WHERE id=%s AND org_id=%s", (uid, p.org["id"]), one=True)
    if not u:
        raise HTTPException(404, "User not found")
    return public_user(u)


async def _apply(p: Principal, uid: str, b: UserPatch):
    org_id = p.org["id"]
    async with db.tx() as c:
        await c.lock(f"users:{org_id}")
        t = await c.q("SELECT * FROM users WHERE id=%s AND org_id=%s FOR UPDATE", (uid, org_id), one=True)
        if not t:
            raise HTTPException(404, "User not found")
        is_self = p.user is not None and p.user["id"] == t["id"]
        if is_self and (b.role is not None or b.is_active is not None):
            raise HTTPException(400, "Ask another administrator to change your own role or status")
        if not is_self and not can_assign(p.role, t["role"]):
            raise HTTPException(403, f"Your role '{p.role}' cannot manage a '{t['role']}'")
        if b.role is not None and not can_assign(p.role, b.role):
            raise HTTPException(403, f"Your role '{p.role}' cannot grant the '{b.role}' role")
        if t["role"] == "owner" and ((b.role is not None and b.role != "owner") or b.is_active is False):
            others = (await c.q("SELECT COUNT(*) AS n FROM users WHERE org_id=%s AND role='owner' AND is_active AND id<>%s", (org_id, uid), one=True))["n"]
            if others == 0:
                raise HTTPException(409, "An organization must keep at least one active owner")
        sets, args = [], []
        for col, val in (("full_name", b.full_name.strip() if b.full_name is not None else None), ("role", b.role), ("is_active", b.is_active)):
            if val is not None:
                sets.append(f"{col}=%s")
                args.append(val)
        if b.unlock:
            sets.append("failed_attempts=0, locked_until=NULL")
        if not sets:
            raise HTTPException(400, "No changes supplied")
        user = await c.q(f"UPDATE users SET {', '.join(sets)}, updated_at=now() WHERE id=%s RETURNING *", (*args, uid), one=True)
        if b.is_active is False:
            await revoke_sessions(c, uid)
        await audit.log(org_id, p.actor, "user.updated", uid, b.model_dump(exclude_none=True), c=c)
    return public_user(user)


@router.patch("/{uid}")
async def patch_user(uid: str, b: UserPatch, p: Principal = Depends(require("users:manage"))):
    return await _apply(p, uid, b)


@router.delete("/{uid}")
async def deactivate_user(uid: str, p: Principal = Depends(require("users:manage"))):
    """Soft delete: the account is deactivated and all its sessions revoked (history stays intact)."""
    await _apply(p, uid, UserPatch(is_active=False))
    return {"ok": True}


@router.post("/{uid}/revoke-sessions")
async def revoke_user_sessions(uid: str, p: Principal = Depends(require("users:manage"))):
    t = await db.default.q("SELECT * FROM users WHERE id=%s AND org_id=%s", (uid, p.org["id"]), one=True)
    if not t:
        raise HTTPException(404, "User not found")
    if not (p.user and p.user["id"] == uid) and not can_assign(p.role, t["role"]):
        raise HTTPException(403, f"Your role '{p.role}' cannot manage a '{t['role']}'")
    async with db.tx() as c:
        await revoke_sessions(c, uid)
        await audit.log(p.org["id"], p.actor, "user.sessions_revoked", uid, {}, c=c)
    return {"ok": True}
