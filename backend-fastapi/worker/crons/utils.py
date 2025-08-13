from worker.crons.scheduler import scheduler


def close_crons() -> None:
    scheduler.shutdown()
