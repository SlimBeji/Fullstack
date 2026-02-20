import asyncio

from background.bgconfig import (
    MAX_AGE,
    TASK_NEWSLETTER,
    TASK_PLACE_EMBEDDING,
    Queues,
)
from background.handlers.ai import place_embedding_task
from background.handlers.email import send_newsletter_task
from config import settings
from lib.clients import TaskConfig, TaskHandler
from services.instances import pg_client, redis_client

TASKS: list[TaskConfig] = [
    TaskConfig(TASK_NEWSLETTER, Queues.EMAILS, send_newsletter_task),
    TaskConfig(TASK_PLACE_EMBEDDING, Queues.AI, place_embedding_task),
]


async def connect_dbs() -> None:
    await asyncio.gather(pg_client.connect(), redis_client.connect())


handler = TaskHandler(
    settings.REDIS_URL, TASKS, connect_dbs, MAX_AGE, settings.is_test
)
handler.start()
