import os
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

FILEDIR = os.path.dirname(__file__)


class Settings(BaseSettings):
    if os.environ.get("ENV") != "production":
        _CONFIG = SettingsConfigDict(env_file=os.path.join(FILEDIR, "fastapi.env"))

    # APP
    PORT: int = 5001
    API_URL: str = "http://localhost:5001/api"
    APP_URL: str
    SECRET_KEY: str
    FILEUPLOAD_MAX_SIZE: int = 100
    JSON_MAX_SIZE: int
    MAX_ITEMS_PER_PAGE: int = 100
    GOD_MODE_LOGIN: str
    JWT_EXPIRATION: int = 3600
    DEFAULT_TIMEOUT: int = 20
    ENV: Literal["dev", "test", "production"]

    # DATABASE
    MONGO_URL: str
    MONGO_DBNAME: str
    MONGO_TEST_DBNAME: str = "tests"
    REDIS_URL: str
    REDIS_TEST_URL: str = ""
    REDIS_DEFAULT_EXPIRATION: int = 3600

    # HUGGING FACE
    HF_API_TOKEN: str

    # GCP
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GCP_PROJECT_ID: str
    GCS_BUCKET_NAME: str
    GCS_EMULATOR_PRIVATE_URL: str = ""
    GCS_EMULATOR_PUBLIC_URL: str = ""
    GCS_BLOB_ACCESS_EXPIRATION: int = 3600

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    @property
    def is_test(self) -> bool:
        return self.ENV == "test"


settings = Settings()  # type: ignore[call-arg]
