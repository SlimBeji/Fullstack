import asyncio
import math
from http import HTTPStatus
from typing import Generic, Literal, TypeVar, cast, get_args

from beanie import Document
from bson import ObjectId
from pydantic import BaseModel

from lib.clients import db
from models.schemas import UserReadSchema
from types_ import (
    ApiError,
    FindQuery,
    FindQueryFilters,
    MongoFieldFilters,
    MongoFieldsFilters,
    MongoFindQuery,
    MongoOperation,
    PaginatedData,
    PaginationData,
    Projection,
    SortData,
)

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

    DEFAULT_PROJECTION: Projection = dict(_version=0)

    FILTER_FIELD_MAPPING: dict[str, str] = {}

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

    def safe_query(self, user: UserReadSchema, filter_query: FindQuery) -> FindQuery:
        return filter_query

    # Serialization

    async def _post_process_dict(self, item: dict) -> dict:
        if "_id" in item:
            item["id"] = item.pop("_id")
        return item

    async def _post_process_dicts(self, data: list[dict]) -> list[dict]:
        coroutines = [self._post_process_dict(i) for i in data]
        return await asyncio.gather(*coroutines)

    async def post_process_results(
        self, results: list[dict] | list[ModelDocument], to_dict: bool = False
    ) -> list[dict] | list[ReadSchema]:
        if not results:
            return []

        if not isinstance(results[0], dict):
            data = [i.model_dump() for i in cast(list[ModelDocument], results)]
        else:
            data = cast(list[dict], results)

        data = await self._post_process_dicts(data)
        if to_dict:
            return data

        return [self.read_schema(**i) for i in data]

    async def post_process(
        self, result: ModelDocument | dict, to_dict: bool = False
    ) -> ReadSchema | dict:
        output = await self.post_process_results([result], to_dict=to_dict)
        return output[0]

    # Read

    async def get_document(self, id: str | ObjectId) -> ModelDocument | None:
        return await self.model.get(id)

    async def get(self, id: str | ObjectId) -> ReadSchema | None:
        document = await self.get_document(id)
        if document is None:
            return None

        result = await self.post_process(document)
        return cast(ReadSchema, result)

    async def safe_get(self, user: UserReadSchema, id: str | ObjectId) -> ReadSchema:
        doc = await self.get_document(id)
        if not doc:
            raise self.not_found(id)

        self.safe_check(user, doc, "read")
        result = await self.post_process(doc)
        return cast(ReadSchema, result)

    # Fetch

    def _parse_sort_data(self, fields: list[str] | None) -> SortData:
        if not fields:
            return dict(createdAt=1)

        result: SortData = {}
        for field in fields:
            order: Literal[-1, 1] = 1
            if field.startswith("-"):
                order = -1
                field = field[1:]
            result[field] = order
        return result

    def _parse_projection(self, fields: list[str] | None) -> Projection:
        if not fields:
            return self.DEFAULT_PROJECTION

        result: Projection = {}
        for field in fields:
            result[field] = 1

        if "id" not in fields:
            result["_id"] = 0

        return result

    def _parse_filters(
        self, filters: FindQueryFilters | None = None
    ) -> MongoFieldsFilters:
        if not filters:
            return {}

        result: MongoFieldsFilters = {}
        for name, values in filters.items():
            if name == "id":
                name = "_id"
            if name in self.FILTER_FIELD_MAPPING:
                name = self.FILTER_FIELD_MAPPING[name]

            fieldFilters: MongoFieldFilters = {}
            for value in values:
                op = cast(MongoOperation, "$" + value.op)
                if value.op == "text":
                    fieldFilters[op] = {"$search": value.val}
                else:
                    fieldFilters[op] = value.val

            result[name] = fieldFilters
        return result

    async def count_documents(self, filters: MongoFieldsFilters | None = None) -> int:
        filters = filters or {}
        return await self.model.find(filters).count()

    async def fetch_documents(self, query: MongoFindQuery) -> list[dict]:
        """Beanie has some bugs for fetching documents using projection.
        Working with raw pymong to avoid them.
        """
        pagination = cast(PaginationData, query.pagination)
        collection = self.model.get_pymongo_collection()
        return (
            await collection.find(query.filters, query.projection)
            .sort({"email": 1})
            .collation({"locale": "en", "strength": 2})
            .skip(pagination.skip)
            .limit(pagination.size)
            .to_list()
        )

    async def fetch(self, query: FindQuery) -> PaginatedData[ReadSchema]:
        # Parsing the FindQuery to Mongo language
        pagination = PaginationData(page=query.page, size=query.size)
        projection = self._parse_projection(query.fields)
        sort = self._parse_sort_data(query.sort)
        filters = self._parse_filters(query.filters)
        parsed = MongoFindQuery(
            pagination=pagination, projection=projection, sort=sort, filters=filters
        )

        # Counting the Output
        total_count = await self.count_documents(filters)
        total_pages = math.ceil(total_count / pagination.size)

        # Fetching results and returning response
        convrt_to_dict = bool(query.fields)
        raw = await self.fetch_documents(parsed)
        data = await self.post_process_results(raw, to_dict=convrt_to_dict)
        return PaginatedData(
            page=pagination.page,
            totalPages=total_pages,
            totalCount=total_count,
            data=data,
        )

    async def safe_fetch(
        self, user: UserReadSchema, query: FindQuery
    ) -> PaginatedData[ReadSchema]:
        query = self.safe_query(user, query)
        return await self.fetch(query)

    # Create

    async def create_document(self, form: CreateSchema) -> ModelDocument:
        document = self.model(**form.model_dump())
        await self.insert_document(document)
        return document

    async def create(self, form: PostSchema) -> ReadSchema:
        create_form = self.create_schema(**form.model_dump())
        document = await self.create_document(create_form)
        result = await self.post_process(document)
        return cast(ReadSchema, result)

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
        result = await self.post_process(document)
        return cast(ReadSchema, result)

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
