from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Job
from app.schemas.statistics import StatisticsOut


def for_user(db: Session, user_id: int) -> StatisticsOut:
    jobs = db.execute(select(Job).where(Job.user_id == user_id)).scalars().all()

    total = len(jobs)
    queued = sum(1 for j in jobs if j.status == "QUEUED")
    processing = sum(1 for j in jobs if j.status == "PROCESSING")
    done = sum(1 for j in jobs if j.status == "DONE")
    failed = sum(1 for j in jobs if j.status == "FAILED")

    finished = done + failed
    success_rate = (done / finished * 100) if finished else 0.0

    durations = [(j.completed_at - j.started_at).total_seconds()
                 for j in jobs if j.started_at and j.completed_at]
    avg_duration = sum(durations) / len(durations) if durations else None

    total_bytes = sum(j.file_size for j in jobs)

    type_counter = Counter(j.processing_type for j in jobs)

    # uploads per day, last 14 days
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    daily = Counter()
    for j in jobs:
        if j.created_at and (now - j.created_at).days < 14:
            daily[j.created_at.date().isoformat()] += 1
    uploads_per_day = []
    for i in range(13, -1, -1):
        day = (now - timedelta(days=i)).date().isoformat()
        uploads_per_day.append({"date": day, "uploads": daily.get(day, 0)})

    return StatisticsOut(
        total_files=total,
        processing=processing + queued,
        completed=done,
        failed=failed,
        queued=queued,
        success_rate=round(success_rate, 2),
        avg_processing_time_seconds=round(avg_duration, 2) if avg_duration else None,
        total_storage_bytes=total_bytes,
        file_type_distribution=dict(type_counter),
        uploads_per_day=uploads_per_day,
        processing_success_failure={"success": done, "failure": failed},
    )