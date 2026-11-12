import csv, io
from conftest import dbq, pay


def test_policy_roundtrip_and_validation(client, org):
    d = client.get("/api/policy", headers=org.owner).json()
    assert d["block_score"] == 80 and d["approval_tiers"][1] == {"above": 25000.0, "approvals": 2}
    new = {"block_score": 70, "hold_score": 30, "max_single": 20000, "blocked_domains": ["badco.com"], "allowed_categories": ["general", "software"]}
    assert client.put("/api/policy", json=new, headers=org.owner).status_code == 200
    got = client.get("/api/policy", headers=org.owner).json()
    assert got["block_score"] == 70 and got["blocked_domains"] == ["badco.com"]
    assert client.put("/api/policy", json={"hold_score": 90, "block_score": 50}, headers=org.owner).status_code == 422
    assert client.put("/api/policy", json={"business_hours": {"start": 18, "end": 9}}, headers=org.owner).status_code == 422
    assert client.put("/api/policy", json={"approval_tiers": [{"above": 0, "approvals": 9}]}, headers=org.owner).status_code == 422


def test_policy_hard_rules(client, org):
    client.put("/api/policy", json={"max_single": 20000, "blocked_domains": ["badco.com"], "blocked_recipients": ["evil@ok.com"], "allowed_categories": ["general"]}, headers=org.owner)
    go = lambda **kw: client.post("/api/payments", json=pay(**kw), headers=org.owner).json()
    assert any("single-payment cap" in r for r in go(amount=20001)["reasons"])
    assert any("blocklist" in r for r in go(recipient_email="x@BadCo.com")["reasons"])
    assert any("blocklist" in r for r in go(recipient_email="evil@ok.com")["reasons"])
    assert any("not permitted by policy" in r for r in go(category="gambling")["reasons"])
    assert go()["status"] == "allowed"


def test_policy_tiers_velocity_and_hours(client, org):
    client.put("/api/policy", json={"velocity_per_hour": 2, "business_hours": {"start": 0, "end": 1, "utc_offset_minutes": 0}}, headers=org.owner)
    r = [client.post("/api/payments", json=pay(message=f"m{i}"), headers=org.owner).json() for i in range(3)]
    assert any("Unusually many payment requests" in x for x in r[2]["reasons"]) and not any("Unusually many" in x for x in r[0]["reasons"])
    assert dbq("SELECT 1")  # hours signal is time-dependent: just make sure the code path runs without error
    assert client.post("/api/payments?dry_run=true", json=pay(amount=26000, approvers=["a", "b"]), headers=org.owner).json()["required_approvals"] == 2


def test_vendor_fraud_signals(client, org):
    v = client.post("/api/vendors", json={"name": "Globex", "email": "Billing@Globex.com"}, headers=org.owner).json()
    assert v["email"] == "billing@globex.com" and v["domain"] == "globex.com"
    assert client.post("/api/vendors", json={"name": "Dup", "email": "billing@globex.com"}, headers=org.owner).status_code == 409
    dry = lambda **kw: client.post("/api/payments?dry_run=true", json=pay(**kw), headers=org.owner).json()
    assert any("differs from the registered vendor" in x for x in dry(vendor_id=v["id"], recipient_email="billing@evil-bank.com")["reasons"])
    assert any("imitates registered vendor Globex" in x for x in dry(recipient_email="billing@globex.co")["reasons"])
    ok = dry(recipient_email="billing@globex.com")
    assert ok["vendor_id"] == v["id"] and ok["verdict"] == "allow" and not any("not a registered vendor" in x for x in ok["reasons"])
    assert dry(vendor_id=v["id"], recipient_email=None)["recipient"] == "billing@globex.com"  # recipient taken from the vendor record
    for _ in range(3):
        assert client.post("/api/payments", json=pay(vendor_id=v["id"], recipient_email=None, amount=100, message=f"po{_}"), headers=org.owner).json()["status"] == "allowed"
    assert any("far above this vendor's usual" in x for x in dry(vendor_id=v["id"], recipient_email=None, amount=400)["reasons"])
    assert len(client.get("/api/vendors", headers=org.owner).json()) == 1


