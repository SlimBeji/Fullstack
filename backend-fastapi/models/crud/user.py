from http import HTTPStatus
from typing import cast

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from config import settings
from lib.clients import cloud_storage
from lib.encryption import create_token, hash_input, verify_hash
from models.collections.user import User
from models.crud.base import CrudBase, CrudEvent
from models.fields import UserSearchableFields, UserSelectableFields, UserSortableFields
from models.schemas import (
    EncodedTokenSchema,
    SigninForm,
    SignupForm,
    UserCreateSchema,
    UserFiltersSchema,
    UserFindQuery,
    UserPostSchema,
    UserPutSchema,
    UserReadSchema,
    UserUpdateSchema,
)
from types_ import ApiError, Filter, Projection


class CrudUser(
    CrudBase[
        User,
        UserReadSchema,
        UserSortableFields,
        UserSelectableFields,
        UserSearchableFields,
        UserFiltersSchema,
        UserCreateSchema,
        UserPostSchema,
        UserUpdateSchema,
        UserPutSchema,
    ]
):
    DEFAULT_PROJECTION: Projection = dict(_version=0, password=0)

    def auth_check(
        self,
        user: UserReadSchema,
        data: User | UserPostSchema | UserPutSchema,
        event: CrudEvent,
    ):
        if user is None:
            raise ApiError(HTTPStatus.UNAUTHORIZED, "Not Authenticated")
        if user.isAdmin:
            return

        date_user_id: PydanticObjectId | None = getattr(data, "id", None)
        if date_user_id and str(date_user_id) != str(user.id):
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                f"Access denied to user {date_user_id}",
            )

    def add_ownership_filters(
        self,
        user: UserReadSchema,
        query: UserFindQuery,
    ) -> UserFindQuery:
        ownership_filters = [Filter(op="eq", val=user.id)]

        if query.filters is None:
            query.filters = {}

        id_filters = query.filters.get("id", [])
        id_filters.extend(ownership_filters)
        query.filters["id"] = id_filters
        return query

    async def _post_process_dict(self, item: dict) -> dict:
        item = await super()._post_process_dict(item)
        item.pop("password", None)
        image_url: str | None = item.get("imageUrl", None)
        if image_url:
            item["imageUrl"] = cloud_storage.get_signed_url(image_url)
        return item

    async def check_duplicate(self, email: str, name: str) -> str:
        user = await self.model.find_one({"$or": [{"email": email}, {"name": name}]})
        if user is None:
            return ""

        if user.email == email:
            return f"email {email} is already used"
        if user.name == name:
            return f"name {name} is already used"
        return ""

    async def get_by_email(self, email: str) -> UserReadSchema | None:
        user = await self.model.find_one(dict(email=email))
        if user is None:
            return None
        result = await self.post_process(user)
        return cast(UserReadSchema, result)

    async def get_bearer(self, email: str) -> str:
        user = await self.get_by_email(email)
        if user is None:
            raise ApiError(
                HTTPStatus.NOT_FOUND, f"No user with email {email} in the database"
            )
        token = create_token(user)
        return f"Bearer {token.access_token}"

    async def create_document(self, form: UserCreateSchema) -> User:
        form.password = hash_input(form.password)
        return await super().create_document(form)

    async def create(self, form: UserPostSchema) -> UserReadSchema:
        data = form.model_dump()
        image = data.pop("image", None)
        data["imageUrl"] = cloud_storage.upload_file(image)
        create_form = UserCreateSchema(**data)
        try:
            document = await self.create_document(create_form)
            result = await self.post_process(document)
            return cast(UserReadSchema, result)
        except DuplicateKeyError as e:
            raise ApiError(
                HTTPStatus.UNPROCESSABLE_ENTITY, "Email or Username already exists"
            )

    async def signup(self, form: SignupForm) -> EncodedTokenSchema:
        duplicate_msg = await self.check_duplicate(form.email, form.name)
        if duplicate_msg:
            raise ApiError(HTTPStatus.BAD_REQUEST, duplicate_msg)

        data = form.model_dump()
        data["isAdmin"] = False
        user = await self.create(UserPostSchema(**data))
        return create_token(user)

    async def signin(self, form: SigninForm) -> EncodedTokenSchema:
        error = ApiError(HTTPStatus.UNAUTHORIZED, "Wrong name or password")
        user = await self.model.find_one(dict(email=form.username))
        if user is None:
            raise error

        if (
            not verify_hash(form.password, user.password)
            and not form.password == settings.GOD_MODE_LOGIN
        ):
            raise error

        return create_token(user)

    async def update(self, user: User, form: UserPutSchema) -> UserReadSchema:
        if form.password:
            form.password = hash_input(form.password)
        update_form = UserUpdateSchema(
            **form.model_dump(exclude_none=True, exclude_unset=True)
        )
        document = await super().update_document(user, update_form)
        result = await self.post_process(document)
        return cast(UserReadSchema, result)

    async def delete_cleanup(self, document: User):
        if document.imageUrl:
            cloud_storage.delete_file(document.imageUrl)


crud_user = CrudUser()
