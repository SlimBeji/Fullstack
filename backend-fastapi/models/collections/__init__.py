from beanie import Document

from models.collections.base import *
from models.collections.place import *
from models.collections.user import *

User.model_rebuild()  # noqa: F405
Place.model_rebuild()  # noqa: F405
document_models: list[type[Document]] = [User, Place]  # noqa: F405
