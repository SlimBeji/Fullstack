from models.collections.user import User
from models.crud.base import CrudBase
from models.schemas.user import (
    UserCreateSchema,
    UserPostSchema,
    UserPutSchema,
    UserReadSchema,
    UserUpdateSchema,
)


class CrudUser(
    CrudBase[
        User,
        UserReadSchema,
        UserCreateSchema,
        UserPostSchema,
        UserUpdateSchema,
        UserPutSchema,
    ]
):
    pass


crud_user = CrudUser()
