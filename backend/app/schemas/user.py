
from datetime import datetime
from typing import Any, Dict

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    username: str | None = None
    bio: str | None = None
    location: str | None = None
    theme: str = "dark"
    avatar_url: str | None = None
    integrations: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    @field_validator("integrations", mode="before")
    @classmethod
    def _coerce_integrations(cls, v: Any) -> Dict[str, Any]:
        # Users created before the migration have NULL here.
        if v is None:
            return {}
        if isinstance(v, str):
            # The DB stores it as JSON text; parse it if it arrives raw.
            import json
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, dict) else {}
            except Exception:
                return {}
        return v


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    username: str | None = Field(default=None, min_length=3, max_length=60)
    bio: str | None = Field(default=None, max_length=160)
    location: str | None = Field(default=None, max_length=120)
    theme: str | None = Field(default=None, pattern="^(light|dark|system)$")


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
