from http import HTTPStatus
from typing import cast

from beanie import PydanticObjectId

from lib.clients import cloud_storage
from models.collections.place import Place
from models.crud.base import CrudBase, CrudEvent
from models.fields import (
    PlaceSearchableFields,
    PlaceSelectableFields,
    PlaceSortableFields,
)
from models.schemas import (
    PlaceCreateSchema,
    PlaceFiltersSchema,
    PlaceFindQuery,
    PlacePostSchema,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceUpdateSchema,
    UserReadSchema,
)
from types_ import ApiError, Filter
from worker.tasks import place_embeddding


class CrudPlace(
    CrudBase[
        Place,
        PlaceReadSchema,
        PlaceSortableFields,
        PlaceSelectableFields,
        PlaceSearchableFields,
        PlaceFiltersSchema,
        PlaceCreateSchema,
        PlacePostSchema,
        PlaceUpdateSchema,
        PlacePutSchema,
    ]
):
    FILTER_FIELD_MAPPING: dict[str, str] = dict(
        locationLat="location.lat", locationLng="location.lng"
    )

    def auth_check(
        self,
        user: UserReadSchema,
        data: Place | PlacePostSchema | PlacePutSchema,
        event: CrudEvent,
    ) -> None:
        if user is None:
            raise ApiError(HTTPStatus.UNAUTHORIZED, "Not Authenticated")
        if user.isAdmin:
            return

        creatorId: PydanticObjectId | None = getattr(data, "creatorId", None)
        if creatorId and str(creatorId) != str(user.id):
            raise ApiError(
                HTTPStatus.UNAUTHORIZED,
                f"Access denied to creator {creatorId}",
            )

    def add_ownership_filters(
        self, user: UserReadSchema, query: PlaceFindQuery
    ) -> PlaceFindQuery:
        ownership_filters = [Filter(op="eq", val=user.id)]

        if query.filters is None:
            query.filters = {}

        creatorId_filters = query.filters.get("creatorId", [])
        creatorId_filters.extend(ownership_filters)
        query.filters["creatorId"] = creatorId_filters
        return query

    async def _post_process_dict(self, item: dict) -> dict:
        item = await super()._post_process_dict(item)
        item.pop("embedding", None)
        image_url: str | None = item.get("imageUrl", None)
        if image_url is not None:
            item["imageUrl"] = cloud_storage.get_signed_url(image_url)
        return item

    async def create(self, form: PlacePostSchema) -> PlaceReadSchema:
        data = form.model_dump()
        lat = data.pop("lat")
        lng = data.pop("lng")
        data["location"] = dict(lat=lat, lng=lng)
        image = data.pop("image", None)
        data["imageUrl"] = cloud_storage.upload_file(image)
        create_form = PlaceCreateSchema(**data)
        document = await self.create_document(create_form)
        place_embeddding(document.id)
        result = await self.post_process(document)
        return cast(PlaceReadSchema, result)

    async def update(self, document: Place, form: PlacePutSchema) -> PlaceReadSchema:
        j = form.model_dump(exclude_none=True, exclude_unset=True)
        update = self.update_schema(**j)
        document = await self.update_document(document, update)

        # Trigger new embedding if title or description changed
        description_changed = (
            form.description and form.description != document.description
        )
        title_changed = form.title and form.title != document.title
        if description_changed or title_changed:
            place_embeddding(document.id)

        result = await self.post_process(document)
        return cast(PlaceReadSchema, result)

    async def delete_cleanup(self, document: Place):
        if document.imageUrl:
            cloud_storage.delete_file(document.imageUrl)


crud_place = CrudPlace()
