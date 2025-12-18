from typing import Any, Callable

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger


class ScheduledTask:
    def __init__(
        self,
        fn: Callable,
        crontab: str,
        args: tuple | None = None,
        kwargs: dict[str, Any] | None = None,
    ) -> None:
        self.fn = fn
        self.crontab = crontab
        self.trigger = CronTrigger.from_crontab(crontab)
        self.args = args
        self.kwargs = kwargs


class TaskScheduler:
    def __init__(self, tasks: list[ScheduledTask]) -> None:
        self.scheduler = BlockingScheduler()
        self._register_crons(tasks)

    def _register_crons(self, crons: list[ScheduledTask]) -> None:
        for cron in crons:
            self.scheduler.add_job(
                cron.fn, cron.trigger, cron.args, cron.kwargs
            )

    def start(self) -> None:
        self.scheduler.start()

    def close(self) -> None:
        self.scheduler.shutdown()
