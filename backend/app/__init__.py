from functools import lru_cache

from app.storage.base import StorageBackend
from app.storage.s3 import S3Storage


@lru_cache
def get_storage() -> StorageBackend:
    return S3Storage()