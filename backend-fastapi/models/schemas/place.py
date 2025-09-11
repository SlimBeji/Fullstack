import json

from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel

from models.fields import (
    HttpFilters,
    PlaceAnnotations,
    PlaceFields,
    PlaceSelectableFields,
    PlaceSortableFields,
)
from models.schemas.utils import BaseFiltersSchema
from types_ import FileToUpload, PaginatedData

# --- Nested Objects ----


class PlaceLocation(BaseModel):
    lat: PlaceAnnotations.location_lat
    lng: PlaceAnnotations.location_lng


# --- Base Schemas ----


class PlaceBaseSchema(BaseModel):
    title: PlaceAnnotations.title
    description: PlaceAnnotations.description
    address: PlaceAnnotations.address
    location: PlaceLocation | None = None


class PlaceSeedSchema(PlaceBaseSchema):
    ref: int
    creator_ref: int
    embedding: PlaceAnnotations.embedding | None = None
    imageUrl: PlaceAnnotations.imageUrl | None = None


# --- Creation Schemas ---


class PlaceCreateSchema(PlaceBaseSchema):
    embedding: PlaceAnnotations.embedding | None = None
    imageUrl: PlaceAnnotations.imageUrl | None = None
    creatorId: PlaceAnnotations.creatorId


class PlacePostSchema(PlaceBaseSchema):
    image: PlaceAnnotations.image | None = None
    creatorId: PlaceAnnotations.creatorId


# --- Multipart Post ----


class PlaceMultipartPost:
    def __init__(
        self,
        title: str = PlaceFields.title.multipart,
        description: str = PlaceFields.description.multipart,
        address: str = PlaceFields.address.multipart,
        location: PlaceLocation | str | None = PlaceFields.location.multipart,
        creatorId: PydanticObjectId = PlaceFields.creatorId.multipart,
        image: FileToUpload | None = PlaceFields.image.multipart,
    ):
        if isinstance(location, str):
            location = PlaceLocation(**json.loads(location))

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
    id: PlaceAnnotations.id
    imageUrl: PlaceAnnotations.imageUrl | None = None
    creatorId: PlaceAnnotations.creatorId


PlacesPaginatedSchema = PaginatedData[PlaceReadSchema]

# --- Query Schemas ---


class PlaceFiltersSchema(BaseFiltersSchema[PlaceSelectableFields, PlaceSortableFields]):
    id: HttpFilters[PlaceAnnotations.id]
    title: HttpFilters[PlaceAnnotations.title]
    description: HttpFilters[PlaceAnnotations.description]
    address: HttpFilters[PlaceAnnotations.address]
    creatorId: HttpFilters[PlaceAnnotations.creatorId]
    locationLat: HttpFilters[PlaceAnnotations.location_lat]
    locationLng: HttpFilters[PlaceAnnotations.location_lng]


# --- Update Schemas ---


class PlaceUpdateSchema(BaseModel):
    title: PlaceAnnotations.title | None = None
    description: PlaceAnnotations.description | None = None
    address: PlaceAnnotations.address | None = None
    location: PlaceLocation | None = None
    creatorId: PlaceAnnotations.creatorId | None = None


class PlacePutSchema(PlaceUpdateSchema):
    pass
