from background.publishers import send_newsletter
from lib.clients import ScheduledTask

newsletter_cron = ScheduledTask(
    send_newsletter, "0 * * * *", args=("Slim Beji", "mslimbjei@gmail.com")
)
