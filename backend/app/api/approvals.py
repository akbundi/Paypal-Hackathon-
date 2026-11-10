from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.approvals import trusted_contacts, approval_manager

router = APIRouter(prefix="/approvals", tags=["Approvals"])


class ContactIn(BaseModel):
    name: str
    email: str
    phone: str = ""


@router.post("/contacts/{agent_id}")
def add_contact(agent_id: str, c: ContactIn):
    return trusted_contacts.add_contact(agent_id, c.name, c.email, c.phone)


@router.get("/contacts/{agent_id}")
def list_contacts(agent_id: str):
    return trusted_contacts.list_contacts(agent_id)


@router.delete("/contacts/{agent_id}/{email}")
def remove_contact(agent_id: str, email: str):
    return {"removed": trusted_contacts.remove_contact(agent_id, email)}


@router.get("/pending")
def pending():
    return approval_manager.list_pending()


@router.get("/{req_id}")
def get_one(req_id: str):
    r = approval_manager.get_request(req_id)
    if not r:
        raise HTTPException(404, "Request not found")
    return r


@router.post("/{req_id}/approve")
def approve(req_id: str):
    r = approval_manager.decide(req_id, True)
    if not r:
        raise HTTPException(404, "Request not found")
    return r


@router.post("/{req_id}/reject")
def reject(req_id: str):
    r = approval_manager.decide(req_id, False)
    if not r:
        raise HTTPException(404, "Request not found")
    return r