"""
Agent Authorizer: Orchestrates policy checks, approvals, rejections, trusted family contact reviews, and notifications.
"""
from datetime import datetime
from typing import Dict, List, Optional
from models import PaymentRequest, SpendingPolicy, RequestStatus, TrustedContact
from policy_engine import PolicyEngine, PolicyEvaluationResult
from family_contact_manager import FamilyContactManager
from notification_service import NotificationService


class AgentAuthorizer:
    def __init__(
        self,
        policy_engine: Optional[PolicyEngine] = None,
        contact_manager: Optional[FamilyContactManager] = None,
        notification_service: Optional[NotificationService] = None,
    ):
        self.policy_engine = policy_engine or PolicyEngine()
        self.contact_manager = contact_manager or FamilyContactManager()
        self.notification_service = notification_service or NotificationService()

        # Storage for policies and active payment requests
        self._policies: Dict[str, SpendingPolicy] = {}
        self._requests: Dict[str, PaymentRequest] = {}

    def register_policy(self, policy: SpendingPolicy) -> None:
        self._policies[policy.user_id] = policy
        # Sync contacts from policy to contact manager
        for contact in policy.trusted_contacts:
            self.contact_manager.add_contact(policy.user_id, contact)

    def get_policy(self, user_id: str) -> Optional[SpendingPolicy]:
        return self._policies.get(user_id)

    def submit_request(self, request: PaymentRequest) -> PaymentRequest:
        """
        AI Agent submits a purchase/payment request.
        The authorizer evaluates policy, records status, and notifies contacts if needed.
        """
        policy = self._policies.get(request.user_id)
        if not policy:
            request.status = RequestStatus.BLOCKED
            request.decided_at = datetime.utcnow()
            request.decided_by = "SYSTEM"
            request.decision_reason = f"No active spending policy found for user '{request.user_id}'."
            self._requests[request.request_id] = request
            return request

        eval_result: PolicyEvaluationResult = self.policy_engine.evaluate_request(request, policy)
        request.status = eval_result.status

        if eval_result.status == RequestStatus.BLOCKED:
            request.decided_at = datetime.utcnow()
            request.decided_by = "POLICY_ENGINE"
            request.decision_reason = "; ".join(eval_result.reasons)

            contacts = self.contact_manager.get_contacts(request.user_id)
            self.notification_service.notify_decision(request, contacts)

        elif eval_result.status == RequestStatus.AUTO_APPROVED:
            request.decided_at = datetime.utcnow()
            request.decided_by = "AUTO_APPROVAL"
            request.decision_reason = "; ".join(eval_result.reasons)

            # Record spending in budget manager
            self.policy_engine.budget_manager.record_spending(request)

            contacts = self.contact_manager.get_contacts(request.user_id)
            self.notification_service.notify_decision(request, contacts)

        elif eval_result.status == RequestStatus.PENDING:
            reason_summary = "; ".join(eval_result.reasons)
            request.decision_reason = reason_summary

            # Send email/notifications to eligible family approvers
            approvers = self.contact_manager.get_eligible_approvers(
                request.user_id, request.total_amount
            )
            self.notification_service.notify_approval_needed(approvers, request, reason_summary)

        self._requests[request.request_id] = request
        return request

    def approve_request(
        self,
        request_id: str,
        approver_contact_id: str,
        comments: Optional[str] = None
    ) -> PaymentRequest:
        """
        Trusted contact approves a pending request.
        """
        request = self._requests.get(request_id)
        if not request:
            raise ValueError(f"Request with ID '{request_id}' not found.")

        if request.status != RequestStatus.PENDING:
            raise ValueError(f"Cannot approve request with status '{request.status.value}'.")

        # Validate approver authorization and limits
        if not self.contact_manager.can_contact_approve(
            request.user_id, approver_contact_id, request.total_amount
        ):
            raise PermissionError(
                f"Contact '{approver_contact_id}' is not authorized to approve an amount of ${request.total_amount:.2f}."
            )

        policy = self._policies.get(request.user_id)
        if policy:
            # Re-verify budget hasn't been exhausted while pending
            budget_check = self.policy_engine.budget_manager.check_budget_limit(
                user_id=request.user_id,
                amount=request.total_amount,
                weekly_limit=policy.weekly_budget,
                monthly_limit=policy.monthly_budget,
                daily_limit=policy.daily_budget,
                as_of=datetime.utcnow(),
            )
            if not budget_check.allowed:
                request.status = RequestStatus.BLOCKED
                request.decided_at = datetime.utcnow()
                request.decided_by = "SYSTEM"
                request.decision_reason = f"Approval blocked due to budget limit: {budget_check.reason}"
                contacts = self.contact_manager.get_contacts(request.user_id)
                self.notification_service.notify_decision(request, contacts)
                return request

        request.status = RequestStatus.APPROVED
        request.decided_at = datetime.utcnow()
        request.decided_by = approver_contact_id
        request.decision_reason = comments or "Approved by trusted contact."

        # Record spent budget
        self.policy_engine.budget_manager.record_spending(request)

        # Notify contacts
        contacts = self.contact_manager.get_contacts(request.user_id)
        self.notification_service.notify_decision(request, contacts)

        return request

    def reject_request(
        self,
        request_id: str,
        rejector_contact_id: str,
        reason: str
    ) -> PaymentRequest:
        """
        Trusted contact rejects a pending request.
        """
        request = self._requests.get(request_id)
        if not request:
            raise ValueError(f"Request with ID '{request_id}' not found.")

        if request.status != RequestStatus.PENDING:
            raise ValueError(f"Cannot reject request with status '{request.status.value}'.")

        request.status = RequestStatus.REJECTED
        request.decided_at = datetime.utcnow()
        request.decided_by = rejector_contact_id
        request.decision_reason = reason

        # Notify contacts
        contacts = self.contact_manager.get_contacts(request.user_id)
        self.notification_service.notify_decision(request, contacts)

        return request

    def get_request(self, request_id: str) -> Optional[PaymentRequest]:
        return self._requests.get(request_id)

    def list_requests(
        self,
        user_id: Optional[str] = None,
        status: Optional[RequestStatus] = None
    ) -> List[PaymentRequest]:
        reqs = list(self._requests.values())
        if user_id:
            reqs = [r for r in reqs if r.user_id == user_id]
        if status:
            reqs = [r for r in reqs if r.status == status]
        return reqs

