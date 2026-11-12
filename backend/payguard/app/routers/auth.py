import uuid
from datetime import datetime, timezone
import psycopg.errors
from fastapi import APIRouter, Depends, HTTPException, Request
from .. import audit, config, db, mailer, security
from ..models import (AcceptInviteIn, ChangePasswordIn, ForgotIn, LoginIn, ProfilePatch, RefreshIn, RegisterIn, ResetIn, TokenIn)
from ..security import Principal, get_principal, new_token, require_user, sha

router = APIRouter(prefix="/api/auth", tags=["auth"])
USER_FIELDS = ("id", "org_id", "email", "full_name", "role", "is_active", "email_verified", "last_login_at", "created_at")


def public_user(u):
    return {k: u[k] for k in USER_FIELDS}


def _ua(request):
    return request.headers.get("user-agent", "")[:200]


async def issue_session(c, user, ua, replace=None):
    access, ttl = security.make_access_token(user)
    refresh, rid = new_token(48), uuid.uuid4().hex
    await c.ex("INSERT INTO refresh_tokens(id,user_id,token_hash,user_agent,expires_at) VALUES(%s,%s,%s,%s, now() + make_interval(days => %s))",
               (rid, user["id"], sha(refresh), ua, config.REFRESH_TOKEN_DAYS))
    if replace:
        await c.ex("UPDATE refresh_tokens SET revoked_at=now(), replaced_by=%s WHERE id=%s", (rid, replace))
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer", "expires_in": ttl, "user": public_user(user)}


async def revoke_sessions(c, user_id, bump=True):
    if bump:
        await c.ex("UPDATE users SET token_version=token_version+1, updated_at=now() WHERE id=%s", (user_id,))
    await c.ex("UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=%s AND revoked_at IS NULL", (user_id,))


async def _auth_token(c, user_id, kind, hours):
    await c.ex("DELETE FROM auth_tokens WHERE user_id=%s AND kind=%s AND used_at IS NULL", (user_id, kind))
    tok = new_token(32)
    await c.ex("INSERT INTO auth_tokens(token_hash,user_id,kind,expires_at) VALUES(%s,%s,%s, now() + make_interval(hours => %s))", (sha(tok), user_id, kind, hours))
    return tok


async def _mail_verify(email, token):
    await mailer.send(email, "Verify your PayGuard email", f"Verify your email: {config.PUBLIC_URL}/verify-email?token={token}\nThis link expires in 48 hours.")


@router.post("/register", status_code=201)
async def register(b: RegisterIn, request: Request):
    """Self-service signup: creates the organization and its first owner."""
    if not config.ALLOW_SELF_REGISTRATION:
        raise HTTPException(403, "Self-registration is disabled; ask an administrator for an invite")
    pw = await security.hash_password(b.password)
    org_id, uid = uuid.uuid4().hex, uuid.uuid4().hex
    try:
        async with db.tx() as c:
            await c.ex("INSERT INTO orgs(id,name) VALUES(%s,%s)", (org_id, b.org_name.strip()))
            await c.ex("INSERT INTO users(id,org_id,email,full_name,password_hash,role) VALUES(%s,%s,%s,%s,%s,'owner')", (uid, org_id, b.email, b.full_name.strip(), pw))
            user = await c.q("SELECT * FROM users WHERE id=%s", (uid,), one=True)
            vtoken = await _auth_token(c, uid, "verify", 48)
            session = await issue_session(c, user, _ua(request))
            await audit.log(org_id, b.email, "user.registered", uid, {"org": b.org_name.strip(), "role": "owner"}, c=c)
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, "An account with this email already exists")
    await _mail_verify(b.email, vtoken)
    out = {**session, "org": {"id": org_id, "name": b.org_name.strip()}}
    if config.EXPOSE_TOKENS_IN_RESPONSE:
        out["verification_token"] = vtoken
    return out


