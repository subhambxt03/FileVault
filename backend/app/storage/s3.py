# backend/app/storage/s3.py
import boto3
from botocore.client import Config
from upstash_blob import Bucket

from app.config import settings
from app.storage.base import StorageBackend


class S3Storage(StorageBackend):
    def __init__(self) -> None:
        self.bucket_name = settings.S3_BUCKET
        self.expires = settings.S3_SIGNED_URL_EXPIRE_SECONDS

        # 1. Initialize the Upstash SDK client for signing URLs.
        #    This uses your UPSTASH_BLOB_TOKEN.
        self.blob_sdk = Bucket(settings.UPSTASH_BLOB_TOKEN)

        # 2. Initialize boto3 for server-side operations (upload, download, delete).
        #    We get the S3 credentials from the Upstash SDK's s3() method.
        s3_config = self.blob_sdk.s3()
        self.client = boto3.client(
            "s3",
            endpoint_url=s3_config["endpoint"],
            region_name=s3_config["region"],
            aws_access_key_id=s3_config["credentials"]["accessKeyId"],
            aws_secret_access_key=s3_config["credentials"]["secretAccessKey"],
            config=Config(signature_version="s3v4"),
        )

    def upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        # Server-side upload using boto3 works normally.
        self.client.put_object(Bucket=self.bucket_name, Key=key, Body=data, ContentType=content_type)

    def download_bytes(self, key: str) -> bytes:
        obj = self.client.get_object(Bucket=self.bucket_name, Key=key)
        return obj["Body"].read()

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket_name, Key=key)

    def generate_signed_url(self, key: str) -> str:
        # CRITICAL CHANGE:
        # Do NOT use self.client.generate_presigned_url.
        # Use the Upstash SDK's signedReadUrl method.
        # It signs a URL for exactly ONE object, with a max lifetime of 10 minutes [citation:3][citation:5].
        # The 'expiresIn' option caps at "10m" [citation:3].
        # Convert the integer 'expires' to a duration string, capping at 10 minutes.
        expire_minutes = min(self.expires // 60, 10)
        result = self.blob_sdk.signedReadUrl(key, expiresIn=f"{expire_minutes}m")
        return result["url"]