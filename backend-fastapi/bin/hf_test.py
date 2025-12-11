import asyncio
from typing import Any

from lib.clients import hf_client
from lib.setup import close_all, start_all


def echo(output: Any):
    print("--------------------------")
    print(output)
    print("--------------------------")


async def debug():
    vec = await hf_client.embed_text("I am trying to debug my code in go")
    echo(vec)


async def main():
    await start_all()
    await debug()
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
