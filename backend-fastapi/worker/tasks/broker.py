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

from config import settings
from lib.clients import connect_dbs

MAX_AGE = 7 * 24 * 60 * 60 * 1000


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


broker: Broker  # Create the broker
backend: ResultBackend  # Create the backend
if settings.is_test:
    broker = StubBroker()
    backend = StubBackend()
    broker.emit_after("process_boot")
else:
    broker = RedisBroker(url=settings.REDIS_URL)
    backend = RedisBackend(url=settings.REDIS_URL)

broker.add_middleware(
    Results(backend=backend, result_ttl=7 * 24 * 60 * 60 * 1000)
)
broker.add_middleware(AsyncIOWithBeanie())
set_broker(broker)


# Centralize method to create tasks
def dramatiq_task(
    name: str, queue_name: str = "default"
) -> Callable[[Callable], Actor]:
    def decorator(fn) -> Actor:
        return actor(fn, actor_name=str(name), queue_name=str(queue_name))

    return decorator
