import asyncio

from services.instances import hf_client


async def main():
    vec = await hf_client.embed_text("I am trying to debug my code in python")
    print(vec)


if __name__ == "__main__":
    asyncio.run(main())
