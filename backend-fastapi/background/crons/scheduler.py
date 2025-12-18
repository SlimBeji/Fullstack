from background.crons.emails import newsletter_cron
from background.publishers import publisher
from lib.clients import ScheduledTask, TaskScheduler

CRONS: list[ScheduledTask] = [newsletter_cron]
scheduler = TaskScheduler(CRONS)


if __name__ == "__main__":
    publisher.start()
    scheduler.start()
