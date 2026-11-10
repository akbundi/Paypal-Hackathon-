_allowed = {}  # agent_id -> set of categories


def set_allowed_categories(agent_id, categories):
    _allowed[agent_id] = {c.lower().strip() for c in categories}
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