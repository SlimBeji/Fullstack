from dramatiq import Broker, actor, set_broker
from dramatiq.brokers.redis import RedisBroker
from dramatiq.brokers.stub import StubBroker
from dramatiq.results import Results
from dramatiq.results.backend import ResultBackend
from dramatiq.results.backends.redis import RedisBackend
from dramatiq.results.backends.stub import StubBackend

from background.handlers.registery import TASKS, TaskConfig
from background.handlers.utils import AsyncIOWithBeanie
from background.setup import MAX_AGE
from config import settings


class TaskHandler:
    def __init__(self, url: str = "", is_test: bool = False) -> None:
        if not is_test and not url:
            raise RuntimeError(
                "A url must be provided when not running in test mode!"
            )

        self._url: str = url
        self._is_test: bool = is_test
        self._broker: Broker | None = None
        self._backend: ResultBackend | None = None

    @property
    def broker(self) -> Broker:
        if self._broker is None:
            raise RuntimeError("TaskHandler broker was not initialized!")
        return self._broker

    def _register_tasks(self, tasks: list[TaskConfig]):
        for task in tasks:
            actor(
                task.handler,
                actor_name=str(task.name),
                queue_name=str(task.queue),
                store_results=True,
            )

    def start(self) -> None:
        if self._is_test:
            self._broker = StubBroker()
            self._backend = StubBackend()
            self._broker.emit_after("process_boot")
        else:
            self._broker = RedisBroker(url=self._url)
            self._backend = RedisBackend(url=self._url)

        self._broker.add_middleware(
            Results(backend=self._backend, result_ttl=MAX_AGE)
        )
        self._broker.add_middleware(AsyncIOWithBeanie())
        set_broker(self._broker)
        self._register_tasks(TASKS)

    def close(self):
        self.broker.close()
        self._broker = None


handler = TaskHandler(settings.REDIS_URL, settings.is_test)
handler.start()
