from typing import Annotated

from fastapi import File, UploadFile
from pydantic import BaseModel, Field

from models.schemas.utils import id_metadata

# --- Fields ----

place_id_field = Annotated[
    str,
    Field(**id_metadata()),
]

place_title_field = Annotated[
    str,
    Field(
        min_length=10,
        description="The place title/name, 10 characters minimum",
        example="Stamford Bridge",
    ),
]

place_description_field = Annotated[
    str,
    Field(
        min_length=10,
        description="The place description, 10 characters minimum",
        example="Stadium of Chelsea football club",
    ),
]

place_embedding_field = Annotated[
    list[float],
    Field(description="Title + Description embedding", min_length=384, max_length=384),
]

place_image_url_field = Annotated[
    str,
    Field(
        example="avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
        description="local url on the storage",
    ),
]

place_image_field = Annotated[
    UploadFile,
    File(description="Place Image (JPEG)"),
]

place_address_field = Annotated[
    str,
    Field(
        min_length=1,
        description="The place address",
        example="Fulham road",
    ),
]

location_lat_field = Annotated[
    float, Field(description="The latitude of the place", example=51.48180425016331)
]

location_lng_field = Annotated[
    float, Field(description="The longitude of the place", example=-0.19090418688755467)
]

place_creator_id_field = Annotated[
    str, Field(**id_metadata(description="The ID of the place creator, 24 characters"))
]

# --- Nested Objects ----


class PlaceLocation(BaseModel):
    lat: location_lat_field
    lng: location_lng_field


# --- DB Schemas ----


class PlaceBaseSchema(BaseModel):
    title: place_title_field
    description: place_description_field
    address: place_address_field
    location: PlaceLocation | None = None


class PlaceDBSchema(PlaceBaseSchema):
    id: place_id_field
    embedding: place_embedding_field | None = None
    imageUrl: place_image_url_field | None = None
    creatorId: place_creator_id_field


class PlaceSeedSchema(PlaceBaseSchema):
    _ref: int
    _creator_ref: int
    embedding: place_embedding_field | None = None
    imageUrl: place_image_url_field | None = None


# --- Creation Schemas ---


class PlaceCreateSchema(PlaceBaseSchema):
    embedding: place_embedding_field | None = None
    imageUrl: place_image_url_field | None = None


class PlacePostSchema(PlaceBaseSchema):
    embedding: place_embedding_field | None = None
    image: place_image_field | None = None


# --- Read Schemas ---


class PlaceReadSchema(PlaceDBSchema):
    id: place_id_field
    imageUrl: place_image_url_field | None = None
    creator_id: place_creator_id_field
    embedding: place_embedding_field


# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: place_title_field | None = None
    description: place_description_field | None = None
    address: place_address_field | None = None
    location: PlaceLocation | None = None
    creator_id: place_creator_id_field | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass
