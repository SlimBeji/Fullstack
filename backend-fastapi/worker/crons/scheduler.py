from apscheduler.schedulers.blocking import BlockingScheduler

from worker.crons.base import ScheduledTask
from worker.crons.emails import email_crons


def register_crons(scheduler: BlockingScheduler, tasks: list[ScheduledTask]) -> None:
    for t in tasks:
        t.register(scheduler)


def create_scheduler() -> BlockingScheduler:
    scheduler = BlockingScheduler()
    register_crons(scheduler, email_crons)
    return scheduler


scheduler = create_scheduler()


if __name__ == "__main__":
    scheduler.start()
