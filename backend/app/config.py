from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:5173"
    OAUTH_REDIRECT_BASE: str = "http://localhost:8000/integrations"

    DATABASE_URL: str = "mysql+pymysql://3Hqho17Khbk7k3s.root:Ed3UZRlAvxg9rYIn@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test"
    DB_SSL_CA: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_BUCKET: str = "fileflow"
    S3_FORCE_PATH_STYLE: bool = True
    S3_SIGNED_URL_EXPIRE_SECONDS: int = 3600

    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_AVATAR_SIZE_MB: int = 2

    # OAuth providers (empty = not configured)
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
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

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