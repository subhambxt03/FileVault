from typing import Dict, List

from pydantic import BaseModel


class StatisticsOut(BaseModel):
    total_files: int
    processing: int
    completed: int
    failed: int
    queued: int
    success_rate: float
    avg_processing_time_seconds: float | None
    total_storage_bytes: int
    file_type_distribution: Dict[str, int]
    uploads_per_day: List[dict]
    processing_success_failure: Dict[str, int]