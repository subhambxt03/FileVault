from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Job, User
from app.schemas.job import DownloadOut, JobListOut, JobOut, JobStatusOut
from app.services import job_service
from app.utils.security import get_current_user
from app.storage import get_storage

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=JobListOut)
def list_jobs(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    return job_service.list_jobs(db, current.id, status, search, page, page_size)


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    job = job_service.get_user_job(db, current.id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JobOut.model_validate(job)


@router.get("/{job_id}/status", response_model=JobStatusOut)
def get_status(job_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    job = job_service.get_user_job(db, current.id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JobStatusOut(
        id=job.id,
        status=job.status,
        progress=job.progress,
        error_message=job.error_message,
        retry_count=job.retry_count,
    )


@router.get("/{job_id}/download", response_model=DownloadOut)
def download(job_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    job = job_service.get_user_job(db, current.id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "DONE" or not job.output_storage_key:
        raise HTTPException(status_code=409, detail="Result is not ready.")
    keys = job_service.output_keys(job)
    storage = get_storage()
    urls = [storage.generate_signed_url(k) for k in keys]
    return DownloadOut(job_id=job.id, urls=urls, expires_in=settings.S3_SIGNED_URL_EXPIRE_SECONDS)


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    job = job_service.get_user_job(db, current.id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    job_service.delete_job(db, job)