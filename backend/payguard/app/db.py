"""Async PostgreSQL layer (psycopg 3 pool). `default` runs each statement on its own pooled
connection; `tx()` yields a Conn bound to one transaction (use it for multi-step writes)."""
import contextlib, logging
import psycopg
from psycopg.rows import dict_row
from psycopg.types.numeric import FloatLoader
from psycopg_pool import AsyncConnectionPool
from . import config

psycopg.adapters.register_loader("numeric", FloatLoader)  # NUMERIC -> float everywhere
log = logging.getLogger("payguard.db")
pool: AsyncConnectionPool = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS orgs(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, webhook_url TEXT, webhook_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL, full_name TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','approver','member','viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE, email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  token_version INT NOT NULL DEFAULT 0, failed_attempts INT NOT NULL DEFAULT 0, locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users(lower(email));
CREATE INDEX IF NOT EXISTS ix_users_org ON users(org_id);
CREATE TABLE IF NOT EXISTS invites(
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE, email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '', role TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, invited_by TEXT,
  expires_at TIMESTAMPTZ NOT NULL, accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ix_invites_org ON invites(org_id);
CREATE TABLE IF NOT EXISTS auth_tokens(
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('verify','reset')), expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS refresh_tokens(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL,
  user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ, replaced_by TEXT);
CREATE INDEX IF NOT EXISTS ix_refresh_user ON refresh_tokens(user_id);
CREATE TABLE IF NOT EXISTS api_keys(
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE, name TEXT NOT NULL,
  prefix TEXT NOT NULL, key_hash TEXT UNIQUE NOT NULL, created_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS policies(org_id TEXT PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS vendors(
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE, name TEXT NOT NULL,
  email TEXT NOT NULL, domain TEXT NOT NULL, trusted BOOLEAN NOT NULL DEFAULT TRUE,
  pending_verification BOOLEAN NOT NULL DEFAULT FALSE, changed_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS ux_vendor_email ON vendors(org_id, lower(email));
CREATE TABLE IF NOT EXISTS mandates(
  org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE, agent_id TEXT NOT NULL,
  weekly_limit NUMERIC(14,2) NOT NULL, per_order_limit NUMERIC(14,2) NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]', active BOOLEAN NOT NULL DEFAULT TRUE, PRIMARY KEY(org_id, agent_id));
CREATE TABLE IF NOT EXISTS payments(
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE, requester TEXT NOT NULL,
  agent_id TEXT, vendor_id TEXT, amount NUMERIC(14,2) NOT NULL CHECK (amount > 0), currency TEXT NOT NULL,
  recipient TEXT, category TEXT, invoice_no TEXT, invoice_hash TEXT, message TEXT, status TEXT NOT NULL,
  risk_score INT NOT NULL, reasons JSONB NOT NULL DEFAULT '[]', explanation TEXT, trace JSONB NOT NULL DEFAULT '[]',
  required_approvals INT NOT NULL DEFAULT 0, paypal_order_id TEXT, approve_url TEXT, idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS ux_pay_idem ON payments(org_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_pay_org ON payments(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_pay_inv ON payments(org_id, invoice_hash) WHERE invoice_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_pay_order ON payments(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_pay_vendor ON payments(org_id, vendor_id);
CREATE INDEX IF NOT EXISTS ix_pay_req ON payments(org_id, requester, created_at);
CREATE INDEX IF NOT EXISTS ix_pay_agent ON payments(org_id, agent_id, created_at);
CREATE TABLE IF NOT EXISTS approvals(
  token TEXT PRIMARY KEY, payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE, org_id TEXT NOT NULL,
  approver TEXT NOT NULL, designated BOOLEAN NOT NULL DEFAULT FALSE, action TEXT CHECK (action IN ('approve','decline')),
  comment TEXT, decided_at TIMESTAMPTZ);
CREATE UNIQUE INDEX IF NOT EXISTS ux_appr_person ON approvals(payment_id, lower(approver));
CREATE TABLE IF NOT EXISTS audit(
  id BIGSERIAL PRIMARY KEY, org_id TEXT NOT NULL, ts TIMESTAMPTZ NOT NULL, actor TEXT NOT NULL, event TEXT NOT NULL,
  ref TEXT, data TEXT NOT NULL, prev_hash TEXT NOT NULL, hash TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_audit_org ON audit(org_id, id);
CREATE INDEX IF NOT EXISTS ix_audit_ref ON audit(org_id, ref);
"""


class Conn:
    """Statement helpers bound to one live connection (a transaction when created via tx())."""
    def __init__(self, conn):
        self.conn = conn

    async def q(self, sql, args=(), one=False):
        cur = await self.conn.execute(sql, args)
        rows = await cur.fetchall() if cur.description else []
        return (rows[0] if rows else None) if one else rows

    async def ex(self, sql, args=()):
        return (await self.conn.execute(sql, args)).rowcount

    async def lock(self, key: str):
        """Transaction-scoped advisory lock (serialises writers on a key; released at commit/rollback)."""
        await self.conn.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", (key,))


class PoolConn:
    """Each call borrows a pooled connection and commits immediately."""
    async def q(self, sql, args=(), one=False):
        async with pool.connection() as conn:
            return await Conn(conn).q(sql, args, one)

    async def ex(self, sql, args=()):
        async with pool.connection() as conn:
            return await Conn(conn).ex(sql, args)


default = PoolConn()


@contextlib.asynccontextmanager
async def tx():
    async with pool.connection() as conn:
        async with conn.transaction():
            yield Conn(conn)


async def init():
    global pool
    pool = AsyncConnectionPool(config.DATABASE_URL, min_size=config.DB_POOL_MIN, max_size=config.DB_POOL_MAX, open=False,
                               kwargs={"row_factory": dict_row, "options": "-c timezone=UTC"}, timeout=15)
    await pool.open(wait=True, timeout=30)
    async with pool.connection() as conn:
        async with conn.transaction():
            await conn.execute("SELECT pg_advisory_xact_lock(727274)")  # serialise concurrent workers booting
            await conn.execute(SCHEMA)
    log.info("PostgreSQL ready")


async def close():
    if pool:
        await pool.close()
