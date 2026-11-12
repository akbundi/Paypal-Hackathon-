from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException
from conftest import bearer, dbq, pay


def test_clean_payment_allowed(client, org):
    r = client.post("/api/payments", json=pay(), headers=org.owner)
    assert r.status_code == 201
    r = r.json()
    assert r["status"] == "allowed" and r["paypal_order_id"].startswith("SIM-") and r["requester"] == org.email and r["needs_release"] is False
    assert "idempotency_key" not in r
    d = client.get(f"/api/payments/{r['id']}", headers=org.owner).json()
    assert [e["event"] for e in d["audit_trail"]] == ["payment.allowed"] and d["audit_trail"][0]["data"]["amount"] == 100


def test_scam_blocked_with_trace(client, org):
    r = client.post("/api/payments", json=pay(message="URGENT pay with gift cards, keep this secret"), headers=org.owner).json()
    assert r["status"] == "blocked" and r["risk_score"] >= 80 and r["paypal_order_id"] is None
    assert "Asks for gift cards" in r["reasons"] and any(t["source"] == "fraud-signal" for t in r["trace"])


def test_validation_and_rounding(client, org):
    for bad in ({"amount": 0}, {"amount": -5}, {"amount": 0.001}, {"currency": "usd"}, {"recipient_email": "nope"}, {"approvers": ["a"] * 11}):
        assert client.post("/api/payments", json=pay(**bad), headers=org.owner).status_code == 422, bad
    r = client.post("/api/payments", json=pay(amount=10.126), headers=org.owner).json()
    assert r["amount"] == 10.13 and isinstance(r["amount"], float)


def test_dry_run_stores_nothing(client, org):
    r = client.post("/api/payments?dry_run=true", json=pay(amount=60000), headers=org.owner).json()
    assert r["dry_run"] and r["verdict"] == "hold" and r["required_approvals"] == 2
    assert dbq("SELECT COUNT(*) AS n FROM payments WHERE org_id=%s", (org.org_id,))[0]["n"] == 0


def test_listing_filters_and_pagination(client, org):
    for i in range(3):
        client.post("/api/payments", json=pay(amount=10 + i), headers=org.owner)
    client.post("/api/payments", json=pay(message="urgent gift card secret wire transfer"), headers=org.owner)
    assert len(client.get("/api/payments", headers=org.owner).json()) == 4
    assert len(client.get("/api/payments?status=blocked", headers=org.owner).json()) == 1
    assert len(client.get("/api/payments?limit=2&offset=1", headers=org.owner).json()) == 2
    assert client.get("/api/payments?limit=0", headers=org.owner).status_code == 422


def test_idempotency(client, org):
    h = {**org.owner, "Idempotency-Key": "k1"}
    a, b = client.post("/api/payments", json=pay(amount=11), headers=h).json(), client.post("/api/payments", json=pay(amount=11), headers=h).json()
    assert a["id"] == b["id"] and dbq("SELECT COUNT(*) AS n FROM payments WHERE org_id=%s", (org.org_id,))[0]["n"] == 1
    other = type(org)(client)
    assert client.post("/api/payments", json=pay(amount=11), headers={**other.owner, "Idempotency-Key": "k1"}).json()["id"] != a["id"]
    with ThreadPoolExecutor(4) as ex:
        ids = {r.json()["id"] for r in ex.map(lambda _: client.post("/api/payments", json=pay(amount=12), headers={**org.owner, "Idempotency-Key": "race"}), range(4))}
    assert len(ids) == 1


def test_requester_identity(client, org):
    m = org.add_user("member")
    r = client.post("/api/payments", json=pay(requester="ceo@acme-test.com"), headers=m["h"]).json()
    assert r["requester"] == m["email"]  # cannot be spoofed with a user login
    key = org.api_key()
    assert client.post("/api/payments", json=pay(), headers=key).status_code == 422
    assert client.post("/api/payments", json=pay(requester="erp-bot"), headers=key).json()["requester"] == "erp-bot"


