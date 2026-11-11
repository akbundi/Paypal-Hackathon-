import json
from pathlib import Path

from app.spending_control import policy_engine

# backend/agents_data.json me data save hoga
_FILE = Path(__file__).resolve().parents[2] / "agents_data.json"


def _load():
    try:
        with open(_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save():
    with open(_FILE, "w", encoding="utf-8") as f:
        json.dump(_agents, f, indent=2)


_agents = _load()  # agent_id -> {"name", "active"}


def register_agent(agent_id, name):
    _agents[agent_id] = {"name": name, "active": True}
    _save()
    return _agents[agent_id]


def revoke_agent(agent_id):
    if agent_id in _agents:
        _agents[agent_id]["active"] = False
        _save()
        return True
    return False


def is_authorized(agent_id):
    a = _agents.get(agent_id)
    return bool(a and a["active"])


def list_agents():
    return _agents


def authorize_purchase(agent_id, amount, category, merchant=""):
    if not is_authorized(agent_id):
        return {
            "status": "blocked",
            "reasons": ["Agent is not registered or has been revoked"],
        }
    return policy_engine.evaluate(agent_id, amount, category, merchant)