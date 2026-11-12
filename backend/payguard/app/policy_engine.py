"""
Policy Engine for evaluating AI shopping requests against user policies.
"""
from dataclasses import dataclass
from typing import List, Optional
from models import PaymentRequest, SpendingPolicy, RequestStatus
from budget_manager import BudgetManager, BudgetStatus
from category_validator import CategoryValidator, CategoryValidationResult


@dataclass
class PolicyEvaluationResult:
    allowed: bool
    requires_approval: bool
    status: RequestStatus
    reasons: List[str]
    budget_status: Optional[BudgetStatus] = None
    category_status: Optional[CategoryValidationResult] = None


class PolicyEngine:
    def __init__(
        self,
        budget_manager: Optional[BudgetManager] = None,
        category_validator: Optional[CategoryValidator] = None,
    ):
        self.budget_manager = budget_manager or BudgetManager()
        self.category_validator = category_validator or CategoryValidator()

    def evaluate_request(
        self,
        request: PaymentRequest,
        policy: SpendingPolicy
    ) -> PolicyEvaluationResult:
        reasons = []

        # 1. Merchant Restriction Checks
        merchant_norm = request.merchant.lower()
        blocked_merchants = [m.lower() for m in policy.blocked_merchants]
        if merchant_norm in blocked_merchants:
            return PolicyEvaluationResult(
                allowed=False,
                requires_approval=False,
                status=RequestStatus.BLOCKED,
                reasons=[f"Merchant '{request.merchant}' is on the blocked list."],
            )

        if policy.allowed_merchants is not None:
            allowed_merchants = [m.lower() for m in policy.allowed_merchants]
            if merchant_norm not in allowed_merchants:
                return PolicyEvaluationResult(
                    allowed=False,
                    requires_approval=False,
                    status=RequestStatus.BLOCKED,
                    reasons=[f"Merchant '{request.merchant}' is not an authorized merchant."],
                )

        # 2. Category Rule Validation
        cat_result = self.category_validator.validate_items(
            request.items, policy.category_rules
        )
        if not cat_result.is_allowed:
            return PolicyEvaluationResult(
                allowed=False,
                requires_approval=False,
                status=RequestStatus.BLOCKED,
                reasons=[f"Category rule violation: {cat_result.reason}"],
                category_status=cat_result,
            )

        if cat_result.requires_approval:
            reasons.append(cat_result.reason)

        # 3. Budget Validations (Daily, Weekly, Monthly)
        total_amount = request.total_amount
        budget_status = self.budget_manager.check_budget_limit(
            user_id=policy.user_id,
            amount=total_amount,
            weekly_limit=policy.weekly_budget,
            monthly_limit=policy.monthly_budget,
            daily_limit=policy.daily_budget,
            as_of=request.created_at,
        )

        if not budget_status.allowed:
            return PolicyEvaluationResult(
                allowed=False,
                requires_approval=False,
                status=RequestStatus.BLOCKED,
                reasons=[f"Budget exceeded: {budget_status.reason}"],
                budget_status=budget_status,
                category_status=cat_result,
            )

        # 4. Single Transaction Limit
        if total_amount > policy.single_transaction_limit:
            reasons.append(
                f"Amount (${total_amount:.2f}) exceeds single transaction limit (${policy.single_transaction_limit:.2f})."
            )

        # 5. Determine whether Auto-Approved or Needs Family Approval
        if reasons:
            return PolicyEvaluationResult(
                allowed=True,
                requires_approval=True,
                status=RequestStatus.PENDING,
                reasons=reasons,
                budget_status=budget_status,
                category_status=cat_result,
            )

        # If total amount is within auto-approve threshold and no other flags
        if total_amount <= policy.auto_approve_threshold:
            return PolicyEvaluationResult(
                allowed=True,
                requires_approval=False,
                status=RequestStatus.AUTO_APPROVED,
                reasons=["Within auto-approval threshold and policy parameters."],
                budget_status=budget_status,
                category_status=cat_result,
            )

        # Otherwise, requires routine approval
        return PolicyEvaluationResult(
            allowed=True,
            requires_approval=True,
            status=RequestStatus.PENDING,
            reasons=[
                f"Amount (${total_amount:.2f}) exceeds auto-approval threshold (${policy.auto_approve_threshold:.2f})."
            ],
            budget_status=budget_status,
            category_status=cat_result,
        )

