from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.spending_control import (
    agent_authorizer, budget_manager, category_validator,
)

router = APIRouter(prefix="/spending", tags=["Spending Control"])


class AgentIn(BaseModel):
    agent_id: str
    name: str


class PolicyIn(BaseModel):
    weekly_limit: float
    monthly_limit: float
    categories: List[str]
    approval_above: Optional[float] = None


class PurchaseIn(BaseModel):
    agent_id: str
    amount: float
    category: str
    merchant: str = ""


@router.post("/agents")
def register(agent: AgentIn):
    return agent_authorizer.register_agent(agent.agent_id, agent.name)


@router.delete("/agents/{agent_id}")
def revoke(agent_id: str):
    return {"revoked": agent_authorizer.revoke_agent(agent_id)}


@router.put("/policy/{agent_id}")
def set_policy(agent_id: str, p: PolicyIn):
    budget_manager.set_budget(agent_id, p.weekly_limit, p.monthly_limit, p.approval_above)
    category_validator.set_allowed_categories(agent_id, p.categories)
    return {"agent_id": agent_id, "policy": "saved"}


@router.post("/check")
def check_purchase(p: PurchaseIn):
    return agent_authorizer.authorize_purchase(p.agent_id, p.amount, p.category, p.merchant)


@router.get("/history/{agent_id}")
def history(agent_id: str):
    return budget_manager.get_history(agent_id)