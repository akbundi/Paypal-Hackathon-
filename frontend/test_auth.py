import time
from datetime import datetime, timedelta, timezone
import jwt
from conftest import PW, bearer, dbq


def test_register_login_me(client, org):
    assert org.reg["user"]["role"] == "owner" and "password_hash" not in org.reg["user"]
    me = client.get("/api/auth/me", headers=org.owner).json()
    assert me["role"] == "owner" and me["permissions"] == ["*"] and me["org"]["name"] == "Acme Global"
    r = client.post("/api/auth/login", json={"email": org.email.upper(), "password": PW})
    assert r.status_code == 200 and r.json()["expires_in"] > 0
    assert client.patch("/api/auth/me", json={"full_name": "Olivia B"}, headers=org.owner).json()["full_name"] == "Olivia B"


def test_register_validation(client, org):
    base = {"org_name": "X", "email": "weak@x.com", "full_name": ""}
    assert client.post("/api/auth/register", json={**base, "password": "short"}).status_code == 422
    assert client.post("/api/auth/register", json={**base, "password": "alllowercase123"}).status_code == 422
    assert client.post("/api/auth/register", json={**base, "email": "not-an-email", "password": PW}).status_code == 422
    assert client.post("/api/auth/register", json={**base, "email": org.email, "password": PW}).status_code == 409


