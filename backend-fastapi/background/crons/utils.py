from typing import Any, Callable

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
