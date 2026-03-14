from typing import Annotated, Literal

from pydantic import BaseModel

from config import settings
from lib.pydantic_ import BaseSearchSchema, FieldMeta, HttpFilters
from lib.types_ import FileToUpload, PaginatedData, PaginatedDict, SearchQuery

from .common import created_at_annot

# --- Fields ----

id_meta = FieldMeta(
    description="The Place ID", examples=[123456789], is_index=True
)
id_annot = Annotated[int, id_meta.info]

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
    filter_examples=["like:football"],
)
description_annot = Annotated[str, description_meta.info]

embedding_meta = FieldMeta(
    description="Title + Description embedding", min_length=384, max_length=384
)
embedding_annot = Annotated[list[float], embedding_meta.info]

image_url_meta = FieldMeta(
    examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
    description="image url on the storage",
)
image_url_annot = Annotated[str, image_url_meta.info]

image_meta = FieldMeta(is_file=True, description="Place Image (JPEG)")
image_annot = Annotated[FileToUpload, image_meta.info]

address_meta = FieldMeta(
    min_length=1,
    description="The place address",
    examples=["Fulham road"],
    filter_examples=["ilike:boulevard"],
)
address_annot = Annotated[str, address_meta.info]

creator_id_meta = FieldMeta(
    description="The place creator ID",
    examples=[123456789],
    filter_examples=["in:123456789"],
    is_index=True,
)
creator_id_annot = Annotated[int, creator_id_meta.info]

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


class Location(BaseModel):
    lat: lat_annot
    lng: lng_annot


location_meta = FieldMeta(
    description="The place coordianets",
    examples=[dict(lat=51.48180425016331, lng=-0.19090418688755467)],
)
location_annot = Annotated[Location, location_meta.info]


# --- Selectables, Serchables, Sortables ----

PlaceSelectableFields = Literal[
    "id",
    "title",
    "description",
    "address",
    "location",
    "image_url",
    "creator_id",
    "created_at",
]

PlaceSearchableFields = Literal[
    "id",
    "title",
    "description",
    "address",
    "creator_id",
    "location_lat",
    "location_lng",
    "created_at",
]

PlaceSortableFields = Literal[
    "created_at",
    "-created_at",
    "title",
    "-title",
    "description",
    "-description",
    "address",
    "-address",
]


# --- Base Schemas ----


class PlaceSeedSchema(BaseModel):
    ref: int
    creator_ref: int
    title: title_annot
    description: description_annot
    address: address_annot
    location: Location | None = None
    embedding: embedding_annot | None = None
    image_url: image_url_annot | None = None


# --- Creation Schemas ---


class PlaceCreateSchema(BaseModel):
    title: title_annot
    description: description_annot
    address: address_annot
    location: Location | None = None
    embedding: embedding_annot | None = None
    image_url: image_url_annot | None = None
    creator_id: creator_id_annot


class PlacePostSchema(BaseModel):
    title: title_annot
    description: description_annot
    address: address_annot
    lat: lat_annot
    lng: lng_annot
    image: image_annot | None = None
    creator_id: creator_id_annot


class PlaceMultipartPost:
    def __init__(
        self,
        title: str = title_meta.multipart,
        description: str = description_meta.multipart,
        address: str = address_meta.multipart,
        lat: float = lat_meta.multipart,
        lng: float = lng_meta.multipart,
        creator_id: int = creator_id_meta.multipart,
        image: FileToUpload | None = image_meta.optional_multipart,
    ):
        self.title = title
        self.description = description
        self.address = address
        self.lat = lat
        self.lng = lng
        self.creator_id = creator_id
        self.image = image or None

    def to_post_schema(self) -> PlacePostSchema:
        return PlacePostSchema(
            title=self.title,
            description=self.description,
            address=self.address,
            lat=self.lat,
            lng=self.lng,
            creator_id=self.creator_id,
            image=self.image,
        )


# --- Read Schemas ---


class PlaceReadSchema(BaseModel):
    id: id_annot
    title: title_annot
    description: description_annot
    address: address_annot
    location: Location | None = None
    image_url: image_url_annot | None = None
    creator_id: creator_id_annot
    created_at: created_at_annot


# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: title_annot | None = None
    description: description_annot | None = None
    address: address_annot | None = None
    location: Location | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass


# --- Query Schemas ---

PlacesPaginatedSchema = PaginatedData[PlaceReadSchema] | PaginatedDict


class PlaceSearchSchema(
    BaseSearchSchema[
        PlaceSelectableFields, PlaceSortableFields, PlaceSearchableFields
    ]
):
    _MAX_SIZE = settings.MAX_ITEMS_PER_PAGE
    _DEFAULT_FIELDS = ["id", "location"]  # type: ignore

    id: HttpFilters[id_annot]
    title: HttpFilters[title_annot]
    description: HttpFilters[description_annot]
    address: HttpFilters[address_annot]
    creator_id: HttpFilters[creator_id_annot]
    location_lat: HttpFilters[lat_annot]
    location_lng: HttpFilters[lng_annot]
    created_at: HttpFilters[created_at_annot]


PlaceSearchQuery = SearchQuery[
    PlaceSelectableFields, PlaceSortableFields, PlaceSearchableFields
]
