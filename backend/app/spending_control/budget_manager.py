from datetime import datetime, timedelta

_budgets = {}     # agent_id -> limits
_spend_log = []   # har purchase ka record


def set_budget(agent_id, weekly_limit, monthly_limit, approval_above=None):
    _budgets[agent_id] = {
        "weekly_limit": weekly_limit,
        "monthly_limit": monthly_limit,
        "approval_above": approval_above,
    }
    return _budgets[agent_id]


def get_budget(agent_id):
    return _budgets.get(agent_id)


def get_spent(agent_id, days):
    since = datetime.utcnow() - timedelta(days=days)
    return sum(
        s["amount"] for s in _spend_log
        if s["agent_id"] == agent_id and s["time"] >= since
    )


def record_spend(agent_id, amount, category):
    _spend_log.append({
        "agent_id": agent_id,
        "amount": amount,
        "category": category,
        "time": datetime.utcnow(),
    })


def check_budget(agent_id, amount):
    b = get_budget(agent_id)
    if not b:
        return False, "No budget set for this agent"
    if get_spent(agent_id, 7) + amount > b["weekly_limit"]:
        return False, f"Weekly limit of ${b['weekly_limit']} exceeded"
    if get_spent(agent_id, 30) + amount > b["monthly_limit"]:
        return False, f"Monthly limit of ${b['monthly_limit']} exceeded"
    return True, "Within budget"


def get_history(agent_id):
    return [s for s in _spend_log if s["agent_id"] == agent_id]