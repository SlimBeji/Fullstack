import asyncio
from typing import Any

from lib.clients import cloud_storage
from lib.setup import close_all, start_all
from lib.utils import get_image_path


def echo(output: Any):
    print("--------------------------")
    print(output)
    print("--------------------------")


async def debug():
    path = get_image_path("avatar1.jpg")
    destination = cloud_storage.upload_file(path)
    url = cloud_storage.get_signed_url(destination)
    print(url)


async def main():
    await start_all()
    await debug()
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