def test_login_failures_are_generic(client, org):
    a = client.post("/api/auth/login", json={"email": org.email, "password": "Wrong-Passw0rd"})
    b = client.post("/api/auth/login", json={"email": "ghost@nowhere.com", "password": "Wrong-Passw0rd"})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_lockout_and_admin_unlock(client, org):
    victim = org.add_user("member")
    for _ in range(5):
        assert client.post("/api/auth/login", json={"email": victim["email"], "password": "Wrong-Passw0rd"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": victim["email"], "password": PW}).status_code == 423  # even the right password
    assert client.patch(f"/api/users/{victim['id']}", json={"unlock": True}, headers=org.owner).status_code == 200
    assert client.post("/api/auth/login", json={"email": victim["email"], "password": PW}).status_code == 200
    assert dbq("SELECT 1 FROM audit WHERE org_id=%s AND event='auth.account_locked'", (org.org_id,))


def test_refresh_rotation_and_reuse_detection(client, org):
    r1 = client.post("/api/auth/login", json={"email": org.email, "password": PW}).json()
    r2 = client.post("/api/auth/refresh", json={"refresh_token": r1["refresh_token"]})
    assert r2.status_code == 200 and r2.json()["refresh_token"] != r1["refresh_token"]
    assert client.get("/api/auth/me", headers=bearer(r2.json()["access_token"])).status_code == 200
    # replaying the already-rotated token = theft signal: whole family revoked
    assert client.post("/api/auth/refresh", json={"refresh_token": r1["refresh_token"]}).status_code == 401
    assert client.post("/api/auth/refresh", json={"refresh_token": r2.json()["refresh_token"]}).status_code == 401
    assert client.get("/api/auth/me", headers=bearer(r2.json()["access_token"])).status_code == 401
    assert client.post("/api/auth/refresh", json={"refresh_token": "x" * 40}).status_code == 401


def test_logout_revokes_refresh_only(client, org):
    s = client.post("/api/auth/login", json={"email": org.email, "password": PW}).json()
    assert client.post("/api/auth/logout", json={"refresh_token": s["refresh_token"]}).json() == {"ok": True}
    assert client.post("/api/auth/refresh", json={"refresh_token": s["refresh_token"]}).status_code == 401


def test_logout_all_kills_access_tokens(client, org):
    s = client.post("/api/auth/login", json={"email": org.email, "password": PW}).json()
    assert client.post("/api/auth/logout-all", headers=bearer(s["access_token"])).status_code == 200
    assert client.get("/api/auth/me", headers=bearer(s["access_token"])).status_code == 401
    assert client.get("/api/auth/me", headers=org.owner).status_code == 401  # other sessions too
    assert client.post("/api/auth/refresh", json={"refresh_token": s["refresh_token"]}).status_code == 401


def test_change_password(client, org):
    old = org.owner
    bad = client.post("/api/auth/change-password", json={"current_password": "Nope-Passw0rd", "new_password": "N3w-Passw0rd-OK"}, headers=old)
    assert bad.status_code == 400
    same = client.post("/api/auth/change-password", json={"current_password": PW, "new_password": PW}, headers=old)
    assert same.status_code == 400
    r = client.post("/api/auth/change-password", json={"current_password": PW, "new_password": "N3w-Passw0rd-OK"}, headers=old)
    assert r.status_code == 200
    assert client.get("/api/auth/me", headers=old).status_code == 401  # old sessions invalidated
    assert client.get("/api/auth/me", headers=bearer(r.json()["access_token"])).status_code == 200  # fresh one works
    assert client.post("/api/auth/login", json={"email": org.email, "password": PW}).status_code == 401
    assert client.post("/api/auth/login", json={"email": org.email, "password": "N3w-Passw0rd-OK"}).status_code == 200


def test_forgot_and_reset_password(client, org):
    ghost = client.post("/api/auth/forgot-password", json={"email": "ghost@nowhere.com"})
    assert ghost.status_code == 202 and "reset_token" not in ghost.json()
    f = client.post("/api/auth/forgot-password", json={"email": org.email})
    assert f.status_code == 202
    tok = f.json()["reset_token"]
    assert client.post("/api/auth/reset-password", json={"token": tok, "new_password": "weak"}).status_code == 422
    assert client.post("/api/auth/reset-password", json={"token": tok, "new_password": "Reset-Passw0rd-1"}).status_code == 200
    assert client.post("/api/auth/reset-password", json={"token": tok, "new_password": "Reset-Passw0rd-2"}).status_code == 400  # single use
    assert client.get("/api/auth/me", headers=org.owner).status_code == 401
    assert client.post("/api/auth/login", json={"email": org.email, "password": "Reset-Passw0rd-1"}).status_code == 200


def test_expired_reset_token(client, org):
    tok = client.post("/api/auth/forgot-password", json={"email": org.email}).json()["reset_token"]
    dbq("UPDATE auth_tokens SET expires_at = now() - interval '1 minute' WHERE kind='reset'")
    assert client.post("/api/auth/reset-password", json={"token": tok, "new_password": "Reset-Passw0rd-1"}).status_code == 400


def test_email_verification(client, org):
    assert org.reg["user"]["email_verified"] is False
    rs = client.post("/api/auth/resend-verification", headers=org.owner)
    assert rs.status_code == 202
    tok = rs.json()["verification_token"]
    v = client.post("/api/auth/verify-email", json={"token": tok})
    assert v.status_code == 200 and v.json()["user"]["email_verified"] is True
    assert client.post("/api/auth/verify-email", json={"token": tok}).status_code == 400
    assert "verification_token" not in client.post("/api/auth/resend-verification", headers=org.owner).json()


def test_token_attacks(client, org):
    secret = "test-secret-test-secret-test-secret-1234"
    uid = org.reg["user"]["id"]
    now = datetime.now(timezone.utc)
    expired = jwt.encode({"sub": uid, "org": org.org_id, "sv": 0, "typ": "access", "exp": now - timedelta(minutes=1)}, secret, algorithm="HS256")
    forged = jwt.encode({"sub": uid, "org": org.org_id, "sv": 0, "typ": "access", "exp": now + timedelta(minutes=5)}, "wrong-secret-wrong-secret-wrong-1234", algorithm="HS256")
    wrong_type = jwt.encode({"sub": uid, "org": org.org_id, "sv": 0, "typ": "refresh", "exp": now + timedelta(minutes=5)}, secret, algorithm="HS256")
    alg_none = jwt.encode({"sub": uid, "org": org.org_id, "sv": 0, "typ": "access"}, None, algorithm="none")
    for tok in (expired, forged, wrong_type, alg_none, "garbage"):
        assert client.get("/api/auth/me", headers=bearer(tok)).status_code == 401
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"X-API-Key": "pg_live_bogus"}).status_code == 401


def test_api_key_cannot_use_user_endpoints(client, org):
    key = org.api_key()
    assert client.get("/api/auth/me", headers=key).status_code == 403
    assert client.post("/api/users/invite", json={"email": "z@z.com", "role": "member"}, headers=key).status_code == 403


def test_auth_rate_limit(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config, "AUTH_RATE_LIMIT", 3)
    monkeypatch.setattr(config, "TRUST_PROXY", True)
    h = {"X-Forwarded-For": "203.0.113.77"}
    codes = [client.post("/api/auth/login", json={"email": "a@b.com", "password": "x"}, headers=h).status_code for _ in range(5)]
    assert codes[:3] == [401, 401, 401] and codes[3:] == [429, 429]
    other = {"X-Forwarded-For": "203.0.113.78"}
    assert client.post("/api/auth/login", json={"email": "a@b.com", "password": "x"}, headers=other).status_code == 401


def test_registration_can_be_disabled(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config, "ALLOW_SELF_REGISTRATION", False)
    r = client.post("/api/auth/register", json={"org_name": "N", "email": "n@n.com", "password": PW})
    assert r.status_code == 403
