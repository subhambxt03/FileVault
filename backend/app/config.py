from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    APP_ENV: str = "production"

    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: str = (
        "https://fileevaultt.netlify.app,http://localhost:5173"
    )

    FRONTEND_URL: str = "https://fileevaultt.netlify.app"

    OAUTH_REDIRECT_BASE: str = (
        "https://filevault-n9at.onrender.com/integrations"
    )

    DATABASE_URL: str = ""

    DB_SSL_CA: str = ""

    REDIS_URL: str = "redis://red-db17uk9srm7s73agc1m0:6379"
    CELERY_BROKER_URL: str = "redis://red-db17uk9srm7s73agc1m0:6379"
    CELERY_RESULT_BACKEND: str = "redis://red-db17uk9srm7s73agc1m0:6379/1"

    S3_ENDPOINT_URL: str = ""
    S3_REGION: str = "auto"
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET: str = "filevault"
    S3_SIGNED_URL_EXPIRE_SECONDS: int = 300
    
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_AVATAR_SIZE_MB: int = 2

    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""

    DROPBOX_CLIENT_ID: str = ""
    DROPBOX_CLIENT_SECRET: str = ""

    @property
    def cors_origins(self) -> List[str]:
        return [
            o.strip()
            for o in self.BACKEND_CORS_ORIGINS.split(",")
            if o.strip()
        ]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def max_avatar_size_bytes(self) -> int:
        return self.MAX_AVATAR_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()