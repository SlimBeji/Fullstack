from http import HTTPStatus
from typing import Generic, Literal, TypeVar, get_args

from beanie import Document
from bson import ObjectId
from pydantic import BaseModel

from lib.clients import db
from models.schemas import UserReadSchema
from types_ import ApiError, MongoFindQuery, ProjectionExcl

ModelDocument = TypeVar("ModelDocument", bound=Document)
ReadSchema = TypeVar("ReadSchema", bound=BaseModel)
FiltersSchema = TypeVar("FiltersSchema", bound=BaseModel)
CreateSchema = TypeVar("CreateSchema", bound=BaseModel)
PostSchema = TypeVar("PostSchema", bound=BaseModel)
UpdateSchema = TypeVar("UpdateSchema", bound=BaseModel)
PutSchema = TypeVar("PutSchema", bound=BaseModel)

CrudEvent = Literal["create", "read", "update", "delete"]


class CrudBase(
    Generic[
        ModelDocument,  # Beanie Document
        ReadSchema,  # Read Schema
        FiltersSchema,  # Filters Schema
        CreateSchema,  # Creation Schema
        PostSchema,  # HTTP Post Schema
        UpdateSchema,  # Update Schema
        PutSchema,  # HTTP Put Schema
    ]
):
    # Constructor & Properties

    DEFAULT_PROJECTION: ProjectionExcl = dict(_version=0)

    def __init__(self) -> None:
        orig_base = self.__class__.__orig_bases__[0]  # type: ignore[attr-defined]
        types = get_args(orig_base)
        self.model: type[ModelDocument] = types[0]
        self.read_schema: type[ReadSchema] = types[1]
        self.filters_schema: type[FiltersSchema] = types[2]
        self.create_schema: type[CreateSchema] = types[3]
        self.post_schema: type[PostSchema] = types[4]
        self.update_schema: type[UpdateSchema] = types[5]
        self.put_schema: type[PutSchema] = types[6]

    @property
    def model_name(self) -> str:
        return self.model.get_collection_name()

    # Helpers

    async def insert_document(self, document: ModelDocument) -> None:
        async with db.session_transaction() as session:
            await document.insert(session=session)

    async def save_document(self, document: ModelDocument) -> None:
        async with db.session_transaction() as session:
            await document.save(session=session)

    def not_found(self, id: str | ObjectId) -> ApiError:
        return ApiError(
            HTTPStatus.NOT_FOUND,
            f"No document with id {id} found in {self.model_name}s",
        )

    # Accessors

    def safe_check(
        self,
        user: UserReadSchema,
        document: ModelDocument | PostSchema | PutSchema,
        event: CrudEvent,
    ) -> None:
        pass

    def safe_filter(
        self, user: UserReadSchema, filter_query: MongoFindQuery
    ) -> MongoFindQuery:
        return filter_query

    # Serialization

    async def serialize_batch(self, documents: list[ModelDocument]) -> list[ReadSchema]:
        """Use the ReadSchema to hide sensitive data"""
        return [self.read_schema(**d.model_dump()) for d in documents]

    async def serialize(self, document: ModelDocument) -> ReadSchema:
        result = await self.serialize_batch([document])
        return result[0]

    # Read

    async def get_document(self, id: str | ObjectId) -> ModelDocument | None:
        return await self.model.get(id)

    async def get(self, id: str | ObjectId) -> ReadSchema | None:
        document = await self.get_document(id)
        if document is None:
            return None

        return await self.serialize(document)

    async def safe_get(self, user: UserReadSchema, id: str | ObjectId) -> ReadSchema:
        doc = await self.get_document(id)
        if not doc:
            raise self.not_found(id)

        self.safe_check(user, doc, "read")
        return await self.serialize(doc)

    # Create

    async def create_document(self, form: CreateSchema) -> ModelDocument:
        document = self.model(**form.model_dump())
        await self.insert_document(document)
        return document

    async def create(self, form: PostSchema) -> ReadSchema:
        create_form = self.create_schema(**form.model_dump())
        document = await self.create_document(create_form)
        return await self.serialize(document)

    async def safe_create(self, user: UserReadSchema, form: PostSchema) -> ReadSchema:
        self.safe_check(user, form, "create")
        return await self.create(form)

    # Update

    async def update_document(
        self, document: ModelDocument, form: UpdateSchema
    ) -> ModelDocument:
        for field, value in form.model_dump(exclude_unset=True).items():
            setattr(document, field, value)

        await self.save_document(document)
        return document

    async def update(self, document: ModelDocument, form: PutSchema) -> ReadSchema:
        j = form.model_dump(exclude_none=True, exclude_unset=True)
        update = self.update_schema(**j)
        document = await self.update_document(document, update)
        return await self.serialize(document)

    async def safe_update(
        self, user: UserReadSchema, document: ModelDocument, form: PutSchema
    ) -> ReadSchema:
        self.safe_check(user, document, "read")
        self.safe_check(user, form, "update")
        return await self.update(document, form)

    async def safe_update_by_id(
        self, user: UserReadSchema, id: str | ObjectId, form: PutSchema
    ) -> ReadSchema:
        document = await self.get_document(id)
        if document is None:
            raise self.not_found(id)
        return await self.safe_update(user, document, form)

    # Delete

    async def delete_cleanup(self, document: ModelDocument) -> None:
        pass

    async def delete_document(self, document: ModelDocument) -> None:
        try:
            async with db.session_transaction() as session:
                await document.delete(session=session)
                await self.delete_cleanup(document)
        except:
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Could not delete {self.model_name} object!",
            )

    async def delete(self, id: str | ObjectId) -> None:
        document = await self.get_document(id)
        if document is None:
            return None

        return await self.delete_document(document)

    async def safe_delete(self, user: UserReadSchema, id: str | ObjectId) -> None:
        document = await self.get_document(id)
        if document is None:
            raise self.not_found(id)

        self.safe_check(user, document, "delete")
        return await self.delete_document(document)
