_contacts = {}  # agent_id -> list of trusted contacts


def add_contact(agent_id, name, email, phone=""):
    contact = {"name": name, "email": email, "phone": phone}
    _contacts.setdefault(agent_id, []).append(contact)
    return contact


def list_contacts(agent_id):
    return _contacts.get(agent_id, [])


def remove_contact(agent_id, email):
    before = len(_contacts.get(agent_id, []))
    _contacts[agent_id] = [c for c in _contacts.get(agent_id, []) if c["email"] != email]
    return len(_contacts[agent_id]) < before