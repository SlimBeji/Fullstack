from typing import Callable

from background.handlers.ai import place_embedding_task
from background.handlers.email import send_newsletter_task
from background.setup import TASK_NEWSLETTER, TASK_PLACE_EMBEDDING, Queues


class TaskConfig:
    def __init__(self, name: str, queue: Queues, handler: Callable) -> None:
        self.name: str = name
        self.queue: Queues = queue
        self.handler: Callable = handler


TASKS: list[TaskConfig] = [
    TaskConfig(TASK_NEWSLETTER, Queues.EMAILS, send_newsletter_task),
    TaskConfig(TASK_PLACE_EMBEDDING, Queues.AI, place_embedding_task),
]