@router.post("/login")
async def login(b: LoginIn, request: Request):
    user = await db.default.q("SELECT * FROM users WHERE lower(email)=%s", (b.email,), one=True)
    if not user:
        await security.verify_password(security.DUMMY_HASH, b.password)  # equalise timing
        raise HTTPException(401, "Invalid email or password")
    if user["locked_until"] and user["locked_until"] > datetime.now(timezone.utc):
        raise HTTPException(423, "Account temporarily locked after too many failed attempts. Try again later or ask an admin to unlock it.")
    ok = await security.verify_password(user["password_hash"], b.password)
    if not ok or not user["is_active"]:
        row = await db.default.q(
            "UPDATE users SET locked_until = CASE WHEN failed_attempts + 1 >= %s THEN now() + make_interval(mins => %s) ELSE locked_until END, "
            "failed_attempts = CASE WHEN failed_attempts + 1 >= %s THEN 0 ELSE failed_attempts + 1 END WHERE id=%s RETURNING locked_until",
            (config.MAX_FAILED_LOGINS, config.LOCKOUT_MINUTES, config.MAX_FAILED_LOGINS, user["id"]), one=True)
        locked = bool(row["locked_until"] and row["locked_until"] > datetime.now(timezone.utc))
        await audit.log(user["org_id"], user["email"], "auth.account_locked" if locked else "auth.login_failed", user["id"], {"active": user["is_active"]})
        raise HTTPException(401, "Invalid email or password")
    async with db.tx() as c:
        user = await c.q("UPDATE users SET failed_attempts=0, locked_until=NULL, last_login_at=now() WHERE id=%s RETURNING *", (user["id"],), one=True)
        session = await issue_session(c, user, _ua(request))
        await audit.log(user["org_id"], user["email"], "auth.login", user["id"], {}, c=c)
    return session


@router.post("/refresh")
async def refresh(b: RefreshIn, request: Request):
    """Rotates the refresh token. Re-using an already-rotated token revokes the whole session family."""
    error, session = None, None
    async with db.tx() as c:
        row = await c.q("SELECT * FROM refresh_tokens WHERE token_hash=%s FOR UPDATE", (sha(b.refresh_token),), one=True)
        if not row:
            error = "Invalid refresh token"
        elif row["revoked_at"]:
            await revoke_sessions(c, row["user_id"])
            await audit.log((await c.q("SELECT org_id FROM users WHERE id=%s", (row["user_id"],), one=True))["org_id"], "system", "auth.refresh_reuse_detected", row["user_id"], {}, c=c)
            error = "Refresh token was already used; all sessions were revoked"
        elif row["expires_at"] <= datetime.now(timezone.utc):
            error = "Refresh token expired"
        else:
            user = await c.q("SELECT * FROM users WHERE id=%s", (row["user_id"],), one=True)
            if not user or not user["is_active"]:
                error = "Account is not active"
            else:
                session = await issue_session(c, user, _ua(request), replace=row["id"])
    if error:
        raise HTTPException(401, error)
    return session


@router.post("/logout")
async def logout(b: RefreshIn):
    await db.default.ex("UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=%s AND revoked_at IS NULL", (sha(b.refresh_token),))
    return {"ok": True}


@router.post("/logout-all")
async def logout_all(p: Principal = Depends(require_user)):
    async with db.tx() as c:
        await revoke_sessions(c, p.user["id"])
        await audit.log(p.org["id"], p.actor, "auth.logout_all", p.user["id"], {}, c=c)
    return {"ok": True}


@router.get("/me")
async def me(p: Principal = Depends(require_user)):
    return {"user": public_user(p.user), "org": {"id": p.org["id"], "name": p.org["name"]}, "role": p.role, "permissions": p.permissions}


@router.patch("/me")
async def update_me(b: ProfilePatch, p: Principal = Depends(require_user)):
    u = await db.default.q("UPDATE users SET full_name=%s, updated_at=now() WHERE id=%s RETURNING *", (b.full_name.strip(), p.user["id"]), one=True)
    return public_user(u)


@router.post("/change-password")
async def change_password(b: ChangePasswordIn, request: Request, p: Principal = Depends(require_user)):
    if not await security.verify_password(p.user["password_hash"], b.current_password):
        raise HTTPException(400, "Current password is incorrect")
    if b.current_password == b.new_password:
        raise HTTPException(400, "New password must differ from the current one")
    pw = await security.hash_password(b.new_password)
    async with db.tx() as c:
        await c.ex("UPDATE users SET password_hash=%s, updated_at=now() WHERE id=%s", (pw, p.user["id"]))
        await revoke_sessions(c, p.user["id"])  # invalidates every access + refresh token
        user = await c.q("SELECT * FROM users WHERE id=%s", (p.user["id"],), one=True)
        session = await issue_session(c, user, _ua(request))
        await audit.log(p.org["id"], p.actor, "auth.password_changed", p.user["id"], {}, c=c)
    return session


