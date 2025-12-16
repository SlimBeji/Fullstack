import time

from background.setup import TASK_NEWSLETTER, NewsletterData, Queues
from background.tasks.broker import dramatiq_task


@dramatiq_task(TASK_NEWSLETTER, Queues.EMAILS)
def send_newsletter_task(data: NewsletterData):
    time.sleep(2)
    print(f"Newsletter sent to {data["name"]} at {data["email"]}")
