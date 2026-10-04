from abc import ABC, abstractmethod


class StorageBackend(ABC):
    @abstractmethod
    def upload_bytes(self, key: str, data: bytes, content_type: str) -> None: ...

    @abstractmethod
    def download_bytes(self, key: str) -> bytes: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

    @abstractmethod
    def generate_signed_url(self, key: str) -> str: ...