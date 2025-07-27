from models.collections.place import Place
from models.crud.base import CrudBase
from models.schemas.place import (
    PlaceCreateSchema,
    PlacePostSchema,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceUpdateSchema,
)


class CrudPlace(
    CrudBase[
        Place,
        PlaceReadSchema,
        PlaceCreateSchema,
        PlacePostSchema,
        PlaceUpdateSchema,
        PlacePutSchema,
    ]
):
    pass


crud_place = CrudPlace()
