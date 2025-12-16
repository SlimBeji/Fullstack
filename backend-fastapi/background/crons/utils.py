from apscheduler.schedulers import SchedulerNotRunningError

from background.crons.scheduler import scheduler


def close_crons() -> None:
    try:
        scheduler.shutdown()
    except SchedulerNotRunningError:
        pass
