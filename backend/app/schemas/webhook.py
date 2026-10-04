from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl


class WebhookCreate(BaseModel):
    url: HttpUrl


class WebhookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    is_active: bool
    created_at: datetime