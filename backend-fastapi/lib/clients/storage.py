import os
import uuid
from datetime import UTC, datetime, timedelta
from typing import cast
from urllib.parse import quote

from google.api_core.exceptions import Conflict, NotFound
from google.auth.credentials import AnonymousCredentials
from google.cloud.storage import Client
from google.oauth2 import service_account
from starlette.datastructures import UploadFile

from ..types_ import FileToUpload


class CloudStorageConfig:
    def __init__(
        self,
        project_id: str,
        bucket_name: str,
        access_expiration: int = 3600,
        credentials_file: str = "",
        emulator_public_url: str = "",
        emulator_private_url: str = "",
    ) -> None:
        self.project_id = project_id
        self.bucket_name = bucket_name
        self.access_expiration = access_expiration
        self.credentials_file = credentials_file
        self.emulator_public_url = emulator_public_url
        self.emulator_private_url = emulator_private_url


class CloudStorage:
    def __init__(self, config: CloudStorageConfig) -> None:
        # Parameters
        self.project_id: str = config.project_id
        self.bucket_name: str = config.bucket_name
        self.blob_access_expiration: int = config.access_expiration
        self.credentials_file: str = config.credentials_file
        self.emulator_public_url: str = config.emulator_public_url
        self.emulator_private_url: str = config.emulator_private_url

        # Storage client
        self.storage = Client(
            project=self.project_id,
            credentials=self.credentials,
            client_options=self.client_options,
        )

        # Initilaize the emulator
        if self.is_emulator:
            self._init_emulator()

        # Select the bucket
        self.bucket = self.storage.bucket(self.bucket_name)

    @property
    def is_emulator(self) -> bool:
        return bool(self.emulator_private_url and self.emulator_public_url)

    @property
    def credentials(
        self,
    ) -> service_account.Credentials | AnonymousCredentials | None:
        if self.is_emulator:
            return AnonymousCredentials()

        if self.credentials_file and os.path.exists(self.credentials_file):
            return service_account.Credentials.from_service_account_file(
                self.credentials_file
            )
        return None

    @property
    def client_options(self) -> dict | None:
        if self.is_emulator:
            return dict(api_endpoint=self.emulator_private_url)
        return None

    def _init_emulator(self) -> None:
        try:
            self.storage.create_bucket(self.bucket_name)
            print(f"Created bucket {self.bucket_name} in emulator")
        except Conflict:
            # error status code 409 = bucket exists
            pass

    def _get_emulator_file_url(self, filename: str) -> str:
        api_url = f"{self.emulator_public_url}/download/storage/v1"
        bucket_url = f"{api_url}/b/{self.bucket_name}"
        download_url = f"{bucket_url}/o/{quote(filename)}?alt=media"
        return download_url

    def get_signed_url(
        self, filename: str, expiration: int | None = None
    ) -> str:
        if self.is_emulator:
            return self._get_emulator_file_url(filename)

        expiration = expiration or self.blob_access_expiration
        blob = self.bucket.blob(filename)

        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.now(UTC) + timedelta(seconds=expiration),
            method="GET",
        )
        return url

    def upload_file(
        self,
        param: FileToUpload | UploadFile | str | None,
        destination: str = "",
    ) -> str:
        if not param:
            return ""

        if isinstance(param, str):
            file = FileToUpload.from_path(param)
        elif isinstance(param, UploadFile):
            file = FileToUpload.from_upload_file(param)
        else:
            file = param

        ext = os.path.splitext(file.name)[1]
        base_filename = os.path.splitext(destination or file.name)[0]
        filename = f"{base_filename}_{uuid.uuid4().hex}{ext}".lower()

        blob = self.bucket.blob(filename)
        blob.upload_from_string(file.buffer, content_type=file.mimetype)
        return cast(str, blob.name)

    def delete_file(self, filename: str) -> bool:
        try:
            blob = self.bucket.blob(filename)
            blob.delete()
            return True
        except NotFound:
            # 404 error when the filename does not exist
            return False
