import json
import logging
from http import HTTPStatus
from typing import TypedDict, get_args

from pydantic import BaseModel
from sqlalchemy import Float, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from background.publishers import place_embedding
from lib.sqlalchemy_ import CrudsClass
from lib.types_ import ApiError, WhereFilters
from models.orm import Place
from models.schemas import (
    PlaceCreateSchema,
    PlacePostSchema,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceSearchableFields,
    PlaceSearchQuery,
    PlaceSelectableFields,
    PlaceSortableFields,
    PlaceUpdateSchema,
    UserReadSchema,
)
from services.instances import cloud_storage, hf_client

from .utils import user_exists


class PlaceOptions(TypedDict):
    process: bool | None
    fields: list[PlaceSelectableFields] | None


class PlaceCreateContext(BaseModel):
    pass


class PlaceUpdateContext(BaseModel):
    trigger_embedding: bool


class PlaceDeleteContext(BaseModel):
    image_url: str


class CrudsPlace(
    CrudsClass[
        Place,
        UserReadSchema,
        PlaceCreateSchema,
        PlaceCreateContext,
        PlacePostSchema,
        PlaceReadSchema,
        PlaceOptions,
        PlaceSelectableFields,
        PlaceSortableFields,
        PlaceSearchableFields,
        PlaceUpdateSchema,
        PlaceUpdateContext,
        PlacePutSchema,
        PlaceDeleteContext,
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

    # Serialization and Post-Processing

    async def post_process(self, raw: PlaceReadSchema) -> PlaceReadSchema:
        if raw.imageUrl:
            raw.imageUrl = cloud_storage.get_signed_url(raw.imageUrl)
        return raw

    async def post_process_dict(self, raw: dict) -> dict:
        image_url = raw.get("imageUrl")
        if image_url:
            raw["imageUrl"] = cloud_storage.get_signed_url(image_url)
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

    async def after_create(
        self, id: int, data: PlaceCreateSchema, context: PlaceCreateContext
    ) -> None:
        place_embedding(id)

    async def seed(
        self, data: PlaceCreateSchema, embedding: list[float]
    ) -> int:
        id = await self.create(data)
        await self.update_embedding(id, embedding)
        return id

    async def post_to_create(self, data: PlacePostSchema) -> PlaceCreateSchema:
        json = data.model_dump(exclude_none=True, exclude_unset=True)
        lat = json.pop("lat", None)
        lng = json.pop("lng", None)
        json["location"] = dict(lat=lat, lng=lng)

        image = json.pop("image", None)
        if image:
            json["imageUrl"] = cloud_storage.upload_file(image)
        else:
            json["imageUrl"] = ""

        return self.create_schema.model_validate(json)

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
            return

        if user.id != form.creatorId:
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                "Access denied",
                dict(message=f"Cannot add places to user {form.creatorId}"),
            )

    # Read

    def auth_get(
        self,
        user: UserReadSchema,
        query: PlaceSearchQuery,
    ) -> PlaceSearchQuery:
        if user.isAdmin:
            return query

        if query.where is None:
            query.where = {}

        query.where["creatorId"] = self.eq(user.id)
        return query

    # Update

    async def before_update(
        self, id: int, data: PlaceUpdateSchema
    ) -> PlaceUpdateContext:
        stmt = select(self.model.title, self.model.description).where(
            self.model.id == id
        )
        result = await self.session.execute(stmt)
        record = result.one_or_none()
        if record is None:
            raise self.not_found_error(id)

        title_changed = bool(data.title and data.title != record.title)
        description_changed = bool(
            data.description and data.description != record.description
        )
        return PlaceUpdateContext(
            trigger_embedding=description_changed or title_changed
        )

    async def after_update(
        self, id: int, data: PlaceUpdateSchema, context: PlaceUpdateContext
    ) -> None:
        if context.trigger_embedding:
            place_embedding(id)

    async def auth_put(
        self, user: UserReadSchema, id: int | str, form: PlacePutSchema
    ) -> None:
        if user.isAdmin:
            return

        id = self.parse_id(id)
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

    async def before_delete(self, id: int) -> PlaceDeleteContext:
        stmt = select(self.model.id, self.model.image_url).where(
            self.model.id == id
        )
        result = await self.session.execute(stmt)
        record = result.one_or_none()
        if record is None:
            raise self.not_found_error(id)

        return PlaceDeleteContext(image_url=record.image_url)

    async def after_delete(self, id: int, context: PlaceDeleteContext) -> None:
        if context.image_url:
            cloud_storage.delete_file(context.image_url)

    async def auth_delete(self, user: UserReadSchema, id: int | str) -> None:
        if user.isAdmin:
            return

        id = self.parse_id(id)
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
