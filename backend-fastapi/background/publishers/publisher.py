from dramatiq import Broker, Message, set_broker
from dramatiq.brokers.redis import RedisBroker
from dramatiq.brokers.stub import StubBroker


class TaskPublisher:
    def __init__(self) -> None:
        self._broker: Broker | None = None

    @property
    def broker(self) -> Broker:
        if self._broker is None:
            raise RuntimeError("TaskPublisher broker was not initialized!")
        return self._broker

    def start(self, url: str = "", is_test: bool = False) -> None:
        if not is_test and not url == "":
            raise RuntimeError(
                "A url must be provided when not running in test mode!"
            )

        if is_test:
            self._broker = StubBroker()
            self._broker.emit_after("process_boot")
        else:
            self._broker = RedisBroker(url=url)

        set_broker(self._broker)

    def send(self, message: Message) -> None:
        self.broker.enqueue(message)

    def close(self):
        self.broker.close()
        self._broker = None


publisher = TaskPublisher()
