import asyncio
from typing import Any

from lib.clients import close_dbs, connect_dbs, storage
from lib.utils import get_image_path


def echo(output: Any):
    print("--------------------------")
    print(output)
    print("--------------------------")


async def debug():
    path = get_image_path("avatar1.jpg")
    destination = storage.upload_file(path)
    url = storage.get_signed_url(destination)
    print(url)


async def main():
    await connect_dbs()
    await debug()
    await close_dbs()


if __name__ == "__main__":
    asyncio.run(main())