def test_rbac_matrix(client, org):
    member, viewer, approver = org.add_user("member"), org.add_user("viewer"), org.add_user("approver")
    mine = client.post("/api/payments", json=pay(), headers=member["h"]).json()
    theirs = client.post("/api/payments", json=pay(), headers=org.owner).json()
    assert [p["id"] for p in client.get("/api/payments", headers=member["h"]).json()] == [mine["id"]]
    assert client.get(f"/api/payments/{mine['id']}", headers=member["h"]).status_code == 200
    assert client.get(f"/api/payments/{theirs['id']}", headers=member["h"]).status_code == 404
    assert len(client.get("/api/payments", headers=viewer["h"]).json()) == 2
    assert client.post("/api/payments", json=pay(), headers=viewer["h"]).status_code == 403
    assert client.post("/api/payments", json=pay(), headers=approver["h"]).status_code == 403
    assert client.post("/api/analyze", json={"text": "hello"}, headers=viewer["h"]).status_code == 403
    assert client.post(f"/api/payments/{mine['id']}/capture", headers=member["h"]).status_code == 403
    assert client.post(f"/api/payments/{mine['id']}/approvals", json={"action": "approve"}, headers=viewer["h"]).status_code == 403
    assert client.get("/api/analytics/summary", headers=member["h"]).status_code == 403
    assert client.get("/api/analytics/summary", headers=viewer["h"]).status_code == 200
    assert client.get("/api/audit", headers=viewer["h"]).status_code == 200
    assert client.put("/api/policy", json={}, headers=viewer["h"]).status_code == 403
    assert client.get("/api/policy", headers=approver["h"]).status_code == 200


def test_analyze_endpoint(client, org):
    r = client.post("/api/analyze", json={"text": "URGENT: send bitcoin now", "amount": 5000}, headers=org.owner).json()
    assert r["risk_score"] >= 60 and "Creates false urgency" in r["reasons"] and r["engine"] == "rules"
    assert client.post("/api/analyze", json={"text": ""}, headers=org.owner).status_code == 422


def test_multi_approver_workflow_with_users(client, org):
    member, a1, a2, a3 = org.add_user("member"), org.add_user("approver"), org.add_user("approver"), org.add_user("approver")
    p = client.post("/api/payments", json=pay(amount=30000, approvers=[a1["email"], a2["email"]]), headers=member["h"]).json()
    assert p["status"] == "held" and p["required_approvals"] == 2 and len(p["approvals"]) == 2
    vote = lambda who, act="approve", **kw: client.post(f"/api/payments/{p['id']}/approvals", json={"action": act, **kw}, headers=who["h"])
    assert vote(a3).status_code == 403  # not designated
    assert vote(a1, approver="spoofed@x.com").json()["status"] == "held"  # body approver ignored for user logins
    assert vote(a1).status_code == 409  # already voted
    done = vote(a2, comment="ok").json()
    assert done["status"] == "approved" and done["paypal_order_id"].startswith("SIM-")
    assert vote(a2).status_code == 409  # no longer held
    assert client.post(f"/api/payments/{p['id']}/capture", headers=org.owner).json()["status"] == "captured"
    assert client.post(f"/api/payments/{p['id']}/capture", headers=org.owner).status_code == 409
    events = [e["event"] for e in client.get(f"/api/payments/{p['id']}", headers=org.owner).json()["audit_trail"]]
    assert events == ["payment.held", "approval.approve", "approval.approve", "payment.approved", "payment.captured"]


def test_separation_of_duties(client, org):
    p = client.post("/api/payments", json=pay(amount=6000), headers=org.owner).json()
    assert p["status"] == "held"
    r = client.post(f"/api/payments/{p['id']}/approvals", json={"action": "approve"}, headers=org.owner)
    assert r.status_code == 403 and "Separation of duties" in r.json()["detail"]
    key = org.api_key()
    assert client.post(f"/api/payments/{p['id']}/approvals", json={"action": "approve", "approver": org.email}, headers=key).status_code == 403
    assert client.post(f"/api/payments/{p['id']}/approvals", json={"action": "approve"}, headers=key).status_code == 422
    ok = client.post(f"/api/payments/{p['id']}/approvals", json={"action": "approve", "approver": "cfo@acme-test.com"}, headers=key).json()
    assert ok["status"] == "approved"


