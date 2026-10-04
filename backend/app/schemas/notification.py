from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int | None
    type: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationListOut(BaseModel):
    total: int
    unread: int
    items: list[NotificationOut]