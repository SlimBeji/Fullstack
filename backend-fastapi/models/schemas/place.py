from typing import Annotated

from beanie.odm.fields import PydanticObjectId
from fastapi import File, UploadFile
from pydantic import BaseModel, Field

from models.schemas.utils import LinkedObjectId
from types_ import PaginatedData

# --- Fields ----


class PlaceFields:
    id = Annotated[
        PydanticObjectId,
        Field(description="The Place ID", example="683b21134e2e5d46978daf1f"),
    ]
    title = Annotated[
        str,
        Field(
            min_length=10,
            description="The place title/name, 10 characters minimum",
            example="Stamford Bridge",
        ),
    ]
    description = Annotated[
        str,
        Field(
            min_length=10,
            description="The place description, 10 characters minimum",
            example="Stadium of Chelsea football club",
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
            example="avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
            description="local url on the storage",
        ),
    ]
    image = Annotated[
        UploadFile,
        File(description="Place Image (JPEG)"),
    ]
    address = Annotated[
        str,
        Field(
            min_length=1,
            description="The place address",
            example="Fulham road",
        ),
    ]
    creator_id = Annotated[
        LinkedObjectId,
        Field(description="The place creator ID", example="683b21134e2e5d46978daf1f"),
    ]

    # --- Nested Objects ----

    class Location(BaseModel):
        lat: Annotated[
            float,
            Field(description="The latitude of the place", example=51.48180425016331),
        ]
        lng: Annotated[
            float,
            Field(
                description="The longitude of the place", example=-0.19090418688755467
            ),
        ]


# --- Base Schemas ----


class PlaceBaseSchema(BaseModel):
    title: PlaceFields.title
    description: PlaceFields.description
    address: PlaceFields.address
    location: PlaceFields.Location | None = None


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
    embedding: PlaceFields.embedding | None = None
    image: PlaceFields.image | None = None
    creatorId: PlaceFields.creator_id


# --- Read Schemas ---


class PlaceReadSchema(PlaceBaseSchema):
    id: PlaceFields.id
    imageUrl: PlaceFields.image_url | None = None
    creatorId: PlaceFields.creator_id


PlacesPaginatedSchema = PaginatedData[PlaceReadSchema]

# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: PlaceFields.title | None = None
    description: PlaceFields.description | None = None
    address: PlaceFields.address | None = None
    location: PlaceFields.Location | None = None
    creatorId: PlaceFields.creator_id | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass
