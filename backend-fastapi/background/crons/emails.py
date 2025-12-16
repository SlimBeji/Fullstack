from background.crons.utils import ScheduledTask
from background.publishers import send_newsletter

newsletter_cron = ScheduledTask(
    send_newsletter, "0 * * * *", args=("Slim Beji", "mslimbjei@gmail.com")
)
