from worker.tasks.base import broker


def close_workers():
    broker.close()
