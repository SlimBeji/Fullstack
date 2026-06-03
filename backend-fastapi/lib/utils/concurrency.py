import asyncio
from collections.abc import Awaitable, Callable


async def process_batch_by_chunks[T, K](
    batch: list[T],
    transform: Callable[[T], Awaitable[K]],
    chunk_size: int,
) -> list[K]:
    results: list[K] = []
    for i in range(0, len(batch), chunk_size):
        chunk = batch[i : i + chunk_size]
        processed = await asyncio.gather(*(transform(item) for item in chunk))
        results.extend(processed)
    return results


async def process_batch_with_semaphore[T, K](
    batch: list[T],
    transform: Callable[[T], Awaitable[K]],
    max_workers: int,
) -> list[K]:
    semaphore = asyncio.Semaphore(max_workers)

    async def run(item: T) -> K:
        async with semaphore:
            return await transform(item)

    return await asyncio.gather(*(run(item) for item in batch))