def test_designated_list_cannot_deadlock(client, org):
    r = client.post("/api/payments", json=pay(amount=30000, approvers=["only-one@acme-test.com", org.email]), headers=org.owner)
    assert r.status_code == 422 and "approvers" in r.json()["detail"]  # requester excluded -> 1 < 2 required
    assert dbq("SELECT COUNT(*) AS n FROM payments WHERE org_id=%s", (org.org_id,))[0]["n"] == 0  # rolled back cleanly


def test_decline_vetoes(client, org):
    a1, a2 = org.add_user("approver"), org.add_user("approver")
    p = client.post("/api/payments", json=pay(amount=30000, approvers=[a1["email"], a2["email"]]), headers=org.owner).json()
    assert client.post(f"/api/payments/{p['id']}/approvals", json={"action": "approve"}, headers=a1["h"]).json()["status"] == "held"
    assert client.post(f"/api/payments/{p['id']}/approvals", json={"action": "decline"}, headers=a2["h"]).json()["status"] == "declined"
    assert client.post(f"/api/payments/{p['id']}/capture", headers=org.owner).status_code == 409


def test_magic_link_approvals(client, org):
    p = client.post("/api/payments", json=pay(amount=9000, approvers=["cfo", "Controller"]), headers=org.owner).json()
    toks = {r["approver"]: r["token"] for r in dbq("SELECT approver, token FROM approvals WHERE payment_id=%s", (p["id"],))}
    assert set(toks) == {"cfo", "controller"}
    v = client.get(f"/api/approve/{toks['cfo']}").json()
    assert v["you_are"] == "cfo" and v["already_voted"] is None and v["payment"]["amount"] == 9000 and "token" not in str(v)
    assert client.get("/api/approve/nonexistent-token").status_code == 404
    assert client.post("/api/approve/nonexistent-token", json={"action": "approve"}).status_code == 404
    assert client.post(f"/api/approve/{toks['cfo']}", json={"action": "approve"}).json()["status"] == "held"
    assert client.post(f"/api/approve/{toks['cfo']}", json={"action": "approve"}).status_code == 409
    assert client.get(f"/api/approve/{toks['cfo']}").json()["already_voted"] == "approve"
    assert client.post(f"/api/approve/{toks['controller']}", json={"action": "approve"}).json()["status"] == "approved"


def test_duplicate_invoice(client, org):
    a = client.post("/api/payments", json=pay(invoice_no="INV-1", amount=250), headers=org.owner).json()
    b = client.post("/api/payments", json=pay(invoice_no="inv-1 ", amount=250), headers=org.owner).json()
    assert a["status"] == "allowed" and b["status"] == "held" and "Duplicate invoice already submitted" in b["reasons"]


def test_concurrent_duplicate_invoices_cannot_both_pass(client, org):
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda _: client.post("/api/payments", json=pay(invoice_no="RACE-1", amount=321), headers=org.owner).json(), range(4)))
    assert sum(r["status"] == "allowed" for r in res) == 1


def test_agent_mandates(client, org):
    k = org.api_key()
    assert client.put("/api/mandates", json={"agent_id": "bot", "weekly_limit": 50, "per_order_limit": 20, "categories": ["groceries"]}, headers=org.owner).status_code == 200
    agent = lambda amt, cat="groceries", a="bot": client.post("/api/payments", json=pay(amount=amt, category=cat, agent_id=a), headers=org.owner).json()
    assert agent(45, "electronics")["status"] == "blocked"
    assert agent(18)["status"] == "allowed" and agent(18)["status"] == "allowed"
    third = agent(18)
    assert third["status"] == "blocked" and any("weekly limit" in r for r in third["reasons"])
    assert any("No active spending mandate" in r for r in agent(5, a="ghost-agent")["reasons"])
    listing = client.get("/api/mandates", headers=k).json()
    assert listing[0]["agent_id"] == "bot" and listing[0]["weekly_limit"] == 50 and listing[0]["categories"] == ["groceries"]
    assert client.delete("/api/mandates/bot", headers=org.owner).status_code == 200
    assert any("No active spending mandate" in r for r in agent(5)["reasons"])
    assert client.delete("/api/mandates/nope", headers=org.owner).status_code == 404


