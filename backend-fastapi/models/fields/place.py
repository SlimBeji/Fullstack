from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel

from models.fields.base import FieldMeta
from types_ import FileToUpload

#  Literals

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

###### 1st Level Fields #########

# id
id_meta = FieldMeta(description="The Place ID", examples=["683b21134e2e5d46978daf1f"])
id_annot = Annotated[PydanticObjectId, id_meta.info]

# title
title_meta = FieldMeta(
    min_length=10,
    description="The place title/name, 10 characters minimum",
    examples=["Stamford Bridge"],
    filter_examples=["eq:Some Place"],
)
title_annot = Annotated[str, title_meta.info]

# description
description_meta = FieldMeta(
    min_length=10,
    description="The place description, 10 characters minimum",
    examples=["Stadium of Chelsea football club"],
    filter_examples=["regex:football"],
)
description_annot = Annotated[str, description_meta.info]

# embedding
embedding_meta = FieldMeta(
    description="Title + Description embedding", min_length=384, max_length=384
)
embedding_annot = Annotated[list[float], embedding_meta.info]

# imageUrl
imageUrl_meta = FieldMeta(
    examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
    description="local url on the storage",
)
imageUrl_annot = Annotated[str, imageUrl_meta.info]

# image
image_meta = FieldMeta(is_file=True, description="Place Image (JPEG)")
image_annot = Annotated[FileToUpload, image_meta.info]

# address
address_meta = FieldMeta(
    min_length=1,
    description="The place address",
    examples=["Fulham road"],
    filter_examples=["regex:d{1,2} Boulevard"],
)
address_annot = Annotated[str, address_meta.info]

# creatorId
creatorId_meta = FieldMeta(
    description="The place creator ID",
    examples=["683b21134e2e5d46978daf1f"],
    filter_examples=["eq:683b21134e2e5d46978daf1f"],
)
creatorId_annot = Annotated[PydanticObjectId, creatorId_meta.info]

###### Location Fields #########

# lat
lat_meta = FieldMeta(
    description="The latitude of the place",
    examples=[51.48180425016331],
    filter_examples=["gt:3.5"],
)
lat_annot = Annotated[float, lat_meta.info]

# lng
lng_meta = FieldMeta(
    description="The longitude of the place",
    examples=[-0.19090418688755467],
    filter_examples=["lt:4.5"],
)
lng_annot = Annotated[float, lng_meta.info]


# Full Object
location_meta = FieldMeta(
    description="The place coordianets",
    examples=[dict(lat=51.48180425016331, lng=-0.19090418688755467)],
)


class Location(BaseModel):
    lat: lat_annot
    lng: lng_annot
