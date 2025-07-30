from lib.utils import get_image_path
from models.schemas import UserSeedSchema

USERS: list[UserSeedSchema] = [
    UserSeedSchema(
        ref=1,
        name="Slim Beji",
        email="mslimbeji@gmail.com",
        password="very_secret",
        imageUrl=get_image_path("avatar1.jpg"),
        isAdmin=True,
    ),
    UserSeedSchema(
        ref=2,
        name="Mohamed Slim Beji",
        email="beji.slim@yahoo.fr",
        password="very_secret",
        imageUrl=get_image_path("avatar2.jpg"),
        isAdmin=False,
    ),
]
