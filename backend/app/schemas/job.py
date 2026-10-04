from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    file_type: str
    file_size: int
    status: str
    progress: int
    processing_type: str
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None


class JobStatusOut(BaseModel):
    id: int
    status: str
    progress: int
    error_message: Optional[str] = None
    retry_count: int


class JobListOut(BaseModel):
    total: int
    items: List[JobOut]


class DownloadOut(BaseModel):
    job_id: int
    urls: List[str]
    expires_in: int