import json
from pathlib import Path

# backend/contacts_data.json me data save hoga
_FILE = Path(__file__).resolve().parents[2] / "contacts_data.json"


def _load():
    try:
        with open(_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save():
    with open(_FILE, "w", encoding="utf-8") as f:
        json.dump(_contacts, f, indent=2)


_contacts = _load()  # agent_id -> list of trusted contacts


def add_contact(agent_id, name, email, phone=""):
    contact = {"name": name, "email": email, "phone": phone}
    contacts = _contacts.setdefault(agent_id, [])
    for c in contacts:
        if c["email"] == email:
            return c
    contacts.append(contact)
    _save()
    return contact


def list_contacts(agent_id):
    return _contacts.get(agent_id, [])


def remove_contact(agent_id, email):
    before = len(_contacts.get(agent_id, []))
    _contacts[agent_id] = [c for c in _contacts.get(agent_id, []) if c["email"] != email]
    _save()
    return len(_contacts[agent_id]) < before