import time

from background.bgconfig import NewsletterData


def send_newsletter_task(payload: NewsletterData):
    time.sleep(2)
    print(f"Newsletter sent to {payload["name"]} at {payload["email"]}")
