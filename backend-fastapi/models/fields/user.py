from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId
from pydantic import EmailStr

from models.fields.base import FieldMeta
from types_ import FileToUpload

#  Literals

type UserSelectableFields = Literal[
    "id", "name", "email", "isAdmin", "imageUrl", "places"
]

type UserSearchableFields = Literal["id", "name", "email"]

type UserSortableFields = Literal[
    "createdAt", "-createdAt", "name", "-name", "email", "-email"
]

# ----- 1st Level Fields -------

# id
id_meta = FieldMeta(
    description="The User ID",
    examples=["683b21134e2e5d46978daf1f"],
)
id_annot = Annotated[PydanticObjectId, id_meta.info]

# name
name_meta = FieldMeta(
    min_length=2,
    description="The user name, two characters at least",
    examples=["Slim Beji"],
    filter_examples=["eq:Slim Beji"],
)
name_annot = Annotated[str, name_meta.info]

# email
email_meta = FieldMeta(
    description="The user email",
    examples=["mslimbeji@gmail.com"],
    filter_examples=["eq:mslimbeji@gmail.com"],
)
email_annot = Annotated[EmailStr, email_meta.info]

# password
password_meta = FieldMeta(
    min_length=8,
    description="The user password, 8 characters at least",
    examples=["very_secret"],
)
password_annot = Annotated[str, password_meta.info]

# imageUrl
imageUrl_meta = FieldMeta(
    examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
    description="local url on the storage",
)
imageUrl_annot = Annotated[str, imageUrl_meta.info]

# image
image_meta = FieldMeta(is_file=True, description="The user profile image")
image_annot = Annotated[FileToUpload, image_meta.info]

# isAdmin
isAdmin_meta = FieldMeta(
    description="Whether the user is an admin or not",
    examples=[False],
)
isAdmin_annot = Annotated[bool, isAdmin_meta.info]

places_meta = FieldMeta(
    description="The id of places belonging to the user, 24 characters"
)
places_annot = Annotated[
    list[
        Annotated[
            PydanticObjectId,
            FieldMeta(
                description="The Place ID",
                examples=["683b21134e2e5d46978daf1f"],
            ).info,
        ]
    ],
    places_meta.info,
]
