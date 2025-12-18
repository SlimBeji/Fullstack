import asyncio

from background.handlers.ai import place_embedding_task
from background.handlers.email import send_newsletter_task
from background.setup import (
    MAX_AGE,
    TASK_NEWSLETTER,
    TASK_PLACE_EMBEDDING,
    Queues,
)
from config import settings
from lib.clients import TaskConfig, TaskHandler
from services.instances import db, redis_client

TASKS: list[TaskConfig] = [
    TaskConfig(TASK_NEWSLETTER, Queues.EMAILS, send_newsletter_task),
    TaskConfig(TASK_PLACE_EMBEDDING, Queues.AI, place_embedding_task),
]


async def connect_dbs() -> None:
    await asyncio.gather(db.connect(), redis_client.connect())


handler = TaskHandler(
    settings.REDIS_URL, TASKS, connect_dbs, MAX_AGE, settings.is_test
)
handler.start()
