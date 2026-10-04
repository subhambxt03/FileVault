import json
import logging

from celery.exceptions import MaxRetriesExceededError

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Job, NotificationType
from app.services import job_service, notification_service, webhook_service
from app.storage import get_storage
from app.tasks.webhook_tasks import send_webhook
from app.utils.processors import process_image, process_pdf, process_text

logger = logging.getLogger("fileflow.worker")

RETRY_BACKOFF = [10, 60, 300]  # seconds between attempts


@celery_app.task(bind=True, name="tasks.process_file", max_retries=3)
def process_file_task(self, job_id: int):
    db = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job:
            logger.warning("Job %s not found", job_id)
            return

        job_service.mark_processing(db, job)
        logger.info("job.started id=%s type=%s", job.id, job.processing_type)

        storage = get_storage()
        data = storage.download_bytes(job.storage_key)

        output_key = _run_processor(job, data, storage)

        job_service.mark_done(db, job, output_key)
        notification_service.create(
            db, job.user_id, job.id, NotificationType.FILE_COMPLETED.value,
            f"{job.original_filename} processing completed.",
        )

        _fire_webhook(job, success=True, download_url=None)
        logger.info("job.completed id=%s", job.id)

    except Exception as exc:  # noqa: BLE001
        logger.exception("job.error id=%s", job_id)
        db.rollback()
        job = db.get(Job, job_id)
        if job:
            job_service.bump_retry(db, job, self.request.retries + 1)
            notification_service.create(
                db, job.user_id, job.id, NotificationType.FILE_RETRY.value,
                f"{job.original_filename} retry attempt {self.request.retries + 1}/3.",
            )

        if self.request.retries >= self.max_retries:
            if job:
                job_service.mark_failed(db, job, str(exc))
                notification_service.create(
                    db, job.user_id, job.id, NotificationType.FILE_FAILED.value,
                    f"{job.original_filename} processing failed: {exc}",
                )
                _fire_webhook(job, success=False, error=str(exc))
            try:
                raise MaxRetriesExceededError(str(exc))
            except MaxRetriesExceededError as mre:
                raise mre

        countdown = RETRY_BACKOFF[min(self.request.retries, len(RETRY_BACKOFF) - 1)]
        raise self.retry(exc=exc, countdown=countdown)
    finally:
        db.close()


def _run_processor(job: Job, data: bytes, storage) -> str:
    base = f"users/{job.user_id}/jobs/{job.id}/processed"

    if job.processing_type == "image":
        outputs = process_image(data)
        keys = {}
        for size, out_bytes in outputs.items():
            key = f"{base}/{size}.jpg"
            storage.upload_bytes(key, out_bytes, "image/jpeg")
            keys[size] = key
        return json.dumps(keys)

    if job.processing_type == "pdf":
        text = process_pdf(data)
        key = f"{base}/extracted.txt"
        storage.upload_bytes(key, text.encode("utf-8"), "text/plain")
        return key

    if job.processing_type == "text":
        freq = process_text(data)
        key = f"{base}/word_frequency.json"
        storage.upload_bytes(key, json.dumps(freq, indent=2).encode("utf-8"), "application/json")
        return key

    raise ValueError(f"Unsupported processing type: {job.processing_type}")


def _fire_webhook(job: Job, success: bool, error: str | None = None, download_url: str | None = None) -> None:
    db = SessionLocal()
    try:
        hooks = webhook_service.active_for_user(db, job.user_id)
        if not hooks:
            return
        payload = {
            "event": "file.processing.completed" if success else "file.processing.failed",
            "job_id": f"JOB-{job.id}",
            "status": "DONE" if success else "FAILED",
            "filename": job.original_filename,
        }
        if success:
            payload["download_url"] = download_url
        else:
            payload["error"] = error or "unknown"
        for h in hooks:
            send_webhook.delay(h.id, h.url, payload, job.user_id, job.id)
    finally:
        db.close()