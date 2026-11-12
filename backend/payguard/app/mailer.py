"""Transactional email. Without SMTP configured, messages are logged (never the secret token in production)."""
import asyncio, logging, smtplib
from email.message import EmailMessage
from . import config

log = logging.getLogger("payguard.mail")


def _send(to, subject, body):
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = config.SMTP_FROM, to, subject
    msg.set_content(body)
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=15) as s:
        s.starttls()
        if config.SMTP_USER:
            s.login(config.SMTP_USER, config.SMTP_PASSWORD)
        s.send_message(msg)


async def send(to: str, subject: str, body: str) -> bool:
    if not config.SMTP_HOST:
        log.info("[mail not configured] to=%s subject=%s%s", to, subject, "" if config.APP_ENV == "production" else f"\n{body}")
        return False
    try:
        await asyncio.to_thread(_send, to, subject, body)
        return True
    except Exception as e:
        log.warning("email to %s failed: %s", to, e)
        return False
