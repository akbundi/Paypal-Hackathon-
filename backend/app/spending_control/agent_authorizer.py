from app.spending_control import policy_engine

_agents = {}  # agent_id -> {"name", "active"}


def register_agent(agent_id, name):
    _agents[agent_id] = {"name": name, "active": True}
    return _agents[agent_id]


def revoke_agent(agent_id):
    if agent_id in _agents:
        _agents[agent_id]["active"] = False
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