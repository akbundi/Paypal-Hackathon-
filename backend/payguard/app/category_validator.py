"""
Category validator for category-based purchase rules.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional
from models import CategoryRule, CategoryRuleType, PurchaseItem


@dataclass
class CategoryValidationResult:
    is_allowed: bool
    requires_approval: bool
    reason: str
    flagged_categories: List[str]


class CategoryValidator:
    def __init__(self, default_deny: bool = False):
        self.default_deny = default_deny

    def validate_items(
        self,
        items: List[PurchaseItem],
        rules: Dict[str, CategoryRule]
    ) -> CategoryValidationResult:
        """
        Validates a list of purchase items against defined category rules.
        """
        # Normalize rule keys to lowercase
        norm_rules = {k.lower(): v for k, v in rules.items()}
        requires_approval = False
        reasons = []
        flagged = []

        for item in items:
            cat = item.category.lower()
            rule = norm_rules.get(cat)

            if rule is None:
                if self.default_deny:
                    return CategoryValidationResult(
                        is_allowed=False,
                        requires_approval=False,
                        reason=f"Category '{item.category}' is not explicitly permitted.",
                        flagged_categories=[item.category],
                    )
                continue

            if rule.rule_type == CategoryRuleType.DENY:
                return CategoryValidationResult(
                    is_allowed=False,
                    requires_approval=False,
                    reason=f"Category '{item.category}' is strictly restricted/blocked.",
                    flagged_categories=[item.category],
                )

            if rule.rule_type == CategoryRuleType.REQUIRE_APPROVAL:
                requires_approval = True
                flagged.append(item.category)
                reasons.append(f"Category '{item.category}' requires manual family/parent approval.")

            if rule.per_item_max_price is not None and item.price > rule.per_item_max_price:
                requires_approval = True
                flagged.append(item.category)
                reasons.append(
                    f"Item '{item.name}' price ({item.price:.2f}) exceeds category max limit of {rule.per_item_max_price:.2f}."
                )

            if rule.require_trusted_contact_approval:
                requires_approval = True
                flagged.append(item.category)
                reasons.append(f"Category '{item.category}' flagged for trusted contact sign-off.")

        return CategoryValidationResult(
            is_allowed=True,
            requires_approval=requires_approval,
            reason="; ".join(reasons) if reasons else "All item categories are valid.",
            flagged_categories=list(set(flagged)),
        )

