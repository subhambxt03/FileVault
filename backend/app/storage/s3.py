import boto3
from botocore.client import Config

from app.config import settings
from app.storage.base import StorageBackend


class S3Storage(StorageBackend):
    def __init__(self) -> None:
        self.bucket_name = settings.S3_BUCKET
        self.expires = settings.S3_SIGNED_URL_EXPIRE_SECONDS

        if not settings.S3_ENDPOINT_URL:
            raise RuntimeError("S3_ENDPOINT_URL is not configured.")

        if not settings.S3_ACCESS_KEY_ID:
            raise RuntimeError("S3_ACCESS_KEY_ID is not configured.")

        if not settings.S3_SECRET_ACCESS_KEY:
            raise RuntimeError("S3_SECRET_ACCESS_KEY is not configured.")

        self.client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )

    def upload_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str,
    ) -> None:
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def download_bytes(self, key: str) -> bytes:
        response = self.client.get_object(
            Bucket=self.bucket_name,
            Key=key,
        )
        return response["Body"].read()

    def delete(self, key: str) -> None:
        self.client.delete_object(
            Bucket=self.bucket_name,
            Key=key,
        )

    def generate_signed_url(self, key: str) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key,
            },
            ExpiresIn=self.expires,
        )