
from app.paypal.client import paypal_request


def create_order(amount, currency="USD"):
    amount = float(amount)

    if amount <= 0:
        raise ValueError("Amount must be greater than zero")

    if len(currency) != 3 or not currency.isalpha():
        raise ValueError("Invalid currency code")

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": currency.upper(),
                    "value": f"{amount:.2f}"
                }
            }
        ],
        "application_context": {
            "brand_name": "PayPal Hackathon",
            "user_action": "PAY_NOW",
            "return_url": "https://example.com/payment/success",
            "cancel_url": "https://example.com/payment/cancel"
        }
    }

    return paypal_request(
        "POST",
        "/v2/checkout/orders",
        payload
    )