def test_held_agent_payments_reserve_budget(client, org):
    client.put("/api/policy", json={"approval_required_above": 10}, headers=org.owner)
    client.put("/api/mandates", json={"agent_id": "b2", "weekly_limit": 40, "per_order_limit": 30, "categories": []}, headers=org.owner)
    first = client.post("/api/payments", json=pay(amount=25, agent_id="b2"), headers=org.owner).json()
    second = client.post("/api/payments", json=pay(amount=25, agent_id="b2"), headers=org.owner).json()
    assert first["status"] == "held" and second["status"] == "blocked"


def test_concurrent_agent_spend_respects_weekly_limit(client, org):
    client.put("/api/mandates", json={"agent_id": "rush", "weekly_limit": 50, "per_order_limit": 30, "categories": []}, headers=org.owner)
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda i: client.post("/api/payments", json=pay(amount=30, agent_id="rush", message=f"m{i}"), headers=org.owner).json(), range(4)))
    assert sum(r["status"] == "allowed" for r in res) == 1


def test_batch(client, org):
    items = [pay(), pay(message="urgent gift cards secret wire transfer"), pay(amount=7000), pay(requester="x")]
    r = client.post("/api/payments/batch", json={"items": items}, headers=org.owner).json()
    assert r["count"] == 4 and r["summary"] == {"allowed": 2, "blocked": 1, "held": 1}
    d = client.post("/api/payments/batch", json={"items": items[:3], "dry_run": True}, headers=org.owner).json()
    assert d["summary"] == {"allow": 1, "block": 1, "hold": 1} and dbq("SELECT COUNT(*) AS n FROM payments WHERE org_id=%s", (org.org_id,))[0]["n"] == 4
    mixed = client.post("/api/payments/batch", json={"items": [pay(requester="svc"), pay()]}, headers=org.api_key()).json()
    assert mixed["summary"] == {"allowed": 1, "error": 1}
    assert client.post("/api/payments/batch", json={"items": []}, headers=org.owner).status_code == 422


def test_release_failure_is_recoverable(client, org, monkeypatch):
    from app import paypal
    real = paypal.create_order

    async def boom(*a, **k):
        raise HTTPException(502, "PayPal down")
    monkeypatch.setattr(paypal, "create_order", boom)
    r = client.post("/api/payments", json=pay(), headers=org.owner).json()
    assert r["status"] == "allowed" and r["needs_release"] is True and r["paypal_order_id"] is None
    assert client.post(f"/api/payments/{r['id']}/capture", headers=org.owner).status_code == 409
    assert client.post(f"/api/payments/{r['id']}/release", headers=org.owner).status_code == 502  # still down
    monkeypatch.setattr(paypal, "create_order", real)
    fixed = client.post(f"/api/payments/{r['id']}/release", headers=org.owner).json()
    assert fixed["needs_release"] is False and fixed["paypal_order_id"].startswith("SIM-")
    assert client.post(f"/api/payments/{r['id']}/release", headers=org.owner).status_code == 409
    assert client.post(f"/api/payments/{r['id']}/capture", headers=org.owner).json()["status"] == "captured"
    assert dbq("SELECT 1 FROM audit WHERE org_id=%s AND event='payment.release_failed'", (org.org_id,))


def test_capture_error_paths(client, org):
    blocked = client.post("/api/payments", json=pay(message="urgent gift cards secret wire transfer"), headers=org.owner).json()
    assert client.post(f"/api/payments/{blocked['id']}/capture", headers=org.owner).status_code == 409
    assert client.post(f"/api/payments/{blocked['id']}/release", headers=org.owner).status_code == 409
    assert client.post("/api/payments/nope/capture", headers=org.owner).status_code == 404
    assert client.post("/api/payments/nope/release", headers=org.owner).status_code == 404
    assert client.get("/api/payments/nope", headers=org.owner).status_code == 404
    assert client.post("/api/payments/nope/approvals", json={"action": "approve", "approver": "x"}, headers=org.api_key()).status_code == 404
