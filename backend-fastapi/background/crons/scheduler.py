from apscheduler.schedulers.blocking import BlockingScheduler

from background.crons.base import ScheduledTask
from background.crons.emails import email_crons
from background.publishers import publisher
from config import settings


def register_crons(
    scheduler: BlockingScheduler, tasks: list[ScheduledTask]
) -> None:
    for t in tasks:
        t.register(scheduler)


def create_scheduler() -> BlockingScheduler:
    scheduler = BlockingScheduler()
    register_crons(scheduler, email_crons)
    return scheduler


scheduler = create_scheduler()


if __name__ == "__main__":
    publisher.start(settings.REDIS_URL)
    scheduler.start()
