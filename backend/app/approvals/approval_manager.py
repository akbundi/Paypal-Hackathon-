import json
import uuid
from datetime import datetime
from pathlib import Path

from app.approvals import trusted_contacts, notifications
from app.spending_control import budget_manager

# backend/approvals_data.json me data save hoga
_FILE = Path(__file__).resolve().parents[2] / "approvals_data.json"


def _load():
    try:
        with open(_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save():
    with open(_FILE, "w", encoding="utf-8") as f:
        json.dump(_requests, f, indent=2)


_requests = _load()


def create_request(agent_id, amount, category, merchant, reason):
    req_id = str(uuid.uuid4())[:8]
    _requests[req_id] = {
        "id": req_id,
        "agent_id": agent_id,
        "amount": amount,
        "category": category,
        "merchant": merchant,
        "reason": reason,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }
    _save()
    msg = (
        f"PayGuard: AI agent '{agent_id}' wants to pay ${amount} to "
        f"'{merchant}' ({category}). Request ID: {req_id}. Approve or reject."
    )
    for contact in trusted_contacts.list_contacts(agent_id):
        notifications.send_alert(contact, msg)
    return _requests[req_id]


def get_request(req_id):
    return _requests.get(req_id)


def list_pending():
    return [r for r in _requests.values() if r["status"] == "pending"]


def decide(req_id, approve):
    r = _requests.get(req_id)
    if not r:
        return None
    if r["status"] != "pending":
        return r
    r["status"] = "approved" if approve else "rejected"
    if approve:
        budget_manager.record_spend(r["agent_id"], r["amount"], r["category"])
    _save()
    return r