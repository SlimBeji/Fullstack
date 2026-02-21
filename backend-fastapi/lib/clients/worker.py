import asyncio
from typing import Callable

from dramatiq import Broker, Message, actor, set_broker
from dramatiq.asyncio import EventLoopThread, set_event_loop_thread
from dramatiq.brokers.redis import RedisBroker
from dramatiq.brokers.stub import StubBroker
from dramatiq.middleware import AsyncIO
from dramatiq.results import Results
from dramatiq.results.backend import ResultBackend
from dramatiq.results.backends.redis import RedisBackend
from dramatiq.results.backends.stub import StubBackend

# Publisher


class TaskPublisher:
    def __init__(self, url: str = "", is_test: bool = False) -> None:
        if not is_test and not url:
            raise RuntimeError(
                "A url must be provided when not running in test mode!"
            )

        self._url: str = url
        self._is_test: bool = is_test
        self._broker: Broker | None = None

    @property
    def broker(self) -> Broker:
        if self._broker is None:
            raise RuntimeError("TaskPublisher broker was not initialized!")
        return self._broker

    def start(self) -> None:
        if self._is_test:
            self._broker = StubBroker()
            self._broker.emit_after("process_boot")
        else:
            self._broker = RedisBroker(url=self._url)

        set_broker(self._broker)

    def send(self, message: Message) -> None:
        self.broker.enqueue(message)

    def close(self):
        self.broker.close()
        self._broker = None


# Handler


def async_middleware(connect_dbs: Callable) -> AsyncIO:
    # Overloading AsyncIO middleware
    class MyAsyncIO(AsyncIO):
        def before_worker_boot(self, broker, worker):
            """Oveloading AsyncIo before_worker_boot"""
            event_loop_thread = EventLoopThread(self.logger)
            event_loop_thread.start(timeout=1.0)
            asyncio.run_coroutine_threadsafe(
                connect_dbs(), event_loop_thread.loop
            ).result()
            set_event_loop_thread(event_loop_thread)

    return MyAsyncIO()


class TaskConfig:
    def __init__(self, name: str, queue: str, handler: Callable) -> None:
        self.name: str = name
        self.queue: str = queue
        self.handler: Callable = handler


class TaskHandler:
    def __init__(
        self,
        broker_url: str,
        tasks: list[TaskConfig],
        connector: Callable,
        max_age: int,
        is_test: bool = False,
    ) -> None:
        if not is_test and not broker_url:
            raise RuntimeError(
                "A url must be provided when not running in test mode!"
            )

        self._is_test: bool = is_test
        self._broker_url: str = broker_url
        self._broker: Broker | None = None
        self._backend: ResultBackend | None = None
        self._max_age: int = max_age
        self._tasks: list[TaskConfig] = tasks
        self._async_middleware: AsyncIO = async_middleware(connector)

    @property
    def broker(self) -> Broker:
        if self._broker is None:
            raise RuntimeError("TaskHandler broker was not initialized!")
        return self._broker

    def _register_tasks(self):
        for task in self._tasks:
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
            self._broker = RedisBroker(url=self._broker_url)
            self._backend = RedisBackend(url=self._broker_url)

        self._broker.add_middleware(
            Results(backend=self._backend, result_ttl=self._max_age)
        )
        self._broker.add_middleware(self._async_middleware)
        set_broker(self._broker)
        self._register_tasks()

    def close(self):
        self.broker.close()
        self._broker = None
