import logging
from http import HTTPStatus
from typing import TypedDict, get_args

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import or_

from config import settings
from lib.fastapi_ import ApiError
from lib.sqlalchemy_ import CrudsClass, Join, SelectField
from lib.types_ import Filter
from lib.utils import hash_input, verify_hash
from models.orm import Place, User
from models.schemas import (
    EncodedTokenSchema,
    SigninForm,
    SignupForm,
    UserCreateSchema,
    UserPostSchema,
    UserPutSchema,
    UserReadSchema,
    UserSearchableFields,
    UserSearchQuery,
    UserSelectableFields,
    UserSortableFields,
    UserUpdateSchema,
    create_token,
)
from services.instances import cloud_storage


class UserOptions(TypedDict):
    process: bool | None
    fields: list[UserSelectableFields]


class CrudsUser(
    CrudsClass[
        User,
        UserReadSchema,
        UserCreateSchema,
        UserPostSchema,
        UserReadSchema,
        UserSelectableFields,
        UserSortableFields,
        UserSearchableFields,
        UserUpdateSchema,
        UserPutSchema,
        UserOptions,
    ]
):
    # Init

    def __init__(self, session: AsyncSession):
        super().__init__(
            session, User, list(get_args(UserSelectableFields)), ["-createdAt"]
        )

    # Post-Processing

    async def post_process(
        self, raw: UserReadSchema | dict
    ) -> UserReadSchema | dict:
        # Handling dict
        if isinstance(raw, dict):
            image_url = raw.get("image_url")
            if image_url:
                raw["image_url"] = cloud_storage.get_signed_url(image_url)
            return raw

        # raw is a UserRead
        if raw.imageUrl:
            raw.imageUrl = cloud_storage.get_signed_url(raw.imageUrl)
        return raw

    # Query Building

    def map_select(self, field: str) -> list[SelectField]:
        if field != "places":
            return super().map_select(field)

        place_joins = [Join(relation=User.places, level=1)]
        return [
            SelectField(select=User.id, joins=None),
            SelectField(select=Place.id, joins=place_joins),
            SelectField(select=Place.title, joins=place_joins),
            SelectField(select=Place.address, joins=place_joins),
        ]

    # Create

    async def create(self, form: UserCreateSchema) -> int:
        form.password = hash_input(form.password, settings.DEFAULT_HASH_SALT)
        return await super().create(form)

    async def post_to_create(self, data: UserPostSchema) -> UserCreateSchema:
        json = data.model_dump(exclude_unset=True, exclude_none=True)
        image = json.pop("image", None)
        if image:
            json["image_url"] = cloud_storage.upload_file(image)
        else:
            json["image_url"] = ""

        return self.create_schema.model_construct(**json)

    async def auth_post(
        self, user: UserReadSchema, form: UserPostSchema
    ) -> None:
        """Only admins can create users"""
        if user.isAdmin:
            return
        raise ApiError(
            HTTPStatus.UNAUTHORIZED,
            "Not Authenticated",
            dict(message="Only admins can delete users"),
        )

    # Read

    async def get(
        self, id: int | str, options: UserOptions | None = None
    ) -> UserReadSchema:
        result = await super().get(id, options)
        if options and options.get("process", False):
            return await self.post_process(result)  # type: ignore
        return result

    def auth_get(
        self,
        user: UserReadSchema,
        query: UserSearchQuery,
    ) -> UserSearchQuery:
        ownership_filters = [Filter(op="eq", val=user.id)]

        if query.where is None:
            query.where = {}

        id_filters = query.where.get("id", [])
        id_filters.extend(ownership_filters)
        query.where["id"] = id_filters
        return query

    async def check_duplicate(self, email: str, name: str) -> str:
        stmt = select(User.name, User.email).where(
            or_(User.name == name, User.email == email)
        )
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            return ""

        if record.email == email:
            return f"email {email} is already used"
        if record.name == name:
            return f"name {name} is already used"
        return ""

    async def get_by_email(self, email: str) -> UserReadSchema | None:
        query = UserSearchQuery(
            select=self.default_select,
            where=dict(email=self.eq(email)),  # type: ignore
        )
        stmt = self.build_select_query(query)
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            return None
        return record  # type : ignore

    # Update

    async def update(self, id: int | str, form: UserUpdateSchema) -> None:
        if form.password:
            form.password = hash_input(
                form.password, settings.DEFAULT_HASH_SALT
            )

        await super().update(id, form)

    async def auth_put(
        self, user: UserReadSchema, id: int | str, form: UserPutSchema
    ) -> None:
        if user.isAdmin:
            return

        if user.id != self.parse_id(id):
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                f"Access to user with id {id} not granted",
            )

    # Delete

    async def after_delete(self, record: User) -> None:
        try:
            if record.image_url:
                cloud_storage.delete_file(record.image_url)
        except Exception as e:
            # Logging error instead of canceling whole transaction
            logging.error(
                f"Could not delete User image file: {record.image_url}. The following error occured: {str(e)}"
            )

    async def auth_delete(self, user: UserReadSchema, id: int | str) -> None:
        if user.isAdmin:
            return

        raise ApiError(
            HTTPStatus.UNAUTHORIZED,
            "Not Authenticated",
            dict(message="Only admins can delete users"),
        )

    # Search

    # Auth methods

    async def get_bearer(self, email: str) -> str:
        user = await self.get_by_email(email)
        if user is None:
            raise ApiError(
                HTTPStatus.NOT_FOUND,
                f"No user with email {email} in the database",
            )
        token = create_token(user.id, user.email)
        return f"Bearer {token.access_token}"

    async def signup(self, form: SignupForm) -> EncodedTokenSchema:
        duplicate_msg = await self.check_duplicate(form.email, form.name)
        if duplicate_msg:
            raise ApiError(HTTPStatus.BAD_REQUEST, duplicate_msg)
        data = self.create_schema(isAdmin=False, **form.model_dump())
        id = await self.create(data)
        stmt = select(User.id, User.email).where(User.id == id)
        result = await self.session.execute(stmt)
        record = result.scalar_one()
        return create_token(record.id, record.email)

    async def signin(self, form: SigninForm) -> EncodedTokenSchema:
        error = ApiError(HTTPStatus.UNAUTHORIZED, "Wrong name or password")
        stmt = select(User.id, User.email, User.password).where(
            User.email == form.username
        )
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            raise error

        if (
            not verify_hash(form.password, record.password)
            and not form.password == settings.GOD_MODE_LOGIN
        ):
            raise error

        return create_token(record.id, record.email)