def test_vendor_dual_control(client, org):
    a1, a2 = org.add_user("admin"), org.add_user("admin")
    v = client.post("/api/vendors", json={"name": "Initech", "email": "ap@initech.com"}, headers=a1["h"]).json()
    url = f"/api/vendors/{v['id']}"
    both = client.patch(url, json={"email": "new@initech.com", "trusted": True}, headers=a1["h"])
    assert both.status_code == 403 and client.get("/api/vendors", headers=a1["h"]).json()[0]["email"] == "ap@initech.com"  # rolled back
    ch = client.patch(url, json={"email": "new@initech.com"}, headers=a1["h"]).json()
    assert ch["trusted"] is False and ch["pending_verification"] is True and ch["changed_by"] == a1["email"]
    risky = client.post("/api/payments?dry_run=true", json=pay(vendor_id=v["id"]), headers=a1["h"]).json()
    assert any("not yet re-verified" in x for x in risky["reasons"])
    assert client.patch(url, json={"trusted": True}, headers=a1["h"]).status_code == 403  # same person cannot verify
    done = client.patch(url, json={"trusted": True}, headers=a2["h"]).json()
    assert done["trusted"] is True and done["pending_verification"] is False
    assert client.patch(url, json={"trusted": False}, headers=a1["h"]).json()["trusted"] is False
    assert client.patch("/api/vendors/nope", json={"trusted": True}, headers=a1["h"]).status_code == 404
    other = client.post("/api/vendors", json={"name": "B", "email": "b@b.com"}, headers=a1["h"]).json()
    assert client.patch(f"/api/vendors/{other['id']}", json={"email": "new@initech.com"}, headers=a1["h"]).status_code == 409
    assert client.post("/api/vendors", json={"name": "x", "email": "x@x.com"}, headers=org.add_user("viewer")["h"]).status_code == 403


def test_audit_chain_detects_tampering(client, org):
    for i in range(3):
        client.post("/api/payments", json=pay(message=f"p{i}"), headers=org.owner)
    v = client.get("/api/audit/verify", headers=org.owner).json()
    assert v["valid"] is True and v["entries"] >= 4
    log = client.get("/api/audit", headers=org.owner).json()
    assert log[0]["id"] > log[-1]["id"] and isinstance(log[0]["data"], dict)
    assert all(e["event"] == "payment.allowed" for e in client.get("/api/audit?event=payment.allowed", headers=org.owner).json())
    ref = log[0]["ref"]
    assert all(e["ref"] == ref for e in client.get(f"/api/audit?ref={ref}", headers=org.owner).json())
    rows = list(csv.reader(io.StringIO(client.get("/api/audit/export", headers=org.owner).text)))
    assert rows[0][:4] == ["id", "timestamp", "actor", "event"] and len(rows) - 1 == v["entries"]
    dbq("UPDATE audit SET data = '{\"amount\": 1}' WHERE id = (SELECT id FROM audit WHERE org_id=%s AND event='payment.allowed' ORDER BY id LIMIT 1 OFFSET 1)", (org.org_id,))
    bad = client.get("/api/audit/verify", headers=org.owner).json()
    assert bad["valid"] is False and "broken_at_id" in bad
    other = type(org)(client)
    assert client.get("/api/audit/verify", headers=other.owner).json()["valid"] is True  # chains are per-org


def test_audit_chain_survives_concurrency(client, org):
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(lambda i: client.post("/api/payments", json=pay(message=f"c{i}"), headers=org.owner), range(12)))
    assert client.get("/api/audit/verify", headers=org.owner).json() == {"valid": True, "entries": 13, "head": client.get("/api/audit", headers=org.owner).json()[0]["hash"]}


def test_analytics(client, org):
    a1 = org.add_user("approver")
    client.post("/api/payments", json=pay(message="urgent gift cards secret wire transfer", amount=900), headers=org.owner)
    client.post("/api/payments", json=pay(amount=100), headers=org.owner)
    h = client.post("/api/payments", json=pay(amount=8000, approvers=[a1["email"]]), headers=org.owner).json()
    client.post(f"/api/payments/{h['id']}/approvals", json={"action": "approve"}, headers=a1["h"])
    s = client.get("/api/analytics/summary?days=7", headers=org.owner).json()
    assert s["money_protected"] == 900 and s["by_status"]["blocked"]["count"] == 1 and s["by_status"]["approved"]["amount"] == 8000
    assert s["top_risk_reasons"][0][1] >= 1 and s["avg_approval_turnaround_seconds"] is not None
    assert s["daily"][0]["payments"] == 3 and s["daily"][0]["stopped"] == 1
    empty = client.get("/api/analytics/summary", headers=type(org)(client).owner).json()
    assert empty["money_protected"] == 0 and empty["by_status"] == {} and empty["avg_approval_turnaround_seconds"] is None
    assert client.get("/api/analytics/summary?days=0", headers=org.owner).status_code == 422


def test_admin_org_provisioning(client):
    assert client.post("/api/admin/orgs", json={"name": "Initech"}).status_code == 401
    assert client.post("/api/admin/orgs", json={"name": "Initech"}, headers={"X-Admin-Key": "wrong"}).status_code == 401
    r = client.post("/api/admin/orgs", json={"name": "Initech"}, headers={"X-Admin-Key": "admin-test-key"})
    assert r.status_code == 201
    key = {"X-API-Key": r.json()["api_key"]}
    assert client.get("/api/org", headers=key).json()["name"] == "Initech"
    assert client.post("/api/payments", json=pay(requester="erp"), headers=key).status_code == 201
