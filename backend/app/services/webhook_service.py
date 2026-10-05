import logging

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Webhook

logger = logging.getLogger("fileflow.webhook")


def create(db: Session, user_id: int, url: str) -> Webhook:
    w = Webhook(user_id=user_id, url=url, is_active=True)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


def list_for_user(db: Session, user_id: int) -> list[Webhook]:
    return db.execute(select(Webhook).where(Webhook.user_id == user_id)).scalars().all()


def delete(db: Session, user_id: int, webhook_id: int) -> bool:
    w = db.execute(
        select(Webhook).where(Webhook.id == webhook_id, Webhook.user_id == user_id)
    ).scalar_one_or_none()
    if not w:
        return False
    db.delete(w)
    db.commit()
    return True


def active_for_user(db: Session, user_id: int) -> list[Webhook]:
    return db.execute(
        select(Webhook).where(Webhook.user_id == user_id, Webhook.is_active.is_(True))
    ).scalars().all()


def send(url: str, payload: dict) -> None:
    """Send a webhook payload. Directly synchronous — no Celery."""
    resp = httpx.post(url, json=payload, timeout=10.0)
    resp.raise_for_status()
    logger.info("webhook.sent url=%s event=%s", url, payload.get("event"))