import json
import logging
import time

from app.database import SessionLocal
from app.models import Job, NotificationType
from app.services import job_service, notification_service, webhook_service
from app.storage import get_storage
from app.utils.processors import process_image, process_pdf, process_text

logger = logging.getLogger("fileflow.worker")

RETRY_BACKOFF = [10, 60, 300]  # seconds between attempts


def process_file(job_id: int) -> None:
    """Process a job. Runs in a background thread — no Celery required.

    Retries up to 3 times with increasing backoff. After the last failure the
    job is marked FAILED and a webhook is fired.
    """
    attempt = 0
    while True:
        try:
            _run_once(job_id)
            return
        except Exception as exc:  # noqa: BLE001
            attempt += 1
            logger.exception("job.error id=%s attempt=%s", job_id, attempt)

            if attempt >= 3:
                _record_final_failure(job_id, exc)
                return

            time.sleep(RETRY_BACKOFF[attempt - 1])


def _run_once(job_id: int) -> None:
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
            db,
            job.user_id,
            job.id,
            NotificationType.FILE_COMPLETED.value,
            f"{job.original_filename} processing completed.",
        )

        _fire_webhook(job, success=True)
        logger.info("job.completed id=%s", job.id)

    finally:
        db.close()


def _record_final_failure(job_id: int, exc: Exception) -> None:
    db = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job:
            return

        job_service.mark_failed(db, job, str(exc))
        notification_service.create(
            db,
            job.user_id,
            job.id,
            NotificationType.FILE_FAILED.value,
            f"{job.original_filename} processing failed: {exc}",
        )
        _fire_webhook(job, success=False, error=str(exc))
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


def _fire_webhook(
    job: Job,
    success: bool,
    error: str | None = None,
    download_url: str | None = None,
) -> None:
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

        for hook in hooks:
            try:
                webhook_service.send(hook.url, payload)
            except Exception:
                logger.exception("Webhook failed for job %s", job.id)
    finally:
        db.close()