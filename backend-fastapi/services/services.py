from config import settings
from lib.clients import (
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
