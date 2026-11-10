import os
import json
import urllib.request


def send_alert(contact, message):
    """Zapier webhook ko alert bhejta hai. URL .env me ZAPIER_WEBHOOK_URL se aata hai."""
    url = os.getenv("ZAPIER_WEBHOOK_URL")
    payload = {"to_name": contact["name"], "to_email": contact["email"], "message": message}
    if not url:
        print("[ALERT - no Zapier URL set]", payload)
        return False
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=5)
        return True
    except Exception as e:
        print("[ALERT FAILED]", e)
        return False