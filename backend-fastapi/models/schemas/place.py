from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel

from config import settings
from lib.pydantic_ import BaseFiltersSchema, FieldMeta, HttpFilters
from lib.types_ import FileToUpload, FindQuery, PaginatedData

# --- Fields ----

type PlaceSelectableFields = Literal[
    "id",
    "title",
    "description",
    "address",
    "location.lat",
    "location.lng",
    "imageUrl",
    "creatorId",
]

type PlaceSearchableFields = Literal[
    "id",
    "title",
    "description",
    "address",
    "creatorId",
    "locationLat",
    "locationLng",
]

type PlaceSortableFields = Literal[
    "createdAt",
    "-createdAt",
    "title",
    "-title",
    "description",
    "-description",
    "address",
    "-address",
]

id_meta = FieldMeta(
    description="The Place ID", examples=["683b21134e2e5d46978daf1f"]
)
id_annot = Annotated[PydanticObjectId, id_meta.info]

title_meta = FieldMeta(
    min_length=10,
    description="The place title/name, 10 characters minimum",
    examples=["Stamford Bridge"],
    filter_examples=["eq:Some Place"],
)
title_annot = Annotated[str, title_meta.info]

description_meta = FieldMeta(
    min_length=10,
    description="The place description, 10 characters minimum",
    examples=["Stadium of Chelsea football club"],
    filter_examples=["regex:football"],
)
description_annot = Annotated[str, description_meta.info]

embedding_meta = FieldMeta(
    description="Title + Description embedding", min_length=384, max_length=384
)
embedding_annot = Annotated[list[float], embedding_meta.info]

imageUrl_meta = FieldMeta(
    examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
    description="local url on the storage",
)
imageUrl_annot = Annotated[str, imageUrl_meta.info]

image_meta = FieldMeta(is_file=True, description="Place Image (JPEG)")
image_annot = Annotated[FileToUpload, image_meta.info]

address_meta = FieldMeta(
    min_length=1,
    description="The place address",
    examples=["Fulham road"],
    filter_examples=["regex:d{1,2} Boulevard"],
)
address_annot = Annotated[str, address_meta.info]

creatorId_meta = FieldMeta(
    description="The place creator ID",
    examples=["683b21134e2e5d46978daf1f"],
    filter_examples=["eq:683b21134e2e5d46978daf1f"],
)
creatorId_annot = Annotated[PydanticObjectId, creatorId_meta.info]

lat_meta = FieldMeta(
    description="The latitude of the place",
    examples=[51.48180425016331],
    filter_examples=["gt:3.5"],
)
lat_annot = Annotated[float, lat_meta.info]

lng_meta = FieldMeta(
    description="The longitude of the place",
    examples=[-0.19090418688755467],
    filter_examples=["lt:4.5"],
)
lng_annot = Annotated[float, lng_meta.info]


location_meta = FieldMeta(
    description="The place coordianets",
    examples=[dict(lat=51.48180425016331, lng=-0.19090418688755467)],
)


class Location(BaseModel):
    lat: lat_annot
    lng: lng_annot


# --- Base Schemas ----


class PlaceSeedSchema(BaseModel):
    ref: int
    creator_ref: int
    title: title_annot
    description: description_annot
    address: address_annot
    location: Location | None = None
    embedding: embedding_annot | None = None
    imageUrl: imageUrl_annot | None = None


# --- Creation Schemas ---


class PlaceCreateSchema(BaseModel):
    title: title_annot
    description: description_annot
    address: address_annot
    location: Location | None = None
    embedding: embedding_annot | None = None
    imageUrl: imageUrl_annot | None = None
    creatorId: creatorId_annot


class PlacePostSchema(BaseModel):
    title: title_annot
    description: description_annot
    address: address_annot
    lat: lat_annot
    lng: lng_annot
    image: image_annot | None = None
    creatorId: creatorId_annot


class PlaceMultipartPost:
    def __init__(
        self,
        title: str = title_meta.multipart,
        description: str = description_meta.multipart,
        address: str = address_meta.multipart,
        lat: float = lat_meta.multipart,
        lng: float = lng_meta.multipart,
        creatorId: PydanticObjectId = creatorId_meta.multipart,
        image: FileToUpload | None = image_meta.multipart,
    ):
        self.title = title
        self.description = description
        self.address = address
        self.lat = lat
        self.lng = lng
        self.creatorId = creatorId
        self.image = image or None

    def to_post_schema(self) -> PlacePostSchema:
        return PlacePostSchema(
            title=self.title,
            description=self.description,
            address=self.address,
            lat=self.lat,
            lng=self.lng,
            creatorId=self.creatorId,
            image=self.image,
        )


# --- Read Schemas ---


class PlaceReadSchema(BaseModel):
    id: id_annot
    title: title_annot
    description: description_annot
    address: address_annot
    location: Location | None = None
    imageUrl: imageUrl_annot | None = None
    creatorId: creatorId_annot


PlacesPaginatedSchema = PaginatedData[PlaceReadSchema]

# --- Query Schemas ---


class PlaceFiltersSchema(
    BaseFiltersSchema[PlaceSelectableFields, PlaceSortableFields]
):
    _MAX_SIZE = settings.MAX_ITEMS_PER_PAGE

    id: HttpFilters[id_annot]
    title: HttpFilters[title_annot]
    description: HttpFilters[description_annot]
    address: HttpFilters[address_annot]
    creatorId: HttpFilters[creatorId_annot]
    locationLat: HttpFilters[lat_annot]
    locationLng: HttpFilters[lng_annot]


PlaceFindQuery = FindQuery[
    PlaceSelectableFields, PlaceSortableFields, PlaceSearchableFields
]

# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: title_annot | None = None
    description: description_annot | None = None
    address: address_annot | None = None
    location: Location | None = None
    creatorId: creatorId_annot | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass
