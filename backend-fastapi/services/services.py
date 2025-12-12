from config import settings
from lib.clients import RedisClient, RedisClientConfig

redis_config = RedisClientConfig(
    uri=settings.REDIS_TEST_URL if settings.is_test else settings.REDIS_URL,
    expiration=settings.REDIS_DEFAULT_EXPIRATION,
)

redis_client = RedisClient(redis_config)
