import json
from pathlib import Path

# backend/categories_data.json me data save hoga
_FILE = Path(__file__).resolve().parents[2] / "categories_data.json"


def _load():
    try:
        with open(_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return {agent_id: set(cats) for agent_id, cats in data.items()}


def _save():
    data = {agent_id: sorted(cats) for agent_id, cats in _allowed.items()}
    with open(_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


_allowed = _load()  # agent_id -> set of categories


def set_allowed_categories(agent_id, categories):
    _allowed[agent_id] = {c.lower().strip() for c in categories}
    _save()
    return sorted(_allowed[agent_id])


def get_allowed_categories(agent_id):
    return sorted(_allowed.get(agent_id, set()))


def check_category(agent_id, category):
    allowed = _allowed.get(agent_id)
    if not allowed:
        return False, "No allowed categories set for this agent"
    if category.lower().strip() not in allowed:
        return False, f"Category '{category}' is not allowed"
    return True, "Category allowed"