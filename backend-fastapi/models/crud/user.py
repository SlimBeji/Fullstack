from models.collections.user import User
from models.crud.base import CrudBase
from models.schemas.user import (
    UserCreateSchema,
    UserFiltersSchema,
    UserPostSchema,
    UserPutSchema,
    UserReadSchema,
    UserUpdateSchema,
)


class CrudUser(
    CrudBase[
        User,
        UserReadSchema,
        UserFiltersSchema,
        UserCreateSchema,
        UserPostSchema,
        UserUpdateSchema,
        UserPutSchema,
    ]
):
    pass


crud_user = CrudUser()
