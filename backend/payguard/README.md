# PayGuard Enterprise API
AI payment-fraud shield, policy engine and multi-approver workflow on the PayPal developer platform.
FastAPI + **PostgreSQL** (async psycopg pool) + JWT user auth with role-based access control.

## Quick start (Docker)
```bash
cp .env.example .env            # set JWT_SECRET and ADMIN_KEY
docker compose up --build       # API on http://localhost:8000  (interactive docs: /docs)
```

## Quick start (local)
```bash
pip install -r requirements.txt
export DATABASE_URL=postgresql://user:pass@localhost:5432/payguard JWT_SECRET=$(python -c "import secrets;print(secrets.token_urlsafe(48))") ADMIN_KEY=dev-admin
uvicorn main:app --reload       # tables are created automatically on startup
```
Without PayPal credentials the API runs in **simulation mode** (SIM- order ids) so everything is demoable.
Add `PAYPAL_CLIENT_ID/SECRET` (Sandbox) for real checkout links and `ANTHROPIC_API_KEY` for the AI layer
(it falls back to the rules engine when the key is missing or the call fails).

## Tests
```bash
pip install -r requirements-dev.txt
pytest                           # 67 tests on a real throwaway PostgreSQL (pgserver)
TEST_DATABASE_URL=postgresql://... pytest   # or point at your own database
```
The final test fails if any of the 54 API operations was never exercised, so new endpoints can't ship untested.

## Authentication & user management
- **Users** log in with email + password (argon2id) and receive a short-lived JWT access token (15 min) plus a rotating refresh token (14 days).
  Re-using an already-rotated refresh token is treated as theft and revokes every session.
- **Roles**: `owner`, `admin`, `approver`, `member`, `viewer`. Permissions are enforced on every endpoint.

| Role | Can do |
|---|---|
| owner / admin | everything (admins cannot manage owners/admins or grant those roles) |
| approver | read payments, approve/decline, read policy/vendors/analytics |
| member | create payments, see only their own |
| viewer | read-only: payments, audit, analytics |
| service (API key) | machine integrations: payments, vendors, policy, mandates, audit, webhooks |

- Self-service signup creates an organization and its owner; teammates join by **invite** (7-day single-use link).
- Account **lockout** after 5 failed logins (admin can unlock), password policy, change/forgot/reset password,
  email verification, "log out everywhere", per-user session revocation, soft-deactivation (instantly kills access).
- **Separation of duties** is real: with a user login the requester is always the authenticated email and approvers are identified by
  their login, so nobody can approve their own payment.
- Tenant isolation: every query is scoped to the caller's organization.
- Email: set `SMTP_*` to send verification/reset/invite mails; otherwise they are logged. `EXPOSE_TOKENS_IN_RESPONSE=true` (dev/tests only) returns tokens in responses.

## Fraud & payment features
Policy engine (caps, tiers, blocklists, categories, business hours), vendor-fraud signals (payee change, lookalike domain, duplicate invoice,
amount anomaly, velocity), N-of-M approvals with veto, agent spending mandates, dry-run simulator, batch screening, idempotency keys,
tamper-evident audit chain (verify + CSV export), HMAC-signed outbound webhooks, analytics. Duplicate-invoice and agent-budget checks run
inside a per-organization locked transaction, so concurrent requests cannot slip through.

## Structure
```
main.py                     app, middleware (rate limits, request id), /health, /ready
app/config.py               environment settings        app/db.py        async PostgreSQL pool + schema
app/security.py             argon2, JWT, API keys, RBAC app/models.py    request schemas
app/engine.py               risk + policy engine        app/service.py   screening, approvals, PayPal release
app/audit.py                hash-chained audit log      app/events.py    signed webhooks
app/paypal.py               PayPal client (+simulation) app/mailer.py    SMTP / log mailer
app/routers/                auth, users, payments, enterprise, webhooks
tests/                      67 tests (+ route-coverage guard)
Dockerfile, docker-compose.yml, render.yaml, .env.example
```

## Deploy on Render
Push to GitHub and create a Blueprint from `render.yaml` (provisions the API and a PostgreSQL database). Set `PUBLIC_URL`, `CORS_ORIGINS`
and the PayPal/Anthropic keys. In PayPal add the webhook `https://<app>/api/webhooks/paypal` (CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED)
and set its id as `PAYPAL_WEBHOOK_ID`. Production mode (`APP_ENV=production`) refuses to start without `JWT_SECRET`.

## Operational notes
- Rate limiting is in-memory per process: with several workers/instances put a shared limiter (gateway/Redis) in front.
- If PayPal is down when a payment is approved, the decision is kept and the payment is flagged `needs_release`; retry with `POST /api/payments/{id}/release`.
- Set `TRUST_PROXY=true` only behind a trusted proxy (Render, nginx) so client IPs for rate limiting are correct.

## API reference (54 operations; full schemas at `/docs`)
| Method | Path | Group |
|---|---|---|
| POST | `/api/auth/accept-invite` | auth |
| POST | `/api/auth/change-password` | auth |
| POST | `/api/auth/forgot-password` | auth |
| POST | `/api/auth/login` | auth |
| POST | `/api/auth/logout` | auth |
| POST | `/api/auth/logout-all` | auth |
| GET | `/api/auth/me` | auth |
| PATCH | `/api/auth/me` | auth |
| POST | `/api/auth/refresh` | auth |
| POST | `/api/auth/register` | auth |
| POST | `/api/auth/resend-verification` | auth |
| POST | `/api/auth/reset-password` | auth |
| POST | `/api/auth/verify-email` | auth |
| GET | `/api/users` | users |
| POST | `/api/users/invite` | users |
| GET | `/api/users/invites` | users |
| DELETE | `/api/users/invites/{iid}` | users |
| DELETE | `/api/users/{uid}` | users |
| GET | `/api/users/{uid}` | users |
| PATCH | `/api/users/{uid}` | users |
| POST | `/api/users/{uid}/revoke-sessions` | users |
| POST | `/api/analyze` | payments |
| GET | `/api/approve/{token}` | payments |
| POST | `/api/approve/{token}` | payments |
| GET | `/api/payments` | payments |
| POST | `/api/payments` | payments |
| POST | `/api/payments/batch` | payments |
| GET | `/api/payments/{pid}` | payments |
| POST | `/api/payments/{pid}/approvals` | payments |
| POST | `/api/payments/{pid}/capture` | payments |
| POST | `/api/payments/{pid}/release` | payments |
| POST | `/api/admin/orgs` | enterprise |
| GET | `/api/analytics/summary` | enterprise |
| GET | `/api/api-keys` | enterprise |
| POST | `/api/api-keys` | enterprise |
| DELETE | `/api/api-keys/{kid}` | enterprise |
| GET | `/api/audit` | enterprise |
| GET | `/api/audit/export` | enterprise |
| GET | `/api/audit/verify` | enterprise |
| GET | `/api/mandates` | enterprise |
| PUT | `/api/mandates` | enterprise |
| DELETE | `/api/mandates/{agent_id}` | enterprise |
| GET | `/api/org` | enterprise |
| PATCH | `/api/org` | enterprise |
| GET | `/api/policy` | enterprise |
| PUT | `/api/policy` | enterprise |
| GET | `/api/vendors` | enterprise |
| POST | `/api/vendors` | enterprise |
| PATCH | `/api/vendors/{vid}` | enterprise |
| DELETE | `/api/webhook-config` | enterprise |
| PUT | `/api/webhook-config` | enterprise |
| POST | `/api/webhooks/paypal` | webhooks |
| GET | `/health` | ops |
| GET | `/ready` | ops |
