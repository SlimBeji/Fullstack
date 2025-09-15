import json

from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel

from models.fields import (
    HttpFilters,
    PlaceSearchableFields,
    PlaceSelectableFields,
    PlaceSortableFields,
)
from models.fields import place as PlaceFields
from models.schemas.base import BaseFiltersSchema
from types_ import FileToUpload, FindQuery, PaginatedData

# --- Base Schemas ----


class PlaceBaseSchema(BaseModel):
    title: PlaceFields.title_annot
    description: PlaceFields.description_annot
    address: PlaceFields.address_annot
    location: PlaceFields.Location | None = None


class PlaceSeedSchema(PlaceBaseSchema):
    ref: int
    creator_ref: int
    embedding: PlaceFields.embedding_annot | None = None
    imageUrl: PlaceFields.imageUrl_annot | None = None


# --- Creation Schemas ---


class PlaceCreateSchema(PlaceBaseSchema):
    embedding: PlaceFields.embedding_annot | None = None
    imageUrl: PlaceFields.imageUrl_annot | None = None
    creatorId: PlaceFields.creatorId_annot


class PlacePostSchema(PlaceBaseSchema):
    image: PlaceFields.image_annot | None = None
    creatorId: PlaceFields.creatorId_annot


# --- Multipart Post ----


class PlaceMultipartPost:
    def __init__(
        self,
        title: str = PlaceFields.title_meta.multipart,
        description: str = PlaceFields.description_meta.multipart,
        address: str = PlaceFields.address_meta.multipart,
        location: (
            PlaceFields.Location | str | None
        ) = PlaceFields.location_meta.multipart,
        creatorId: PydanticObjectId = PlaceFields.creatorId_meta.multipart,
        image: FileToUpload | None = PlaceFields.image_meta.multipart,
    ):
        if isinstance(location, str):
            location = PlaceFields.Location(**json.loads(location))

        self.title = title
        self.description = description
        self.address = address
        self.location = location or None
        self.creatorId = creatorId
        self.image = image or None

    def to_post_schema(self) -> PlacePostSchema:
        return PlacePostSchema(
            title=self.title,
            description=self.description,
            address=self.address,
            location=self.location,
            creatorId=self.creatorId,
            image=self.image,
        )


# --- Read Schemas ---


class PlaceReadSchema(PlaceBaseSchema):
    id: PlaceFields.id_annot
    imageUrl: PlaceFields.imageUrl_annot | None = None
    creatorId: PlaceFields.creatorId_annot


PlacesPaginatedSchema = PaginatedData[PlaceReadSchema]

# --- Query Schemas ---


class PlaceFiltersSchema(BaseFiltersSchema[PlaceSelectableFields, PlaceSortableFields]):
    id: HttpFilters[PlaceFields.id_annot]
    title: HttpFilters[PlaceFields.title_annot]
    description: HttpFilters[PlaceFields.description_annot]
    address: HttpFilters[PlaceFields.address_annot]
    creatorId: HttpFilters[PlaceFields.creatorId_annot]
    locationLat: HttpFilters[PlaceFields.lat_annot]
    locationLng: HttpFilters[PlaceFields.lng_annot]


PlaceFindQuery = FindQuery[
    PlaceSelectableFields, PlaceSortableFields, PlaceSearchableFields
]

# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: PlaceFields.title_annot | None = None
    description: PlaceFields.description_annot | None = None
    address: PlaceFields.address_annot | None = None
    location: PlaceFields.Location | None = None
    creatorId: PlaceFields.creatorId_annot | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass
