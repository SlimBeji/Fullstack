from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId
from fastapi import File
from pydantic import BaseModel, Field

from models.schemas.utils import QueryFilters, build_search_schema
from types_ import FileToUpload, PaginatedData

# --- Fields ----


class PlaceFields:
    id = Annotated[
        PydanticObjectId,
        Field(description="The Place ID", examples=["683b21134e2e5d46978daf1f"]),
    ]
    title = Annotated[
        str,
        Field(
            min_length=10,
            description="The place title/name, 10 characters minimum",
            examples=["Stamford Bridge"],
            json_schema_extra=dict(filter_example="eq:Some Place"),
        ),
    ]
    description = Annotated[
        str,
        Field(
            min_length=10,
            description="The place description, 10 characters minimum",
            examples=["Stadium of Chelsea football club"],
            json_schema_extra=dict(filter_example="regex:football"),
        ),
    ]
    embedding = Annotated[
        list[float],
        Field(
            description="Title + Description embedding", min_length=384, max_length=384
        ),
    ]
    image_url = Annotated[
        str,
        Field(
            examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
            description="local url on the storage",
        ),
    ]
    image = Annotated[
        FileToUpload,
        File(description="Place Image (JPEG)"),
    ]
    address = Annotated[
        str,
        Field(
            min_length=1,
            description="The place address",
            examples=["Fulham road"],
            json_schema_extra=dict(filter_example="regex:d{1,2} Boulevard"),
        ),
    ]
    creator_id = Annotated[
        PydanticObjectId,
        Field(
            description="The place creator ID",
            examples=["683b21134e2e5d46978daf1f"],
            json_schema_extra=dict(filter_example="eq:683b21134e2e5d46978daf1f"),
        ),
    ]
    location_lat = Annotated[
        float,
        Field(
            description="The latitude of the place",
            examples=[51.48180425016331],
            json_schema_extra=dict(filter_example="gt:3.5"),
        ),
    ]
    location_lng = Annotated[
        float,
        Field(
            description="The longitude of the place",
            examples=[-0.19090418688755467],
            json_schema_extra=dict(filter_example="lt:4.5"),
        ),
    ]


# --- Nested Objects ----


class PlaceLocation(BaseModel):
    lat: PlaceFields.location_lat
    lng: PlaceFields.location_lng


# --- Base Schemas ----


class PlaceBaseSchema(BaseModel):
    title: PlaceFields.title
    description: PlaceFields.description
    address: PlaceFields.address
    location: PlaceLocation | None = None


class PlaceSeedSchema(PlaceBaseSchema):
    ref: int
    creator_ref: int
    embedding: PlaceFields.embedding | None = None
    imageUrl: PlaceFields.image_url | None = None


# --- Creation Schemas ---


class PlaceCreateSchema(PlaceBaseSchema):
    embedding: PlaceFields.embedding | None = None
    imageUrl: PlaceFields.image_url | None = None
    creatorId: PlaceFields.creator_id


class PlacePostSchema(PlaceBaseSchema):
    image: PlaceFields.image | None = None
    creatorId: PlaceFields.creator_id


# --- Read Schemas ---


class PlaceReadSchema(PlaceBaseSchema):
    id: PlaceFields.id
    imageUrl: PlaceFields.image_url | None = None
    creatorId: PlaceFields.creator_id


PlacesPaginatedSchema = PaginatedData[PlaceReadSchema]

# --- Query Schemas ---

PlaceSortableFields = Literal["createdAt", "title", "description", "address"]


class PlaceFiltersSchema(BaseModel):
    id: QueryFilters[PlaceFields.id]
    title: QueryFilters[PlaceFields.title]
    description: QueryFilters[PlaceFields.description]
    address: QueryFilters[PlaceFields.address]
    creatorId: QueryFilters[PlaceFields.creator_id]
    locationLat: QueryFilters[PlaceFields.location_lat]
    locationLng: QueryFilters[PlaceFields.location_lat]


class PlaceSearchSchema(
    build_search_schema(  # type: ignore
        "PlaceSearchSchema",
        PlaceFiltersSchema,
        PlaceSortableFields,
        PlaceReadSchema,
    )
):
    pass


class PlaceSearchGetSchema(
    build_search_schema(  # type: ignore
        "PlaceSearchGetSchema", PlaceFiltersSchema, PlaceSortableFields
    )
):
    pass


# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: PlaceFields.title | None = None
    description: PlaceFields.description | None = None
    address: PlaceFields.address | None = None
    location: PlaceLocation | None = None
    creatorId: PlaceFields.creator_id | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass
