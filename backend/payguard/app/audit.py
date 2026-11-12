"""Tamper-evident audit log: each entry's SHA-256 covers the previous entry's hash (per org)."""
import hashlib, json
from datetime import datetime, timezone
from . import db

GENESIS = "0" * 64


def _digest(prev, org_id, ts, actor, event, ref, data):
    return hashlib.sha256(f"{prev}|{org_id}|{ts.astimezone(timezone.utc).isoformat()}|{actor}|{event}|{ref}|{data}".encode()).hexdigest()


async def _log(c, org_id, actor, event, ref, data):
    await c.lock(f"audit:{org_id}")
    last = await c.q("SELECT hash FROM audit WHERE org_id=%s ORDER BY id DESC LIMIT 1", (org_id,), one=True)
    prev, ts = (last["hash"] if last else GENESIS), datetime.now(timezone.utc)
    data_s = json.dumps(data or {}, sort_keys=True, default=str)
    await c.ex("INSERT INTO audit(org_id,ts,actor,event,ref,data,prev_hash,hash) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
               (org_id, ts, actor, event, ref, data_s, prev, _digest(prev, org_id, ts, actor, event, ref, data_s)))


async def log(org_id, actor, event, ref=None, data=None, c=None):
    """Pass `c` (a transaction Conn) to make the entry atomic with the surrounding change."""
    if isinstance(c, db.Conn):
        return await _log(c, org_id, actor, event, ref, data)
    async with db.tx() as tc:
        await _log(tc, org_id, actor, event, ref, data)


async def verify(org_id):
    prev, n, last_id = GENESIS, 0, 0
    while True:
        rows = await db.default.q("SELECT * FROM audit WHERE org_id=%s AND id>%s ORDER BY id LIMIT 1000", (org_id, last_id))
        if not rows:
            return {"valid": True, "entries": n, "head": prev}
        for r in rows:
            n += 1
            if r["prev_hash"] != prev or r["hash"] != _digest(prev, org_id, r["ts"], r["actor"], r["event"], r["ref"], r["data"]):
                return {"valid": False, "entries": n, "broken_at_id": r["id"]}
            prev, last_id = r["hash"], r["id"]
