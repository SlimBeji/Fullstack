from worker.tasks.broker import broker


def close_workers():
    broker.close()
