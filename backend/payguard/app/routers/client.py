
import os
import requests
from dotenv import load_dotenv

load_dotenv()

PAYPAL_BASE_URL = os.getenv(
    "PAYPAL_BASE_URL",
    "https://api-m.sandbox.paypal.com"
)

CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")


def get_access_token():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError("PayPal credentials are missing")

    response = requests.post(
        f"{PAYPAL_BASE_URL}/v1/oauth2/token",
        auth=(CLIENT_ID, CLIENT_SECRET),
        headers={"Accept": "application/json"},
        data={"grant_type": "client_credentials"},
        timeout=20
    )

    response.raise_for_status()
    return response.json()["access_token"]


def paypal_request(method, endpoint, payload=None):
    token = get_access_token()

    response = requests.request(
        method=method,
        url=f"{PAYPAL_BASE_URL}{endpoint}",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=20
    )

    response.raise_for_status()
    return response.json()
