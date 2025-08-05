from beanie import Document

from models.collections.base import *
from models.collections.place import *
from models.collections.user import *

User.model_rebuild()
Place.model_rebuild()
document_models: list[type[Document]] = [User, Place]
