
from app.paypal.client import paypal_request


def capture_payment(order_id):
    if not order_id:
        raise ValueError("Order ID is required")

    return paypal_request(
        "POST",
        f"/v2/checkout/orders/{order_id}/capture"
    )
