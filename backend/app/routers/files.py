from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.job import JobOut
from app.services import job_service
from app.utils.files import classify_upload, sanitize_filename
from app.utils.security import get_current_user

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=JobOut, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    # Read with size cap (avoid loading arbitrary data)
    max_bytes = settings.max_upload_size_bytes
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="File exceeds the 10 MB limit.")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    safe_name = sanitize_filename(file.filename)
    processing_type = classify_upload(safe_name, file.content_type)
    if processing_type is None:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    job = job_service.create_job(
        db,
        user_id=current.id,
        filename=safe_name,
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        processing_type=processing_type,
        data=content,
    )
    return JobOut.model_validate(job)