@router.post("/forgot-password", status_code=202)
async def forgot_password(b: ForgotIn):
    out = {"ok": True, "detail": "If the account exists, a reset link has been sent."}
    user = await db.default.q("SELECT * FROM users WHERE lower(email)=%s AND is_active", (b.email,), one=True)
    if user:
        async with db.tx() as c:
            tok = await _auth_token(c, user["id"], "reset", 1)
            await audit.log(user["org_id"], user["email"], "auth.password_reset_requested", user["id"], {}, c=c)
        await mailer.send(user["email"], "Reset your PayGuard password", f"Reset link: {config.PUBLIC_URL}/reset-password?token={tok}\nThis link expires in 1 hour.")
        if config.EXPOSE_TOKENS_IN_RESPONSE:
            out["reset_token"] = tok
    return out


@router.post("/reset-password")
async def reset_password(b: ResetIn):
    pw = await security.hash_password(b.new_password)
    async with db.tx() as c:
        row = await c.q("SELECT * FROM auth_tokens WHERE token_hash=%s AND kind='reset' AND used_at IS NULL AND expires_at > now() FOR UPDATE", (sha(b.token),), one=True)
        if not row:
            raise HTTPException(400, "Reset token is invalid or expired")
        user = await c.q("UPDATE users SET password_hash=%s, failed_attempts=0, locked_until=NULL, email_verified=TRUE, updated_at=now() WHERE id=%s RETURNING *", (pw, row["user_id"]), one=True)
        await c.ex("UPDATE auth_tokens SET used_at=now() WHERE token_hash=%s", (row["token_hash"],))
        await revoke_sessions(c, user["id"])
        await audit.log(user["org_id"], user["email"], "auth.password_reset", user["id"], {}, c=c)
    return {"ok": True}


@router.post("/verify-email")
async def verify_email(b: TokenIn):
    async with db.tx() as c:
        row = await c.q("SELECT * FROM auth_tokens WHERE token_hash=%s AND kind='verify' AND used_at IS NULL AND expires_at > now() FOR UPDATE", (sha(b.token),), one=True)
        if not row:
            raise HTTPException(400, "Verification token is invalid or expired")
        user = await c.q("UPDATE users SET email_verified=TRUE, updated_at=now() WHERE id=%s RETURNING *", (row["user_id"],), one=True)
        await c.ex("UPDATE auth_tokens SET used_at=now() WHERE token_hash=%s", (row["token_hash"],))
        await audit.log(user["org_id"], user["email"], "auth.email_verified", user["id"], {}, c=c)
    return {"ok": True, "user": public_user(user)}


@router.post("/resend-verification", status_code=202)
async def resend_verification(p: Principal = Depends(require_user)):
    out = {"ok": True}
    if not p.user["email_verified"]:
        async with db.tx() as c:
            tok = await _auth_token(c, p.user["id"], "verify", 48)
        await _mail_verify(p.user["email"], tok)
        if config.EXPOSE_TOKENS_IN_RESPONSE:
            out["verification_token"] = tok
    return out


@router.post("/accept-invite", status_code=201)
async def accept_invite(b: AcceptInviteIn, request: Request):
    pw = await security.hash_password(b.password)
    async with db.tx() as c:
        inv = await c.q("SELECT * FROM invites WHERE token_hash=%s AND accepted_at IS NULL AND expires_at > now() FOR UPDATE", (sha(b.token),), one=True)
        if not inv:
            raise HTTPException(400, "Invite is invalid or expired")
        uid = uuid.uuid4().hex
        try:
            await c.ex("INSERT INTO users(id,org_id,email,full_name,password_hash,role,email_verified) VALUES(%s,%s,%s,%s,%s,%s,TRUE)",
                       (uid, inv["org_id"], inv["email"], (b.full_name or inv["full_name"]).strip(), pw, inv["role"]))
        except psycopg.errors.UniqueViolation:
            raise HTTPException(409, "An account with this email already exists")
        await c.ex("UPDATE invites SET accepted_at=now() WHERE id=%s", (inv["id"],))
        user = await c.q("SELECT * FROM users WHERE id=%s", (uid,), one=True)
        session = await issue_session(c, user, _ua(request))
        await audit.log(inv["org_id"], inv["email"], "user.invite_accepted", uid, {"role": inv["role"]}, c=c)
    return session
