import asyncio
from typing import Callable

from dramatiq import Actor, Broker, actor, set_broker
from dramatiq.asyncio import EventLoopThread, set_event_loop_thread
from dramatiq.brokers.redis import RedisBroker
from dramatiq.brokers.stub import StubBroker
from dramatiq.middleware import AsyncIO
from dramatiq.results import Results
from dramatiq.results.backend import ResultBackend
from dramatiq.results.backends.redis import RedisBackend
from dramatiq.results.backends.stub import StubBackend

from background.setup import (
    MAX_AGE,
    REDIS_URL,
    TASK_NEWSLETTER,
    TASK_PLACE_EMBEDDING,
    Queues,
)
from services.instances import db, redis_client

from .ai import place_embedding_task
from .email import send_newsletter_task


async def connect_dbs() -> None:
    await asyncio.gather(db.connect(), redis_client.connect())


# Overloading AsyncIO middleware
class AsyncIOWithBeanie(AsyncIO):
    def before_worker_boot(self, broker, worker):
        """Oveloading AsyncIo before_worker_boot"""
        event_loop_thread = EventLoopThread(self.logger)
        event_loop_thread.start(timeout=1.0)
        asyncio.run_coroutine_threadsafe(
            connect_dbs(), event_loop_thread.loop
        ).result()
        set_event_loop_thread(event_loop_thread)


class TaskHandler:
    def __init__(self) -> None:
        self._broker: Broker | None = None
        self._backend: ResultBackend | None = None

    @property
    def broker(self) -> Broker:
        if self._broker is None:
            raise RuntimeError("TaskHandler broker was not initialized!")
        return self._broker

    def start(self, url: str = "", is_test: bool = False) -> None:
        if not is_test and not url:
            raise RuntimeError(
                "A url must be provided when not running in test mode!"
            )

        if is_test:
            self._broker = StubBroker()
            self._backend = StubBackend()
            self._broker.emit_after("process_boot")
        else:
            self._broker = RedisBroker(url=url)
            self._backend = RedisBackend(url=url)

        self._broker.add_middleware(
            Results(backend=self._backend, result_ttl=MAX_AGE)
        )
        self._broker.add_middleware(AsyncIOWithBeanie())
        set_broker(self._broker)

    def register_task(
        self, name: str, queue_name: str = "default"
    ) -> Callable[[Callable], Actor]:
        def decorator(fn) -> Actor:
            return actor(
                fn,
                actor_name=str(name),
                queue_name=str(queue_name),
                store_results=True,
            )

        return decorator

    def close(self):
        self.broker.close()
        self._broker = None


handler = TaskHandler()
handler.start(REDIS_URL)
handler.register_task(TASK_NEWSLETTER, Queues.EMAILS)(send_newsletter_task)
handler.register_task(TASK_PLACE_EMBEDDING, Queues.AI)(place_embedding_task)
