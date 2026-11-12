"""
Budget manager for weekly and monthly budget restrictions and spending tracking.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from models import PaymentRequest, RequestStatus


@dataclass
class BudgetStatus:
    allowed: bool
    reason: str
    weekly_spent: float
    weekly_limit: float
    monthly_spent: float
    monthly_limit: float


class BudgetManager:
    def __init__(self):
        # Maps user_id -> List of recorded approved PaymentRequests
        self._user_transactions: Dict[str, List[PaymentRequest]] = {}

    def record_spending(self, request: PaymentRequest) -> None:
        """Records an approved spending request."""
        if request.status not in (RequestStatus.APPROVED, RequestStatus.AUTO_APPROVED):
            return

        if request.user_id not in self._user_transactions:
            self._user_transactions[request.user_id] = []
        self._user_transactions[request.user_id].append(request)

    def get_spending(self, user_id: str, since: datetime) -> float:
        """Calculates total spending for user since a specified timestamp."""
        transactions = self._user_transactions.get(user_id, [])
        total = 0.0
        for tx in transactions:
            tx_time = tx.decided_at or tx.created_at
            if tx_time >= since:
                total += tx.total_amount
        return total

    def get_weekly_spent(self, user_id: str, as_of: Optional[datetime] = None) -> float:
        as_of = as_of or datetime.utcnow()
        start_of_week = as_of - timedelta(days=7)
        return self.get_spending(user_id, start_of_week)

    def get_monthly_spent(self, user_id: str, as_of: Optional[datetime] = None) -> float:
        as_of = as_of or datetime.utcnow()
        start_of_month = as_of - timedelta(days=30)
        return self.get_spending(user_id, start_of_month)

    def check_budget_limit(
        self,
        user_id: str,
        amount: float,
        weekly_limit: float,
        monthly_limit: float,
        daily_limit: Optional[float] = None,
        as_of: Optional[datetime] = None,
    ) -> BudgetStatus:
        as_of = as_of or datetime.utcnow()
        weekly_spent = self.get_weekly_spent(user_id, as_of)
        monthly_spent = self.get_monthly_spent(user_id, as_of)

        if daily_limit is not None:
            start_of_day = as_of - timedelta(days=1)
            daily_spent = self.get_spending(user_id, start_of_day)
            if daily_spent + amount > daily_limit:
                return BudgetStatus(
                    allowed=False,
                    reason=f"Exceeds daily budget: current {daily_spent:.2f} + {amount:.2f} > limit {daily_limit:.2f}",
                    weekly_spent=weekly_spent,
                    weekly_limit=weekly_limit,
                    monthly_spent=monthly_spent,
                    monthly_limit=monthly_limit,
                )

        if weekly_spent + amount > weekly_limit:
            return BudgetStatus(
                allowed=False,
                reason=f"Exceeds weekly budget: current {weekly_spent:.2f} + {amount:.2f} > limit {weekly_limit:.2f}",
                weekly_spent=weekly_spent,
                weekly_limit=weekly_limit,
                monthly_spent=monthly_spent,
                monthly_limit=monthly_limit,
            )

        if monthly_spent + amount > monthly_limit:
            return BudgetStatus(
                allowed=False,
                reason=f"Exceeds monthly budget: current {monthly_spent:.2f} + {amount:.2f} > limit {monthly_limit:.2f}",
                weekly_spent=weekly_spent,
                weekly_limit=weekly_limit,
                monthly_spent=monthly_spent,
                monthly_limit=monthly_limit,
            )

        return BudgetStatus(
            allowed=True,
            reason="Within budget limits.",
            weekly_spent=weekly_spent,
            weekly_limit=weekly_limit,
            monthly_spent=monthly_spent,
            monthly_limit=monthly_limit,
        )

    def reset_user(self, user_id: str) -> None:
        """Clears transaction history for a user (useful for testing)."""
        self._user_transactions.pop(user_id, None)

