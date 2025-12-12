from config import settings
from lib.clients import (
    CloudStorage,
    CloudStorageConfig,
    HuggingFaceClient,
    HuggingFaceClientConfig,
    MongoClient,
    MongoClientConfig,
    RedisClient,
    RedisClientConfig,
)

mongo_config = MongoClientConfig(
    uri=settings.MONGO_URL,
    db_name=(
        settings.MONGO_TEST_DBNAME
        if settings.is_test
        else settings.MONGO_DBNAME
    ),
)
db = MongoClient(mongo_config)


redis_config = RedisClientConfig(
    uri=settings.REDIS_TEST_URL if settings.is_test else settings.REDIS_URL,
    expiration=settings.REDIS_DEFAULT_EXPIRATION,
)
redis_client = RedisClient(redis_config)


storage_config = CloudStorageConfig(
    project_id=settings.GCP_PROJECT_ID,
    bucket_name=settings.GCS_BUCKET_NAME,
    access_expiration=settings.GCS_BLOB_ACCESS_EXPIRATION,
    credentials_file=settings.GOOGLE_APPLICATION_CREDENTIALS,
    emulator_public_url=settings.GCS_EMULATOR_PUBLIC_URL,
    emulator_private_url=settings.GCS_EMULATOR_PRIVATE_URL,
)
cloud_storage = CloudStorage(storage_config)

hf_config = HuggingFaceClientConfig(
    token=settings.HF_API_TOKEN, timeout=settings.DEFAULT_TIMEOUT
)
hf_client = HuggingFaceClient(hf_config)
