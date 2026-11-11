import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def setup_agent():
    client.post("/spending/agents", json={"agent_id": "t1", "name": "Test Bot"})
    client.put("/spending/policy/t1", json={
        "weekly_limit": 1000, "monthly_limit": 3000,
        "categories": ["groceries"], "approval_above": 50,
    })


def check(amount, category="groceries"):
    return client.post("/spending/check", json={
        "agent_id": "t1", "amount": amount,
        "category": category, "merchant": "BigBasket",
    }).json()


def test_small_purchase_approved():
    setup_agent()
    assert check(20)["status"] == "approved"


def test_large_purchase_needs_approval_and_can_be_approved():
    setup_agent()
    r = check(80)
    assert r["status"] == "needs_approval" and "approval_id" in r
    a = client.post(f"/approvals/{r['approval_id']}/approve").json()
    assert a["status"] == "approved"


def test_over_limit_blocked():
    setup_agent()
    assert check(5000)["status"] == "blocked"


def test_wrong_category_blocked():
    setup_agent()
    assert check(10, "electronics")["status"] == "blocked"