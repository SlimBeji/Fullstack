from background.crons.emails import newsletter_cron
from background.crons.utils import ScheduledTask

CRONS: list[ScheduledTask] = [newsletter_cron]
