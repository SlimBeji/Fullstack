from worker.crons.base import ScheduledTask
from worker.tasks import send_newsletter

newsletter_cron = ScheduledTask(
    send_newsletter, "0 * * * *", args=("Slim Beji", "mslimbjei@gmail.com")
)

email_crons: list[ScheduledTask] = [newsletter_cron]
