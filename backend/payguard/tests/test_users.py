from conftest import PW, bearer, dbq


def test_invite_accept_and_listing(client, org):
    admin = org.add_user("admin")
    users = client.get("/api/users", headers=org.owner).json()
    assert {u["role"] for u in users} == {"owner", "admin"}
    inv = client.post("/api/users/invite", json={"email": "later@acme-test.com", "role": "viewer"}, headers=admin["h"]).json()
    pending = client.get("/api/users/invites", headers=org.owner).json()
    assert [i["email"] for i in pending] == ["later@acme-test.com"]
    assert client.get(f"/api/users/{admin['id']}", headers=org.owner).json()["email"] == admin["email"]
    assert client.delete(f"/api/users/invites/{inv['id']}", headers=org.owner).status_code == 200
    assert client.post("/api/auth/accept-invite", json={"token": inv["invite_token"], "password": PW}).status_code == 400
    assert client.delete(f"/api/users/invites/{inv['id']}", headers=org.owner).status_code == 404
    assert client.post("/api/users/invite", json={"email": admin["email"], "role": "member"}, headers=org.owner).status_code == 409


def test_role_hierarchy(client, org):
    admin, member = org.add_user("admin"), org.add_user("member")
    assert client.post("/api/users/invite", json={"email": "x1@acme-test.com", "role": "owner"}, headers=admin["h"]).status_code == 403
    assert client.post("/api/users/invite", json={"email": "x2@acme-test.com", "role": "admin"}, headers=admin["h"]).status_code == 403
    assert client.post("/api/users/invite", json={"email": "x3@acme-test.com", "role": "approver"}, headers=admin["h"]).status_code == 201
    owner_id = org.reg["user"]["id"]
    assert client.patch(f"/api/users/{owner_id}", json={"full_name": "Hacked"}, headers=admin["h"]).status_code == 403
    assert client.delete(f"/api/users/{owner_id}", headers=admin["h"]).status_code == 403
    assert client.patch(f"/api/users/{member['id']}", json={"role": "admin"}, headers=admin["h"]).status_code == 403
    assert client.patch(f"/api/users/{member['id']}", json={"role": "approver"}, headers=admin["h"]).json()["role"] == "approver"
    assert client.post("/api/users/invite", json={"email": "x4@acme-test.com", "role": "member"}, headers=member["h"]).status_code == 403
    assert client.get("/api/users", headers=member["h"]).status_code == 403


def test_self_protection_and_last_owner(client, org):
    oid = org.reg["user"]["id"]
    assert client.patch(f"/api/users/{oid}", json={"role": "admin"}, headers=org.owner).status_code == 400
    assert client.delete(f"/api/users/{oid}", headers=org.owner).status_code == 400
    # second owner exists -> demoting the first owner is allowed from the second owner, but never the last one
    o2 = org.add_user("owner")
    assert client.patch(f"/api/users/{oid}", json={"role": "admin"}, headers=o2["h"]).status_code == 200
    assert client.patch(f"/api/users/{o2['id']}", json={"role": "viewer"}, headers=org.owner).status_code == 403  # demoted admin can't touch owner
    only_owner = dbq("SELECT COUNT(*) AS n FROM users WHERE org_id=%s AND role='owner' AND is_active", (org.org_id,))[0]["n"]
    assert only_owner == 1


def test_deactivate_revokes_everything(client, org):
    m = org.add_user("member")
    assert client.get("/api/auth/me", headers=m["h"]).status_code == 200
    assert client.delete(f"/api/users/{m['id']}", headers=org.owner).json() == {"ok": True}
    assert client.get("/api/auth/me", headers=m["h"]).status_code == 401
    assert client.post("/api/auth/refresh", json={"refresh_token": m["session"]["refresh_token"]}).status_code == 401
    assert client.post("/api/auth/login", json={"email": m["email"], "password": PW}).status_code == 401
    assert client.patch(f"/api/users/{m['id']}", json={"is_active": True}, headers=org.owner).json()["is_active"] is True
    assert client.post("/api/auth/login", json={"email": m["email"], "password": PW}).status_code == 200
    assert client.patch(f"/api/users/{m['id']}", json={}, headers=org.owner).status_code == 400


def test_revoke_sessions(client, org):
    m = org.add_user("viewer")
    assert client.post(f"/api/users/{m['id']}/revoke-sessions", headers=org.owner).status_code == 200
    assert client.get("/api/auth/me", headers=m["h"]).status_code == 401
    assert client.post("/api/users/nope/revoke-sessions", headers=org.owner).status_code == 404


def test_tenant_isolation(client, org):
    other = type(org)(client)
    m = org.add_user("member")
    assert client.get(f"/api/users/{m['id']}", headers=other.owner).status_code == 404
    assert client.patch(f"/api/users/{m['id']}", json={"role": "viewer"}, headers=other.owner).status_code == 404
    assert client.post(f"/api/users/{m['id']}/revoke-sessions", headers=other.owner).status_code == 404
    p = client.post("/api/payments", json={"amount": 50, "recipient_email": "a@vendor.com"}, headers=org.owner).json()
    assert client.get(f"/api/payments/{p['id']}", headers=other.owner).status_code == 404
    assert client.get("/api/payments", headers=other.owner).json() == []
    assert client.post(f"/api/payments/{p['id']}/capture", headers=other.owner).status_code == 404


def test_api_key_lifecycle(client, org):
    created = client.post("/api/api-keys", json={"name": "erp"}, headers=org.owner).json()
    key = {"X-API-Key": created["api_key"]}
    assert client.get("/api/policy", headers=key).status_code == 200
    listing = client.get("/api/api-keys", headers=org.owner).json()
    assert any(k["id"] == created["id"] and k["prefix"] == created["api_key"][:12] and k["last_used_at"] for k in listing)
    assert "key_hash" not in listing[0]
    assert client.delete(f"/api/api-keys/{created['id']}", headers=org.owner).status_code == 200
    assert client.get("/api/policy", headers=key).status_code == 401
    assert client.delete(f"/api/api-keys/{created['id']}", headers=org.owner).status_code == 404
    assert client.post("/api/api-keys", json={"name": "x"}, headers=org.add_user("member")["h"]).status_code == 403


def test_org_endpoints(client, org):
    o = client.get("/api/org", headers=org.owner).json()
    assert o["id"] == org.org_id and o["users"] == 1
    assert client.patch("/api/org", json={"name": "Acme Worldwide"}, headers=org.owner).json()["name"] == "Acme Worldwide"
    assert client.patch("/api/org", json={"name": "Nope"}, headers=org.add_user("viewer")["h"]).status_code == 403
