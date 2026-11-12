"""PayGuard Enterprise API: AI payment-fraud shield, policy engine, multi-approver workflow on PayPal (PostgreSQL)."""
import asyncio, contextlib, hashlib, logging, time, uuid
from contextlib import asynccontextmanager
import httpx
import psycopg
import psycopg_pool
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app import config, db, state
from app.routers import auth, enterprise, payments, users, webhooks

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("payguard")


async def _cleanup_loop():
    while True:
        try:
            await db.default.ex("DELETE FROM refresh_tokens WHERE expires_at < now() - interval '30 days'")
            await db.default.ex("DELETE FROM auth_tokens WHERE expires_at < now() - interval '7 days'")
            await db.default.ex("DELETE FROM invites WHERE expires_at < now() - interval '30 days'")
        except Exception as e:
            log.warning("cleanup failed: %s", e)
        await asyncio.sleep(6 * 3600)


@asynccontextmanager
async def lifespan(app):
    state.http = httpx.AsyncClient(timeout=20)
    await db.init()
    task = asyncio.create_task(_cleanup_loop())
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    await db.close()
    await state.http.aclose()


app = FastAPI(title="PayGuard Enterprise API", version="3.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.ORIGINS, allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["X-Request-ID", "X-Response-Time-ms"])
_hits: dict = {}


def _client_ip(request: Request) -> str:
    if config.TRUST_PROXY and request.headers.get("x-forwarded-for"):
        return request.headers["x-forwarded-for"].split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _limited(bucket: str, limit: int, now: float) -> bool:
    win = [t for t in _hits.get(bucket, []) if now - t < 60]
    if len(win) >= limit:
        _hits[bucket] = win
        return True
    _hits[bucket] = win + [now]
    return False


@app.middleware("http")
async def guard(request: Request, call_next):
    now, ip = time.time(), _client_ip(request)
    if len(_hits) > 20000:  # prune idle buckets so memory stays bounded
        for k in [k for k, v in _hits.items() if not v or now - v[-1] > 60]:
            _hits.pop(k, None)
    is_auth = request.url.path.startswith("/api/auth/")
    cred = request.headers.get("x-api-key") or request.headers.get("authorization") or ip
    key = "auth:" + ip if is_auth else "gen:" + hashlib.sha1(cred.encode()).hexdigest()
    if _limited(key, config.AUTH_RATE_LIMIT if is_auth else config.RATE_LIMIT, now):
        return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429, headers={"Retry-After": "60"})
    rid = request.headers.get("x-request-id", "")[:64] or uuid.uuid4().hex[:12]
    try:
        resp = await call_next(request)
    except (psycopg_pool.PoolTimeout, psycopg.OperationalError):
        log.exception("database unavailable rid=%s", rid)
        return JSONResponse({"detail": "Database unavailable", "request_id": rid}, status_code=503, headers={"X-Request-ID": rid})
    except Exception:
        log.exception("unhandled error rid=%s", rid)
        return JSONResponse({"detail": "Internal error", "request_id": rid}, status_code=500, headers={"X-Request-ID": rid})
    resp.headers.update({"X-Request-ID": rid, "X-Response-Time-ms": str(int((time.time() - now) * 1000)), "X-Content-Type-Options": "nosniff"})
    if request.url.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


for r in (auth.router, users.router, payments.router, enterprise.router, webhooks.router):
    app.include_router(r)


@app.get("/health", tags=["ops"])
async def health():
    return {"status": "ok", "version": app.version, "ai": bool(config.ANTHROPIC_KEY), "paypal": "sandbox-live" if config.PP_CONFIGURED else "simulation",
            "admin_configured": bool(config.ADMIN_KEY), "env": config.APP_ENV}


@app.get("/ready", tags=["ops"])
async def ready():
    try:
        await db.default.q("SELECT 1")
    except Exception:
        return JSONResponse({"ready": False, "detail": "database unavailable"}, status_code=503)
    return {"ready": True}
