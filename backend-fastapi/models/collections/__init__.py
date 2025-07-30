from typing import Type

from beanie import Document

from models.collections.base import *
from models.collections.place import *
from models.collections.user import *

User.model_rebuild()
Place.model_rebuild()
document_models: list[Type[Document]] = [User, Place]
