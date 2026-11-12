"""Test harness: real PostgreSQL (TEST_DATABASE_URL, or a throwaway pgserver instance), one app lifespan for the session,
and a recording client so the final test can prove every API route was exercised."""
import atexit, os, tempfile, uuid
import psycopg
import pytest

URL = os.environ.get("TEST_DATABASE_URL")
if not URL:
    import pgserver
    _srv = pgserver.get_server(tempfile.mkdtemp(prefix="payguard-pg-"))
    atexit.register(_srv.cleanup)
    URL = _srv.get_uri()
os.environ.update(DATABASE_URL=URL, ADMIN_KEY="admin-test-key", JWT_SECRET="test-secret-test-secret-test-secret-1234",
                  RATE_LIMIT_PER_MIN="1000000", AUTH_RATE_LIMIT_PER_MIN="1000000", EXPOSE_TOKENS_IN_RESPONSE="true",
                  ANTHROPIC_API_KEY="", PAYPAL_CLIENT_ID="", PAYPAL_CLIENT_SECRET="", PAYPAL_WEBHOOK_ID="", APP_ENV="test")

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

HITS: set = set()
PW = "Str0ngPassw0rd!"


class RecordingClient(TestClient):
    def request(self, method, url, *a, **kw):
        HITS.add((method.upper(), url.split("?")[0]))
        return super().request(method, url, *a, **kw)


@pytest.fixture(scope="session")
def client():
    with RecordingClient(app) as c:
        yield c


def dbq(sql, args=()):
    """Direct synchronous DB access for assertions / tampering."""
    with psycopg.connect(URL, autocommit=True, row_factory=psycopg.rows.dict_row) as c:
        cur = c.execute(sql, args)
        return cur.fetchall() if cur.description else []


def bearer(tok):
    return {"Authorization": f"Bearer {tok}"}


class Org:
    """A fresh tenant: owner login + helpers to add users and API keys."""
    def __init__(self, client):
        self.c = client
        self.email = f"owner-{uuid.uuid4().hex[:8]}@acme-test.com"
        r = client.post("/api/auth/register", json={"org_name": "Acme Global", "email": self.email, "password": PW, "full_name": "Olivia Owner"})
        assert r.status_code == 201, r.text
        self.reg = r.json()
        self.org_id = self.reg["org"]["id"]
        self.owner = bearer(self.reg["access_token"])

    def add_user(self, role, email=None):
        email = email or f"{role}-{uuid.uuid4().hex[:8]}@acme-test.com"
        inv = self.c.post("/api/users/invite", json={"email": email, "role": role}, headers=self.owner)
        assert inv.status_code == 201, inv.text
        r = self.c.post("/api/auth/accept-invite", json={"token": inv.json()["invite_token"], "password": PW, "full_name": role.title()})
        assert r.status_code == 201, r.text
        s = r.json()
        return {"email": email, "id": s["user"]["id"], "h": bearer(s["access_token"]), "session": s}

    def api_key(self):
        r = self.c.post("/api/api-keys", json={"name": "svc"}, headers=self.owner)
        assert r.status_code == 201, r.text
        return {"X-API-Key": r.json()["api_key"]}


@pytest.fixture()
def org(client):
    return Org(client)


def pay(**kw):
    return {"amount": 100, "recipient_email": "ap@acme-supplies.com", "message": "PO 77", **kw}
