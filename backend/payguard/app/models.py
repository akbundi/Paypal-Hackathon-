import re
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

Lang = Literal["en", "hi", "mr"]
Role = Literal["owner", "admin", "approver", "member", "viewer"]
EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


def _email(v: str) -> str:
    return v.strip().lower()


def _password(v: str) -> str:
    if not (10 <= len(v) <= 128):
        raise ValueError("Password must be 10-128 characters")
    if not (re.search(r"[a-z]", v) and re.search(r"[A-Z]", v) and re.search(r"\d", v)):
        raise ValueError("Password needs an uppercase letter, a lowercase letter and a digit")
    return v


class _Emailed(BaseModel):
    email: str = Field(max_length=254, pattern=EMAIL)
    _norm = field_validator("email")(_email)


# ---------- auth / users ----------
class RegisterIn(_Emailed):
    org_name: str = Field(min_length=1, max_length=120)
    full_name: str = Field("", max_length=120)
    password: str
    _pw = field_validator("password")(_password)


class LoginIn(_Emailed):
    password: str = Field(min_length=1, max_length=128)


class RefreshIn(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=300)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str
    _pw = field_validator("new_password")(_password)


class ForgotIn(_Emailed):
    pass


class ResetIn(BaseModel):
    token: str = Field(min_length=10, max_length=300)
    new_password: str
    _pw = field_validator("new_password")(_password)


class TokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=300)


class InviteIn(_Emailed):
    role: Role = "member"
    full_name: str = Field("", max_length=120)


class AcceptInviteIn(BaseModel):
    token: str = Field(min_length=10, max_length=300)
    password: str
    full_name: str = Field("", max_length=120)
    _pw = field_validator("password")(_password)


class ProfilePatch(BaseModel):
    full_name: str = Field(min_length=0, max_length=120)


class UserPatch(BaseModel):
    full_name: Optional[str] = Field(None, max_length=120)
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    unlock: Optional[bool] = None


class ApiKeyIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class OrgIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class WebhookCfg(BaseModel):
    url: str = Field(pattern=r"^https?://\S+$", max_length=500)


# ---------- payments ----------
class PaymentIn(BaseModel):
    requester: Optional[str] = Field(None, min_length=1, max_length=254)  # forced to the user's email for user logins
    amount: float = Field(gt=0, le=10_000_000)
    currency: str = Field("USD", pattern="^[A-Z]{3}$")
    recipient_email: Optional[str] = Field(None, pattern=EMAIL, max_length=254)
    vendor_id: Optional[str] = Field(None, max_length=64)
    invoice_no: Optional[str] = Field(None, max_length=60)
    message: str = Field("", max_length=4000)
    category: str = Field("general", max_length=40)
    agent_id: Optional[str] = Field(None, max_length=80)
    approvers: list[str] = Field(default_factory=list, max_length=10)
    language: Lang = "en"

    @field_validator("amount")
    @classmethod
    def _round(cls, v):
        v = round(v, 2)
        if v < 0.01:
            raise ValueError("amount must be at least 0.01")
        return v


class BatchIn(BaseModel):
    items: list[PaymentIn] = Field(min_length=1, max_length=100)
    dry_run: bool = False


class AnalyzeIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    amount: Optional[float] = Field(None, ge=0)
    language: Lang = "en"


class VoteIn(BaseModel):
    approver: Optional[str] = Field(None, min_length=1, max_length=254)  # required for API keys, ignored for user logins
    action: Literal["approve", "decline"]
    comment: str = Field("", max_length=500)


class TokenVoteIn(BaseModel):
    action: Literal["approve", "decline"]
    comment: str = Field("", max_length=500)


class Tier(BaseModel):
    above: float = Field(ge=0)
    approvals: int = Field(ge=1, le=5)


class PolicyIn(BaseModel):
    block_score: int = Field(80, ge=1, le=100)
    hold_score: int = Field(40, ge=1, le=100)
    max_single: float = Field(1_000_000, gt=0)
    approval_required_above: float = Field(5000, ge=0)
    approval_tiers: list[Tier] = [Tier(above=0, approvals=1), Tier(above=25000, approvals=2)]
    blocked_recipients: list[str] = []
    blocked_domains: list[str] = []
    allowed_categories: list[str] = []
    require_registered_vendor_above: float = Field(5000, ge=0)
    velocity_per_hour: int = Field(20, ge=1)
    approvers: list[str] = []
    business_hours: Optional[dict] = None  # {"start":9,"end":18,"utc_offset_minutes":330}

    @model_validator(mode="after")
    def _check(self):
        if self.hold_score > self.block_score:
            raise ValueError("hold_score must not exceed block_score")
        bh = self.business_hours
        if bh is not None and not (0 <= bh.get("start", 9) < bh.get("end", 18) <= 24):
            raise ValueError("business_hours needs 0 <= start < end <= 24")
        return self


class MandateIn(BaseModel):
    agent_id: str = Field(min_length=1, max_length=80)
    weekly_limit: float = Field(gt=0, le=10_000_000)
    per_order_limit: float = Field(gt=0, le=10_000_000)
    categories: list[str] = []


class VendorIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(pattern=EMAIL, max_length=254)
    trusted: bool = True
    _norm = field_validator("email")(_email)


class VendorPatch(BaseModel):
    email: Optional[str] = Field(None, pattern=EMAIL, max_length=254)
    trusted: Optional[bool] = None
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    AUTO_APPROVED = "AUTO_APPROVED"
    BLOCKED = "BLOCKED"


class CategoryRuleType(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"


class NotificationChannel(str, Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"
    IN_APP = "IN_APP"


@dataclass
class TrustedContact:
    contact_id: str
    name: str
    relationship: str  # e.g., "Parent", "Spouse", "Guardian"
    email: str
    phone: Optional[str] = None
    is_approver: bool = True
    approval_limit: Optional[float] = None  # None indicates full limit up to policy


@dataclass
class PurchaseItem:
    item_id: str
    name: str
    category: str
    price: float
    quantity: int = 1
    merchant: Optional[str] = None

    @property
    def total_price(self) -> float:
        return self.price * self.quantity


@dataclass
class PaymentRequest:
    request_id: str
    agent_id: str
    user_id: str
    items: List[PurchaseItem]
    merchant: str
    status: RequestStatus = RequestStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    decided_at: Optional[datetime] = None
    decision_reason: Optional[str] = None
    decided_by: Optional[str] = None  # contact_id or "SYSTEM"

    @property
    def total_amount(self) -> float:
        return sum(item.total_price for item in self.items)

    @property
    def categories(self) -> Set[str]:
        return {item.category.lower() for item in self.items}


@dataclass
class CategoryRule:
    category: str
    rule_type: CategoryRuleType = CategoryRuleType.ALLOW
    per_item_max_price: Optional[float] = None
    require_trusted_contact_approval: bool = False


@dataclass
class SpendingPolicy:
    policy_id: str
    user_id: str
    single_transaction_limit: float = 100.0
    auto_approve_threshold: float = 25.0
    daily_budget: Optional[float] = None
    weekly_budget: float = 300.0
    monthly_budget: float = 1000.0
    allowed_merchants: Optional[List[str]] = None
    blocked_merchants: List[str] = field(default_factory=list)
    category_rules: Dict[str, CategoryRule] = field(default_factory=dict)
    trusted_contacts: List[TrustedContact] = field(default_factory=list)

    
