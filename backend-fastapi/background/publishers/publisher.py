from background.bgconfig import BROKER_URL
from config import settings
from lib.clients import TaskPublisher

publisher = TaskPublisher(BROKER_URL, settings.is_test)
