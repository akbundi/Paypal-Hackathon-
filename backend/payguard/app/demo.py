"""
Interactive demonstration of AI Shopping Agent Authorization & Policy Engine.
"""
from models import (
    SpendingPolicy,
    CategoryRule,
    CategoryRuleType,
    PurchaseItem,
    PaymentRequest,
    TrustedContact,
)
from agent_authorizer import AgentAuthorizer


def run_demo():
    print("=" * 70)
    print(" AI Shopping Agent Authorization System Demo")
    print("=" * 70)

    authorizer = AgentAuthorizer()

    # 1. Define Trusted Family Contacts
    parent_1 = TrustedContact(
        contact_id="parent_01",
        name="Sarah (Mom)",
        relationship="Parent",
        email="mom@family.org",
        is_approver=True,
        approval_limit=500.0,
    )
    parent_2 = TrustedContact(
        contact_id="parent_02",
        name="David (Dad)",
        relationship="Parent",
        email="dad@family.org",
        is_approver=True,
        approval_limit=1000.0,
    )

    # 2. Configure Spending Policy
    user_id = "amrita"
    policy = SpendingPolicy(
        policy_id="policy_amrita_01",
        user_id=user_id,
        single_transaction_limit=150.0,
        auto_approve_threshold=30.0,
        weekly_budget=200.0,
        monthly_budget=750.0,
        blocked_merchants=["SuspiciousSite.com", "RiskyGames.net"],
        category_rules={
            "groceries": CategoryRule("groceries", CategoryRuleType.ALLOW),
            "study_supplies": CategoryRule("study_supplies", CategoryRuleType.ALLOW, per_item_max_price=40.0),
            "electronics": CategoryRule("electronics", CategoryRuleType.REQUIRE_APPROVAL),
            "gambling": CategoryRule("gambling", CategoryRuleType.DENY),
        },
        trusted_contacts=[parent_1, parent_2],
    )
    authorizer.register_policy(policy)
    print("\n[+] Spending Policy Registered successfully:")
    print(f"    - Weekly Budget: ${policy.weekly_budget:.2f}")
    print(f"    - Monthly Budget: ${policy.monthly_budget:.2f}")
    print(f"    - Auto-approval Threshold: ${policy.auto_approve_threshold:.2f}")
    print(f"    - Blocked Categories: gambling")
    print(f"    - Approval-Required Categories: electronics")

    # Scenario 1: Auto-approval for low-cost allowed category
    print("\n" + "-" * 70)
    print("Scenario 1: Small Grocery Purchase (Under $30)")
    req1 = PaymentRequest(
        request_id="REQ-101",
        agent_id="shopping_agent_v1",
        user_id=user_id,
        items=[PurchaseItem("item_1", "Organic Milk & Apples", "groceries", 18.50, 1)],
        merchant="FreshMart",
    )
    authorizer.submit_request(req1)
    print(f" -> Result Status: {req1.status.value}")
    print(f" -> Decision: {req1.decision_reason}")

    # Scenario 2: Blocked Category (Gambling)
    print("\n" + "-" * 70)
    print("Scenario 2: Blocked Category Attempt")
    req2 = PaymentRequest(
        request_id="REQ-102",
        agent_id="shopping_agent_v1",
        user_id=user_id,
        items=[PurchaseItem("item_2", "Casino Chips", "gambling", 25.00, 1)],
        merchant="RiskyGames.net",
    )
    authorizer.submit_request(req2)
    print(f" -> Result Status: {req2.status.value}")
    print(f" -> Decision: {req2.decision_reason}")

    # Scenario 3: Requires Family Approval (Electronics)
    print("\n" + "-" * 70)
    print("Scenario 3: Higher-Value Electronics Purchase")
    req3 = PaymentRequest(
        request_id="REQ-103",
        agent_id="shopping_agent_v1",
        user_id=user_id,
        items=[PurchaseItem("item_3", "Noise Cancelling Headphones", "electronics", 120.00, 1)],
        merchant="BestElectronics",
    )
    authorizer.submit_request(req3)
    print(f" -> Result Status: {req3.status.value}")
    print(f" -> Pending Reason: {req3.decision_reason}")

    # Inspect Notification Alerts
    latest_alerts = [a for a in authorizer.notification_service.sent_alerts if a.metadata.get("request_id") == "REQ-103"]
    print(f" -> Notifications Dispatched: {len(latest_alerts)} alerts sent to family approvers.")

    # Trusted parent approves
    print(" -> Action: Parent (Mom) approves request REQ-103...")
    authorizer.approve_request("REQ-103", approver_contact_id="parent_01", comments="Approved for studies.")
    print(f" -> Updated Status: {req3.status.value} by {req3.decided_by} ({req3.decision_reason})")

    # Scenario 4: Weekly Budget Exceeded
    print("\n" + "-" * 70)
    print("Scenario 4: Weekly Budget Limit Enforcement")
    spent = authorizer.policy_engine.budget_manager.get_weekly_spent(user_id)
    print(f" -> Current weekly spending: ${spent:.2f} / ${policy.weekly_budget:.2f}")

    req4 = PaymentRequest(
        request_id="REQ-104",
        agent_id="shopping_agent_v1",
        user_id=user_id,
        items=[PurchaseItem("item_4", "Premium Art Supplies", "study_supplies", 85.00, 1)],
        merchant="ArtStore",
    )
    authorizer.submit_request(req4)
    print(f" -> Result Status: {req4.status.value}")
    print(f" -> Decision: {req4.decision_reason}")
    print("=" * 70)


if __name__ == "__main__":
    run_demo()

