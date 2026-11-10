from app.spending_control import budget_manager, category_validator


def evaluate(agent_id, amount, category, merchant=""):
    reasons = []

    ok, msg = category_validator.check_category(agent_id, category)
    if not ok:
        reasons.append(msg)

    ok, msg = budget_manager.check_budget(agent_id, amount)
    if not ok:
        reasons.append(msg)

    if reasons:
        return {"status": "blocked", "reasons": reasons}

    budget = budget_manager.get_budget(agent_id)
    threshold = budget.get("approval_above")
    if threshold is not None and amount > threshold:
        from app.approvals import approval_manager
        req = approval_manager.create_request(
            agent_id, amount, category, merchant,
            f"Amount above ${threshold}",
        )
        return {
            "status": "needs_approval",
            "approval_id": req["id"],
            "reasons": [f"Amount above ${threshold}, family approval required"],
        }

    budget_manager.record_spend(agent_id, amount, category)
    return {"status": "approved", "reasons": ["All policy checks passed"]}