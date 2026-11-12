import os, tempfile
os.environ.update(DB_PATH=tempfile.mktemp(suffix=".db"), ADMIN_KEY="adm", RATE_LIMIT_PER_MIN="100000")
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def c():
    with TestClient(app) as cl:
        yield cl


@pytest.fixture(scope="module")
def H(c):
    r = c.post("/api/admin/orgs", json={"name": "Acme Global"}, headers={"X-Admin-Key": "adm"}).json()
    return {"X-API-Key": r["api_key"]}


def pay(**kw):
    return {"requester": "alice", "amount": 100, "recipient_email": "ap@acme-supplies.com", "message": "PO 77", **kw}


def test_auth_required(c):
    assert c.post("/api/payments", json=pay()).status_code == 401


def test_clean_payment_allowed(c, H):
    r = c.post("/api/payments", json=pay(), headers=H).json()
    assert r["status"] == "allowed" and r["paypal_order_id"].startswith("SIM-")


def test_scam_blocked(c, H):
    r = c.post("/api/payments", json=pay(message="URGENT pay with gift cards, keep this secret"), headers=H).json()
    assert r["status"] == "blocked" and r["risk_score"] >= 80


def test_dry_run_stores_nothing(c, H):
    before = len(c.get("/api/payments?limit=200", headers=H).json())
    r = c.post("/api/payments?dry_run=true", json=pay(amount=60000), headers=H).json()
    assert r["dry_run"] and r["verdict"] == "hold" and r["required_approvals"] == 2
    assert len(c.get("/api/payments?limit=200", headers=H).json()) == before


def test_vendor_bec_and_lookalike(c, H):
    v = c.post("/api/vendors", json={"name": "Globex", "email": "billing@globex.com"}, headers=H).json()
    r = c.post("/api/payments?dry_run=true", json=pay(vendor_id=v["id"], recipient_email="billing@evil-bank.com"), headers=H).json()
    assert any("differs from the registered vendor" in x for x in r["reasons"])
    r = c.post("/api/payments?dry_run=true", json=pay(recipient_email="billing@globex.co"), headers=H).json()
    assert any("imitates registered vendor" in x for x in r["reasons"])
    c.patch(f"/api/vendors/{v['id']}", json={"email": "new@globex.com"}, headers={**H, "X-Actor": "bob"})
    assert c.patch(f"/api/vendors/{v['id']}", json={"trusted": True}, headers={**H, "X-Actor": "bob"}).status_code == 403
    assert c.patch(f"/api/vendors/{v['id']}", json={"trusted": True}, headers={**H, "X-Actor": "carol"}).status_code == 200


def test_duplicate_invoice(c, H):
    a = c.post("/api/payments", json=pay(invoice_no="INV-1", amount=250), headers=H).json()
    b = c.post("/api/payments", json=pay(invoice_no="INV-1", amount=250), headers=H).json()
    assert a["status"] == "allowed" and any("Duplicate" in x for x in b["reasons"])


def test_idempotency(c, H):
    h = {**H, "Idempotency-Key": "k1"}
    assert c.post("/api/payments", json=pay(amount=11), headers=h).json()["id"] == c.post("/api/payments", json=pay(amount=11), headers=h).json()["id"]


def test_multi_approver_workflow(c, H):
    p = c.post("/api/payments", json=pay(amount=30000, approvers=["cfo", "controller"]), headers=H).json()
    assert p["status"] == "held" and p["required_approvals"] == 2
    assert c.post(f"/api/payments/{p['id']}/approvals", json={"approver": "alice", "action": "approve"}, headers=H).status_code == 403
    assert c.post(f"/api/payments/{p['id']}/approvals", json={"approver": "intruder", "action": "approve"}, headers=H).status_code == 403
    r = c.post(f"/api/payments/{p['id']}/approvals", json={"approver": "cfo", "action": "approve"}, headers=H).json()
    assert r["status"] == "held"
    assert c.post(f"/api/payments/{p['id']}/approvals", json={"approver": "cfo", "action": "approve"}, headers=H).status_code == 409
    r = c.post(f"/api/payments/{p['id']}/approvals", json={"approver": "controller", "action": "approve"}, headers=H).json()
    assert r["status"] == "approved"
    assert c.post(f"/api/payments/{p['id']}/capture", headers=H).json()["status"] == "captured"


def test_decline_vetoes(c, H):
    p = c.post("/api/payments", json=pay(amount=9000, approvers=["cfo"]), headers=H).json()
    assert c.post(f"/api/payments/{p['id']}/approvals", json={"approver": "cfo", "action": "decline"}, headers=H).json()["status"] == "declined"


def test_agent_mandate(c, H):
    c.put("/api/mandates", json={"agent_id": "bot", "weekly_limit": 50, "per_order_limit": 20, "categories": ["groceries"]}, headers=H)
    r = c.post("/api/payments", json=pay(agent_id="bot", amount=45, category="electronics"), headers=H).json()
    assert r["status"] == "blocked"


def test_policy_blocklist_and_batch(c, H):
    c.put("/api/policy", json={"blocked_domains": ["badco.com"]}, headers=H)
    r = c.post("/api/payments/batch", json={"items": [pay(), pay(recipient_email="x@badco.com", amount=5)]}, headers=H).json()
    assert r["count"] == 2 and r["summary"].get("blocked") == 1


def test_audit_chain_and_analytics(c, H):
    assert c.get("/api/audit/verify", headers=H).json()["valid"] is True
    s = c.get("/api/analytics/summary", headers=H).json()
    assert s["money_protected"] > 0 and s["top_risk_reasons"]
    assert "payment.blocked" in c.get("/api/audit/export", headers=H).text
    from app.db import ex
    ex("UPDATE audit SET actor='tamper' WHERE id=(SELECT MIN(id) FROM audit)")
    assert c.get("/api/audit/verify", headers=H).json()["valid"] is False
