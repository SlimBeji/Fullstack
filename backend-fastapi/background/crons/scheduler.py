from apscheduler.schedulers.blocking import BlockingScheduler

from background.crons.registery import CRONS
from background.crons.utils import ScheduledTask
from background.publishers import publisher


class TaskScheduler:
    def __init__(self) -> None:
        self.scheduler = BlockingScheduler()
        self._register_crons(CRONS)

    def _register_crons(self, crons: list[ScheduledTask]) -> None:
        for cron in crons:
            self.scheduler.add_job(
                cron.fn, cron.trigger, cron.args, cron.kwargs
            )

    def start(self) -> None:
        self.scheduler.start()

    def close(self) -> None:
        self.scheduler.shutdown()


scheduler = TaskScheduler()


if __name__ == "__main__":
    publisher.start()
    scheduler.start()
