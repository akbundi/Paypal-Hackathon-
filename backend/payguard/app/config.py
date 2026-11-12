"""Environment configuration. Modules read these via `config.X` so tests can override values."""
import logging, os, secrets

E = os.environ.get


def _b(name, default=False):
    v = E(name)
    return default if v is None else v.strip().lower() in ("1", "true", "yes", "on")


APP_ENV = E("APP_ENV", "development")
DATABASE_URL = E("DATABASE_URL", "postgresql://payguard:payguard@localhost:5432/payguard")
DB_POOL_MIN, DB_POOL_MAX = int(E("DB_POOL_MIN", "2")), int(E("DB_POOL_MAX", "10"))

JWT_SECRET = E("JWT_SECRET", "")
if not JWT_SECRET:
    if APP_ENV == "production":
        raise RuntimeError("JWT_SECRET must be set when APP_ENV=production")
    JWT_SECRET = secrets.token_urlsafe(48)
    logging.getLogger("payguard").warning("JWT_SECRET not set: using a random per-process secret (development only)")
ACCESS_TOKEN_MINUTES = int(E("ACCESS_TOKEN_MINUTES", "15"))
REFRESH_TOKEN_DAYS = int(E("REFRESH_TOKEN_DAYS", "14"))
MAX_FAILED_LOGINS = int(E("MAX_FAILED_LOGINS", "5"))
LOCKOUT_MINUTES = int(E("LOCKOUT_MINUTES", "15"))
ALLOW_SELF_REGISTRATION = _b("ALLOW_SELF_REGISTRATION", True)
EXPOSE_TOKENS_IN_RESPONSE = _b("EXPOSE_TOKENS_IN_RESPONSE", False)  # dev/test only: returns email tokens in API responses

SMTP_HOST, SMTP_PORT = E("SMTP_HOST", ""), int(E("SMTP_PORT", "587"))
SMTP_USER, SMTP_PASSWORD, SMTP_FROM = E("SMTP_USER", ""), E("SMTP_PASSWORD", ""), E("SMTP_FROM", "PayGuard <no-reply@payguard.local>")

PAYPAL_BASE = E("PAYPAL_BASE", "https://api-m.sandbox.paypal.com")
PP_ID, PP_SECRET, PP_WEBHOOK_ID = E("PAYPAL_CLIENT_ID", ""), E("PAYPAL_CLIENT_SECRET", ""), E("PAYPAL_WEBHOOK_ID", "")
PP_CONFIGURED = bool(PP_ID and PP_SECRET)  # False -> simulation mode (SIM- order ids)

ANTHROPIC_KEY, MODEL = E("ANTHROPIC_API_KEY", ""), E("ANTHROPIC_MODEL", "claude-sonnet-5-5")
ADMIN_KEY = E("ADMIN_KEY", "")
PUBLIC_URL = E("PUBLIC_URL", "http://localhost:8000")
ORIGINS = [o.strip() for o in E("CORS_ORIGINS", "*").split(",") if o.strip()]
RATE_LIMIT = int(E("RATE_LIMIT_PER_MIN", "120"))
AUTH_RATE_LIMIT = int(E("AUTH_RATE_LIMIT_PER_MIN", "20"))
TRUST_PROXY = _b("TRUST_PROXY", False)
