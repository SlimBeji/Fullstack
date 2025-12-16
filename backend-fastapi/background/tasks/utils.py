from background.tasks.broker import broker


def close_workers():
    broker.close()
