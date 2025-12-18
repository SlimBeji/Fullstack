from config import settings
from lib.clients import TaskPublisher

publisher = TaskPublisher(settings.REDIS_URL, settings.is_test)
