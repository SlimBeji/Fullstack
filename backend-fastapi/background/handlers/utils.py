import asyncio

from dramatiq.asyncio import EventLoopThread, set_event_loop_thread
from dramatiq.middleware import AsyncIO

from services.instances import db, redis_client


async def connect_dbs() -> None:
    await asyncio.gather(db.connect(), redis_client.connect())


# Overloading AsyncIO middleware
class AsyncIOWithBeanie(AsyncIO):
    def before_worker_boot(self, broker, worker):
        """Oveloading AsyncIo before_worker_boot"""
        event_loop_thread = EventLoopThread(self.logger)
        event_loop_thread.start(timeout=1.0)
        asyncio.run_coroutine_threadsafe(
            connect_dbs(), event_loop_thread.loop
        ).result()
        set_event_loop_thread(event_loop_thread)
