from dramatiq import Message

from background.publishers.publisher import publisher
from background.setup import TASK_NEWSLETTER, NewsletterData, Queues
from config import settings


def send_newsletter(name: str, email: str) -> None:
    if settings.is_test:
        return

    payload = NewsletterData(name=name, email=email)
    message = Message[None](
        Queues.EMAILS.name,
        actor_name=TASK_NEWSLETTER,
        args=(payload,),
        kwargs={},
        options={},
    )
    publisher.send(message)
