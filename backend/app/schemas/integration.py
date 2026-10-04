from pydantic import BaseModel


class IntegrationOut(BaseModel):
    id: str
    name: str
    description: str
    configured: bool
    connected: bool
    connected_at: str | None = None


class IntegrationConnectOut(BaseModel):
    authorize_url: str