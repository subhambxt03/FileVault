import json
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Job, JobStatus
from app.schemas.job import JobListOut, JobOut
from app.storage import get_storage


def _object_key(user_id: int, job_id: int, filename: str) -> str:
    return f"users/{user_id}/jobs/{job_id}/original/{filename}"


def create_job(db: Session, *, user_id: int, filename: str, content_type: str,
               size: int, processing_type: str, data: bytes) -> Job:
    job = Job(
        user_id=user_id,
        original_filename=filename,
        file_type=content_type,
        file_size=size,
        status=JobStatus.QUEUED.value,
        progress=0,
        processing_type=processing_type,
        storage_key="",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    key = _object_key(user_id, job.id, filename)
    get_storage().upload_bytes(key, data, content_type)
    job.storage_key = key
    db.commit()
    db.refresh(job)

    # Local import to avoid a circular dependency with app.tasks.processing
    from app.tasks.processing import process_file_task
    process_file_task.delay(job.id)
    return job


def get_user_job(db: Session, user_id: int, job_id: int) -> Job | None:
    return db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    ).scalar_one_or_none()


def list_jobs(db: Session, user_id: int, status: str | None,
              search: str | None, page: int, page_size: int) -> JobListOut:
    stmt = select(Job).where(Job.user_id == user_id)
    count_stmt = select(func.count(Job.id)).where(Job.user_id == user_id)

    if status and status.upper() != "ALL":
        stmt = stmt.where(Job.status == status.upper())
        count_stmt = count_stmt.where(Job.status == status.upper())
    if search:
        like = f"%{search}%"
        stmt = stmt.where(Job.original_filename.like(like))
        count_stmt = count_stmt.where(Job.original_filename.like(like))

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()

    items = []
    for j in rows:
        out = JobOut.model_validate(j)
        out.duration_seconds = j.duration_seconds
        items.append(out)
    return JobListOut(total=total, items=items)


def output_keys(job: Job) -> list[str]:
    if not job.output_storage_key:
        return []
    if job.output_storage_key.startswith("{"):
        return list(json.loads(job.output_storage_key).values())
    return [job.output_storage_key]


def delete_job(db: Session, job: Job) -> None:
    storage = get_storage()
    keys = [job.storage_key] + output_keys(job)
    for k in keys:
        if k:
            try:
                storage.delete(k)
            except Exception:
                pass
    db.delete(job)
    db.commit()


def mark_processing(db: Session, job: Job) -> None:
    job.status = JobStatus.PROCESSING.value
    job.progress = 25
    job.started_at = datetime.now(timezone.utc)
    db.commit()


def mark_done(db: Session, job: Job, output_key: str) -> None:
    job.status = JobStatus.DONE.value
    job.progress = 100
    job.output_storage_key = output_key
    job.completed_at = datetime.now(timezone.utc)
    job.error_message = None
    db.commit()


def mark_failed(db: Session, job: Job, error: str) -> None:
    job.status = JobStatus.FAILED.value
    job.error_message = error[:2000]
    job.completed_at = datetime.now(timezone.utc)
    db.commit()


def bump_retry(db: Session, job: Job, count: int) -> None:
    job.retry_count = count
    db.commit()