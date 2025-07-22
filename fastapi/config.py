import os

from pydantic_settings import BaseSettings

FILEDIR = os.path.dirname(__file__)


class Settings(BaseSettings):
    # APP
    PORT: int = 5001
    API_URL: str = "http://localhost:5001/api"
    SECRET_KEY: str
    FILEUPLOAD_MAX_SIZE: int = 100
    JSON_MAX_SIZE: str
    MAX_ITEMS_PER_PAGE: int = 100
    JWT_EXPIRATION: int = 3600
    ENV: str

    # DATABASE
    MONGO_URL: str
    MONGO_DBNAME: str
    REDIS_URL: str
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


settings = Settings()
