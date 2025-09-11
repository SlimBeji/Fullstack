from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId

from models.fields.base import FieldMeta
from types_ import FileToUpload

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
    "id", "title", "description", "address", "creatorId", "locationLat", "locationLng"
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


class PlaceFields:
    id = FieldMeta(description="The Place ID", examples=["683b21134e2e5d46978daf1f"])
    title = FieldMeta(
        min_length=10,
        description="The place title/name, 10 characters minimum",
        examples=["Stamford Bridge"],
        filter_examples=["eq:Some Place"],
    )
    description = FieldMeta(
        min_length=10,
        description="The place description, 10 characters minimum",
        examples=["Stadium of Chelsea football club"],
        filter_examples=["regex:football"],
    )
    embedding = FieldMeta(
        description="Title + Description embedding", min_length=384, max_length=384
    )
    imageUrl = FieldMeta(
        examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
        description="local url on the storage",
    )
    image = FieldMeta(is_file=True, description="Place Image (JPEG)")
    address = FieldMeta(
        min_length=1,
        description="The place address",
        examples=["Fulham road"],
        filter_examples=["regex:d{1,2} Boulevard"],
    )
    creatorId = FieldMeta(
        description="The place creator ID",
        examples=["683b21134e2e5d46978daf1f"],
        filter_examples=["eq:683b21134e2e5d46978daf1f"],
    )
    location = FieldMeta(
        description="The place coordianets",
        examples=[dict(lat=51.48180425016331, lng=-0.19090418688755467)],
    )
    location_lat = FieldMeta(
        description="The latitude of the place",
        examples=[51.48180425016331],
        filter_examples=["gt:3.5"],
    )
    location_lng = FieldMeta(
        description="The longitude of the place",
        examples=[-0.19090418688755467],
        filter_examples=["lt:4.5"],
    )


class PlaceAnnotations:
    id = Annotated[PydanticObjectId, PlaceFields.id.info]
    title = Annotated[str, PlaceFields.title.info]
    description = Annotated[str, PlaceFields.description.info]
    embedding = Annotated[list[float], PlaceFields.embedding.info]
    imageUrl = Annotated[str, PlaceFields.imageUrl.info]
    image = Annotated[FileToUpload, PlaceFields.image.info]
    address = Annotated[str, PlaceFields.address.info]
    creatorId = Annotated[PydanticObjectId, PlaceFields.creatorId.info]
    location_lat = Annotated[float, PlaceFields.location_lat.info]
    location_lng = Annotated[float, PlaceFields.location_lng.info]
