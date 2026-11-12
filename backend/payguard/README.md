# PayGuard Enterprise API

Payment-fraud protection, policy engine, and multi-approver workflow built on the PayPal Developer Platform.

Built with **FastAPI, PostgreSQL, asynchronous psycopg connection pooling, JWT authentication, and role-based access control (RBAC).**

## Features

- Real-time payment risk analysis
- Rules-based fraud detection and policy engine
- Multi-level payment approval workflows
- Vendor fraud detection
- Secure authentication and authorization
- Organization-level tenant isolation
- Tamper-evident audit logs
- PayPal payment integration with simulation mode
- HMAC-signed webhooks
- Analytics and reporting

## Quick Start (Docker)

```bash
cp .env.example .env
```

Configure `JWT_SECRET` and `ADMIN_KEY` in your `.env` file.

```bash
docker compose up --build
```

The API will run at:

`http://localhost:8000`

Interactive API documentation:

`http://localhost:8000/docs`

## Quick Start (Local)

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables:

```bash
export DATABASE_URL=postgresql://user:pass@localhost:5432/payguard
export JWT_SECRET=your-secret-key
export ADMIN_KEY=dev-admin
```

Start the application:

```bash
uvicorn main:app --reload
```

Database tables are created automatically during application startup.

## Payment Processing

PayGuard supports two payment modes:

**Simulation Mode**

- Works without PayPal credentials.
- Generates simulated `SIM-` order IDs.
- Supports payment workflows for demonstration and testing.

**PayPal Sandbox Mode**

Configure the following environment variables to enable PayPal Sandbox integration:

```env
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
```

## Authentication & User Management

PayGuard uses Argon2id password hashing and JWT-based authentication.

- Access tokens expire after 15 minutes.
- Refresh tokens expire after 14 days.
- Refresh token rotation and session revocation.
- Account lockout after five failed login attempts.
- Password change, reset, and recovery.
- Email verification.
- Single-use organization invitations valid for seven days.
- Soft account deactivation.
- Organization-level data isolation.

### User Roles

| Role | Permissions |
|---|---|
| Owner | Full organization access |
| Admin | Administrative access with privileged-role restrictions |
| Approver | Review, approve, and decline payments |
| Member | Create payments and view their own |
| Viewer | Read-only access |
| Service | API-key-based machine integration |

**Separation of Duties:** Users cannot approve their own payment requests.

## Fraud Detection & Policy Engine

The rules-based engine evaluates payment risk using:

- Transaction spending limits
- Risk tiers and blocklists
- Merchant categories
- Business-hour restrictions
- Vendor payee changes
- Lookalike domains
- Duplicate invoices
- Unusual transaction amounts
- Transaction velocity

### Enterprise Capabilities

- N-of-M approval workflows with veto support
- Agent spending mandates
- Batch payment screening
- Dry-run payment simulation
- Idempotency keys
- Audit-chain verification
- CSV audit exports
- HMAC-signed outbound webhooks
- Payment analytics

Duplicate-invoice and agent-budget checks run inside organization-locked transactions to prevent concurrent requests from bypassing controls.

## Project Structure

```text
backend/
└── payguard/
    ├── main.py
    ├── app/
    │   ├── config.py
    │   ├── db.py
    │   ├── security.py
    │   ├── models.py
    │   ├── engine.py
    │   ├── service.py
    │   ├── audit.py
    │   ├── events.py
    │   ├── paypal.py
    │   ├── mailer.py
    │   └── routers/
    ├── tests/
    ├── Dockerfile
    ├── docker-compose.yml
    ├── requirements.txt
    ├── requirements-dev.txt
    ├── render.yaml
    └── README.md
```

## Testing

Install development dependencies:

```bash
pip install -r requirements-dev.txt
```

Run tests:

```bash
pytest
```

The project includes 67 tests and a route-coverage guard for the 54 API operations.

## Deployment on Render

The project includes a `render.yaml` Blueprint configuration for deploying the API and PostgreSQL database.

Deployment configuration:

- Runtime: Docker
- API framework: FastAPI
- Database: PostgreSQL
- Health check: `/ready`
- Environment: Production

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `APP_ENV` | Application environment |
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_KEY` | Administrative API key |
| `PUBLIC_URL` | Deployed API URL |
| `CORS_ORIGINS` | Allowed frontend origins |

### Optional PayPal Variables

| Variable | Purpose |
|---|---|
| `PAYPAL_CLIENT_ID` | PayPal application client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal application secret |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook identifier |

### PayPal Webhook Configuration

Configure the following endpoint in the PayPal Developer Dashboard:

```text
https://<your-app-url>/api/webhooks/paypal
```

Supported events:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`

## API Health Checks

| Endpoint | Description |
|---|---|
| `/health` | Application health status |
| `/ready` | Database readiness check |
| `/docs` | Interactive API documentation |

## Operational Notes

- Rate limiting is maintained in memory per process.
- Multi-instance deployments should use a shared rate limiter such as Redis or an API gateway.
- If PayPal is unavailable after approval, the payment is flagged as `needs_release`.
- Retry payment release using `POST /api/payments/{id}/release`.
- Enable `TRUST_PROXY=true` only behind a trusted reverse proxy.

## API Reference

PayGuard exposes 54 API operations across authentication, users, payments, enterprise management, webhooks, and system health.

Full request and response schemas are available through the interactive Swagger documentation at `/docs`.

---

**PayGuard Enterprise API**  
*Secure Payments. Intelligent Risk Control. Trusted Approvals.*
