import json
import logging
from http import HTTPStatus
from typing import TypedDict, get_args

from sqlalchemy import Float, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from background.publishers import place_embedding
from lib.fastapi_ import ApiError
from lib.sqlalchemy_ import CrudsClass
from lib.types_ import WhereFilters
from models.orm import Place
from models.schemas import (
    PlaceCreateSchema,
    PlacePostSchema,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceSearchableFields,
    PlaceSelectableFields,
    PlaceSortableFields,
    PlaceUpdateSchema,
    UserReadSchema,
)
from services.instances import cloud_storage, hf_client

from .utils import user_exists


class PlaceOptions(TypedDict):
    process: bool | None
    fields: list[PlaceSelectableFields]


class CrudsPlace(
    CrudsClass[
        Place,
        UserReadSchema,
        PlaceCreateSchema,
        PlacePostSchema,
        PlaceReadSchema,
        PlaceSelectableFields,
        PlaceSortableFields,
        PlaceSearchableFields,
        PlaceUpdateSchema,
        PlacePutSchema,
        PlaceOptions,
    ]
):
    # Init

    def __init__(self, session: AsyncSession):
        super().__init__(
            session,
            Place,
            list(get_args(PlaceSelectableFields)),
            ["-createdAt"],
        )

    # Post-Processing

    async def post_process(
        self, raw: PlaceReadSchema | dict
    ) -> PlaceReadSchema | dict:
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

    def map_where(self, field: str) -> InstrumentedAttribute:
        if field == "locationLat":
            return self.model.location["lat"].astext.cast(Float)  # type: ignore
        elif field == "locationLng":
            return self.model.location["lng"].astext.cast(Float)  # type: ignore
        else:
            return super().map_where(field)

    # Create

    async def after_create(self, id: int, data: PlaceCreateSchema) -> None:
        place_embedding(id)

    async def seed(
        self, data: PlaceCreateSchema, embedding: list[float]
    ) -> PlaceReadSchema:
        id = await self.create(data)
        await self.update_embedding(id, embedding)
        return await self.get(id)

    async def post_to_create(self, data: PlacePostSchema) -> PlaceCreateSchema:
        json = data.model_dump(exclude_none=True, exclude_unset=True)
        image = json.pop("image", None)
        if image:
            json["image_url"] = cloud_storage.upload_file(image)
        else:
            json["image_url"] = ""

        return self.create_schema.model_construct(**json)

    async def auth_post(
        self, user: UserReadSchema, form: PlacePostSchema
    ) -> None:
        if user.isAdmin:
            if not await user_exists(self.session, form.creatorId):
                raise ApiError(
                    HTTPStatus.NOT_FOUND,
                    "User not found",
                    dict(
                        message=f"Cannot set creatorId to {form.creatorId}, No user with id {form.creatorId} found in the database",
                    ),
                )

        if user.id != form.creatorId:
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                "Accessdenied",
                dict(message=f"Cannot add places to user {form.creatorId}"),
            )

    # Read

    # Update

    async def update(self, id: int | str, form: PlaceUpdateSchema) -> None:
        """
        Overloading the update method is cheaper than
        handling the check in the after_update.
        The goal is to avoid run unneccary embedding.
        A form might be submitted even if the data stays the same
        """

        record = await self.read(id)
        if not record:
            raise self.not_found_error(id)

        description_changed = (
            form.description and form.description != record.description
        )
        title_changed = form.title and form.title != record.title
        await super().update(id, form)

        if description_changed or title_changed:
            place_embedding(record.id)

    async def auth_put(
        self, user: UserReadSchema, id: int | str, form: PlacePutSchema
    ) -> None:
        if user.isAdmin:
            return

        where: WhereFilters[PlaceSearchableFields] = {
            "id": self.eq(id),
            "creatorId": self.eq(user.id),
        }
        exists = await self.exists(where)
        if not exists:
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                "Access denied",
                dict(message=f"Cannot access place {id}"),
            )

    async def update_embedding(self, id: int, embedding: list[float]) -> None:
        stmt = (
            update(self.model)
            .where(self.model.id == id)
            .values(embedding=text(f"'{json.dumps(embedding)}'::vector"))
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def embed(self, id: int) -> list[float]:
        stmt = select(self.model.title, self.model.description).where(
            self.model.id == id
        )
        result = await self.session.execute(stmt)
        row = result.one_or_none()

        if not row:
            raise ApiError(
                HTTPStatus.NOT_FOUND,
                f"No place with id {id} found in the database",
            )

        text = f"{row.title} - {row.description}"
        embedding = await hf_client.embed_text(text)

        try:
            await self.update_embedding(id, embedding)
        except Exception as err:
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                "embedding failed",
                dict(place_id=id, message=str(err)),
            )

        return embedding

    # Delete

    async def after_delete(self, record: Place) -> None:
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

        where: WhereFilters[PlaceSearchableFields] = {
            "id": self.eq(id),
            "creatorId": self.eq(user.id),
        }
        exists = await self.exists(where)
        if not exists:
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                "Access denied",
                dict(message=f"cannot access place {id}"),
            )

    # Search
