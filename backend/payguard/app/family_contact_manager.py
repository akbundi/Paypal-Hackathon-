"""
Trusted family contact management module.
"""
from typing import Dict, List, Optional
from models import TrustedContact


class FamilyContactManager:
    def __init__(self):
        # Maps user_id -> List[TrustedContact]
        self._user_contacts: Dict[str, List[TrustedContact]] = {}

    def add_contact(self, user_id: str, contact: TrustedContact) -> None:
        if user_id not in self._user_contacts:
            self._user_contacts[user_id] = []
        # Replace if existing contact_id
        self._user_contacts[user_id] = [
            c for c in self._user_contacts[user_id] if c.contact_id != contact.contact_id
        ]
        self._user_contacts[user_id].append(contact)

    def remove_contact(self, user_id: str, contact_id: str) -> bool:
        if user_id not in self._user_contacts:
            return False
        initial_len = len(self._user_contacts[user_id])
        self._user_contacts[user_id] = [
            c for c in self._user_contacts[user_id] if c.contact_id != contact_id
        ]
        return len(self._user_contacts[user_id]) < initial_len

    def get_contacts(self, user_id: str) -> List[TrustedContact]:
        return list(self._user_contacts.get(user_id, []))

    def get_contact_by_id(self, user_id: str, contact_id: str) -> Optional[TrustedContact]:
        for contact in self._user_contacts.get(user_id, []):
            if contact.contact_id == contact_id:
                return contact
        return None

    def get_eligible_approvers(self, user_id: str, amount: float) -> List[TrustedContact]:
        """Returns trusted contacts who are designated approvers and within their approval limit."""
        approvers = []
        for contact in self._user_contacts.get(user_id, []):
            if not contact.is_approver:
                continue
            if contact.approval_limit is not None and amount > contact.approval_limit:
                continue
            approvers.append(contact)
        return approvers

    def can_contact_approve(self, user_id: str, contact_id: str, amount: float) -> bool:
        contact = self.get_contact_by_id(user_id, contact_id)
        if not contact or not contact.is_approver:
            return False
        if contact.approval_limit is not None and amount > contact.approval_limit:
            return False
        return True

