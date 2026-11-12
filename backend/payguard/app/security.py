"""Passwords (argon2id), JWT access tokens, API keys, principals and role-based permissions."""
import asyncio, hashlib, secrets
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, Header, HTTPException, Security
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from . import config, db

ph = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)
DUMMY_HASH = ph.hash("dummy-password-for-constant-time-checks")
bearer = HTTPBearer(auto_error=False, scheme_name="BearerAuth")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False, scheme_name="ApiKeyAuth")


def sha(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def new_token(n: int = 32) -> str:
    return secrets.token_urlsafe(n)


async def hash_password(pw: str) -> str:
    return await asyncio.to_thread(ph.hash, pw)


async def verify_password(hashed: str, pw: str) -> bool:
    try:
        return await asyncio.to_thread(ph.verify, hashed, pw)
    except (VerificationError, InvalidHashError):
        return False


def make_access_token(user: dict):
    now = datetime.now(timezone.utc)
    ttl = timedelta(minutes=config.ACCESS_TOKEN_MINUTES)
    token = jwt.encode({"sub": user["id"], "org": user["org_id"], "sv": user["token_version"], "typ": "access",
                        "iat": now, "exp": now + ttl}, config.JWT_SECRET, algorithm="HS256")
    return token, int(ttl.total_seconds())


def decode_access(token: str) -> dict:
    try:
        claims = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"], options={"require": ["exp", "sub"]})
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Access token expired", headers={"WWW-Authenticate": "Bearer"})
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid access token", headers={"WWW-Authenticate": "Bearer"})
    if claims.get("typ") != "access":
        raise HTTPException(401, "Invalid access token", headers={"WWW-Authenticate": "Bearer"})
    return claims


# ---------- RBAC ----------
ROLE_PERMS = {
    "owner": {"*"},
    "admin": {"*"},
    "approver": {"payments:read", "payments:approve", "vendors:read", "policy:read", "mandates:read", "analytics:read"},
    "member": {"payments:create", "payments:read_own", "vendors:read"},
    "viewer": {"payments:read", "vendors:read", "policy:read", "mandates:read", "analytics:read", "audit:read"},
    "service": {"payments:create", "payments:read", "payments:approve", "payments:capture", "vendors:read", "vendors:write",
                "policy:read", "policy:write", "mandates:read", "mandates:write", "analytics:read", "audit:read", "webhook:write"},
}
ASSIGNABLE = {"owner": {"owner", "admin", "approver", "member", "viewer"}, "admin": {"approver", "member", "viewer"}}


def can_assign(actor_role: str, target_role: str) -> bool:
    """Used for both 'may grant this role' and 'may manage a user holding this role'."""
    return target_role in ASSIGNABLE.get(actor_role, set())


@dataclass
class Principal:
    org: dict
    role: str
    actor: str
    via: str  # "jwt" | "api_key"
    user: Optional[dict] = None
    key: Optional[dict] = None

    def can(self, perm: str) -> bool:
        perms = ROLE_PERMS.get(self.role, set())
        return "*" in perms or perm in perms

    @property
    def permissions(self):
        return ["*"] if "*" in ROLE_PERMS.get(self.role, set()) else sorted(ROLE_PERMS.get(self.role, set()))


async def get_principal(creds: Optional[HTTPAuthorizationCredentials] = Security(bearer),
                        key: Optional[str] = Security(api_key_header), x_actor: str = Header(default="")) -> Principal:
    if creds and creds.scheme.lower() == "bearer":
        claims = decode_access(creds.credentials)
        user = await db.default.q("SELECT * FROM users WHERE id=%s", (claims["sub"],), one=True)
        if not user or not user["is_active"] or user["token_version"] != claims.get("sv") or user["org_id"] != claims.get("org"):
            raise HTTPException(401, "Session is no longer valid", headers={"WWW-Authenticate": "Bearer"})
        org = await db.default.q("SELECT * FROM orgs WHERE id=%s", (user["org_id"],), one=True)
        return Principal(org=org, role=user["role"], actor=user["email"], via="jwt", user=user)
    if key:
        row = await db.default.q("SELECT * FROM api_keys WHERE key_hash=%s AND revoked_at IS NULL", (sha(key),), one=True)
        if row:
            org = await db.default.q("SELECT * FROM orgs WHERE id=%s", (row["org_id"],), one=True)
            await db.default.ex("UPDATE api_keys SET last_used_at=now() WHERE id=%s AND (last_used_at IS NULL OR last_used_at < now() - interval '5 minutes')", (row["id"],))
            return Principal(org=org, role="service", actor=(x_actor.strip()[:80] or f"key:{row['name']}"), via="api_key", key=row)
        raise HTTPException(401, "Invalid API key")
    raise HTTPException(401, "Authentication required (Bearer token or X-API-Key)", headers={"WWW-Authenticate": "Bearer"})


def require(*perms: str):
    """Dependency factory: principal must hold at least one of the permissions."""
    async def dep(p: Principal = Depends(get_principal)) -> Principal:
        if not any(p.can(x) for x in perms):
            raise HTTPException(403, f"Your role '{p.role}' is not allowed to do this")
        return p
    return dep


def require_user(p: Principal = Depends(get_principal)) -> Principal:
    if p.via != "jwt":
        raise HTTPException(403, "This endpoint needs a user login, not an API key")
    return p


def require_admin_key(x_admin_key: str = Header(default="")):
    if not config.ADMIN_KEY:
        raise HTTPException(503, "ADMIN_KEY not configured")
    if not secrets.compare_digest(x_admin_key, config.ADMIN_KEY):
        raise HTTPException(401, "Invalid admin key")
