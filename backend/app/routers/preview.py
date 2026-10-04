import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services import job_service
from app.storage import get_storage
from app.utils.security import get_current_user

router = APIRouter(prefix="/jobs", tags=["preview"])


def _fetch_key_or_404(job, storage, key: str) -> bytes:
    try:
        return storage.download_bytes(key)
    except Exception:
        raise HTTPException(status_code=404, detail="Output not found.")


@router.get("/{job_id}/preview")
def preview(job_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> dict[str, Any]:
    """
    Returns a structured preview of the processed output for a job.
    Shape depends on job.processing_type:

    - image: { type: "image", variants: [{ label, url, width, height }] }
    - pdf:   { type: "pdf", text: "..." }
    - text:  { type: "text", words: [{ word, count }, ...] }
    """
    job = job_service.get_user_job(db, current.id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "DONE":
        raise HTTPException(status_code=409, detail="Job is not finished yet.")

    storage = get_storage()
    keys = job_service.output_keys(job)

    if job.processing_type == "image":
        # output_storage_key is JSON: {"small": "...", "medium": "...", "large": "..."}
        mapping = json.loads(job.output_storage_key)
        variants = []
        for label in ("small", "medium", "large"):
            key = mapping.get(label)
            if not key:
                continue
            variants.append({
                "label": label,
                "url": f"/jobs/{job.id}/preview/{label}",
                "width":  {"small": 320, "medium": 800, "large": 1280}[label],
            })
        return {"type": "image", "variants": variants}

    if job.processing_type == "pdf":
        key = keys[0]
        raw = _fetch_key_or_404(job, storage, key)
        text = raw.decode("utf-8", errors="replace")
        return {"type": "pdf", "text": text[:4000]}

    if job.processing_type == "text":
        key = keys[0]
        raw = _fetch_key_or_404(job, storage, key)
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            data = {}
        words = [{"word": w, "count": c} for w, c in list(data.items())[:30]]
        return {"type": "text", "words": words}

    raise HTTPException(status_code=400, detail="Unknown processing type.")


@router.get("/{job_id}/preview/{variant}")
def preview_image_variant(
    job_id: int,
    variant: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Serves the bytes of one image variant (small/medium/large) inline."""
    job = job_service.get_user_job(db, current.id, job_id)
    if not job or job.processing_type != "image" or job.status != "DONE":
        raise HTTPException(status_code=404, detail="Preview not available.")

    mapping = json.loads(job.output_storage_key)
    key = mapping.get(variant)
    if not key:
        raise HTTPException(status_code=404, detail="Variant not found.")

    try:
        data = get_storage().download_bytes(key)
    except Exception:
        raise HTTPException(status_code=404, detail="Output not found.")

    return Response(
        content=data,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=300"},
    )