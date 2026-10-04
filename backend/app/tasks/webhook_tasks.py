import logging

import httpx

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import NotificationType
from app.services import notification_service

logger = logging.getLogger("fileflow.webhook")


@celery_app.task(name="tasks.send_webhook", max_retries=2, default_retry_delay=15)
def send_webhook(webhook_id: int, url: str, payload: dict, user_id: int, job_id: int):
    try:
        resp = httpx.post(url, json=payload, timeout=10.0)
        resp.raise_for_status()
        _notify(user_id, job_id, NotificationType.WEBHOOK_SUCCESS.value,
                f"Webhook delivered: {payload.get('event')}")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook failure url=%s error=%s", url, exc)
        _notify(user_id, job_id, NotificationType.WEBHOOK_FAILED.value,
                f"Webhook failed: {exc}")
        raise self.retry(exc=exc)


def _notify(user_id: int, job_id: int, type_: str, message: str) -> None:
    db = SessionLocal()
    try:
        notification_service.create(db, user_id, job_id, type_, message)
    finally:
        db.close()