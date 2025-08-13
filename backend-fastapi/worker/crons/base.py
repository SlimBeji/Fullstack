from typing import Any, Callable

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger


class ScheduledTask:
    def __init__(
        self,
        fn: Callable,
        crontab: str,
        args: tuple[Any] | None = None,
        kwargs: dict[str, Any] | None = None,
    ) -> None:
        self.fn = fn
        self.crontab = crontab
        self.trigger = CronTrigger.from_crontab(crontab)
        self.args = args
        self.kwargs = kwargs

    def register(self, scheduler: BlockingScheduler) -> None:
        scheduler.add_job(self.fn, self.trigger, args=self.args, kwargs=self.kwargs)
