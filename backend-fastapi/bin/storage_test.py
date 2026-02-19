import asyncio

from services.instances import cloud_storage
from static import get_image_path


async def main():
    path = get_image_path("avatar1.jpg")
    destination = cloud_storage.upload_file(path)
    url = cloud_storage.get_signed_url(destination)
    print(url)


if __name__ == "__main__":
    asyncio.run(main())
