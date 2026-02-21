import asyncio
from collections.abc import Mapping
from http import HTTPStatus
from typing import Any, Generic, TypeVar, cast, get_args

from pydantic import BaseModel
from sqlalchemy import Select, delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from lib.utils import convert_dict_to_camel

from ..fastapi_ import ApiError
from ..types_ import (
    Filter,
    PaginatedDict,
    PaginationData,
    SearchQuery,
    WhereFilters,
)
from .model import BaseModel as SqlBaseModel
from .types import SelectField
from .utils import apply_order_by, apply_select, apply_where

DbModel = TypeVar("DbModel", bound=SqlBaseModel)
User = TypeVar("User", bound=BaseModel)
Create = TypeVar("Create", bound=BaseModel)
Post = TypeVar("Post", bound=BaseModel)
Read = TypeVar("Read", bound=BaseModel)
Selectables = TypeVar("Selectables", bound=str)
Sortables = TypeVar("Sortables", bound=str)
Searchables = TypeVar("Searchables", bound=str)
Update = TypeVar("Update", bound=BaseModel)
Put = TypeVar("Put", bound=BaseModel)
Options = TypeVar("Options", bound=Mapping)


class CrudsClass(
    Generic[
        DbModel,  # The Database model interface
        User,  # The User read schema used for authorization
        Create,  # Creation Interface
        Post,  # HTTP Post form
        Read,  # The Read interface
        Selectables,  # Literal of Selectable fields
        Sortables,  # Literal of fields we can use OrderBy on
        Searchables,  # List of keys we can search on
        Update,  # Update Interface
        Put,  # HTTP Put form
        Options,  # General options for HTTP methods/actions
    ]
):
    # Constructor, Properties & Helpers

    MAX_ITEMS_PER_PAGE = 100
    POST_PROCESSING_BATCH_SIZE = 50

    def __init__(
        self,
        session: AsyncSession,
        model: type[DbModel],
        default_select: list[Selectables],
        default_orderby: list[Sortables],
    ):
        self.session = session
        self.model = model
        self.default_select = default_select
        self.default_orderby = default_orderby

        # Extracting the Pydantic models
        orig_base = self.__class__.__orig_bases__[0]  # type: ignore[attr-defined]
        types = get_args(orig_base)
        # self.model_type: type[DbModel] = types[0]  # DbModel
        # self.user_read_schema: type[User] = types[1] # User
        self.create_schema: type[Create] = types[2]  # Create BaseModel
        self.post_schema: type[Post] = types[3]  # Post BaseModel
        self.read_schema: type[Read] = types[4]  # Read BaseModel
        # self.selectables_type: type[Selectables] = types[5]  # Selectables type
        # self.sortables_type: type[Sortables] = types[6]  # Sortables type
        # self.searchables_type: type[Searchables] = types[7]  # Searchables type
        self.update_schema: type[Update] = types[8]  # Update BaseModel
        self.put_schema: type[Put] = types[9]  # Put BaseModel
        # self.options_type: type[Options] = types[10] # Options type

    @property
    def tablename(self) -> str:
        return self.model.__tablename__

    @property
    def model_name(self) -> str:
        return self.model.__name__

    def parse_id(self, id: int | str) -> int:
        if isinstance(id, int):
            return id

        trimmed = id.strip()
        if not trimmed.isdigit():
            raise ApiError(
                HTTPStatus.BAD_REQUEST,
                f'Invalid ID: "{id}" is not a valid integer',
            )

        return int(trimmed)

    def cast_query(
        self, query
    ) -> SearchQuery[Selectables, Sortables, Searchables]:
        return cast(SearchQuery[Selectables, Sortables, Searchables], query)

    def not_found_error(self, id: int | str) -> ApiError:
        return ApiError(
            HTTPStatus.NOT_FOUND,
            f"No record with id {id} found in {self.model_name}s",
        )

    # Serialization and Post-Processing

    def _serialize_to_dict(self, record: DbModel) -> dict:
        data = record.to_dict()
        return convert_dict_to_camel(data)

    async def post_process(self, raw: Read) -> Read:
        """Override this when subclassing"""
        return raw

    async def post_process_dict(self, raw: dict) -> dict:
        """Override this when subclassing"""
        return raw

    async def post_process_batch(self, raw: list[Read]) -> list[Read]:
        """
        Post process a batch asynchronously
        Process in chunks to avoid rate limits
        """
        batch_size = self.POST_PROCESSING_BATCH_SIZE
        results: list[Read] = []
        for i in range(0, len(raw), batch_size):
            chunk = raw[i : i + batch_size]
            processed = await asyncio.gather(
                *(self.post_process(item) for item in chunk)
            )
            results.extend(processed)
        return results

    async def post_process_dict_batch(self, raw: list[dict]) -> list[dict]:
        """
        Post process a batch asynchronously
        Process in chunks to avoid rate limits
        """
        batch_size = self.POST_PROCESSING_BATCH_SIZE
        results: list[dict] = []
        for i in range(0, len(raw), batch_size):
            chunk = raw[i : i + batch_size]
            processed = await asyncio.gather(
                *(self.post_process_dict(item) for item in chunk)
            )
            results.extend(processed)
        return results

    # Query Building

    def map_orderby(self, field: str) -> InstrumentedAttribute:
        """
        override this method when subclassing for custom behavior
        """
        # some fields maybe attributes in a JSONB column
        return getattr(self.model, field)

    def map_select(self, field: str) -> list[SelectField]:
        """
        override this method when subclassing for custom behavior
        some fields may require joins
        """
        return [SelectField(select=getattr(self.model, field), joins=None)]

    def map_where(self, field: str) -> InstrumentedAttribute:
        """
        override this method when subclassing for custom behavior
        some fields maybe attributes in a JSONB column
        """
        return getattr(self.model, field)

    def eq(self, val: Any) -> list[Filter]:
        return [{"op": "eq", "val": val}]

    def in_(self, val: list[Any]) -> list[Filter]:
        return [{"op": "in", "val": val}]

    def build_select_query(
        self, query: SearchQuery[Selectables, Sortables, Searchables]
    ) -> Select:
        stmt = select(self.model)

        # Apply select
        if not query.select or len(query.select) == 0:
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                "CRUDS error",
                {
                    "error": f"No fields provided for the select statement for {self.model_name} query"
                },
            )
        stmt = apply_select(
            stmt, cast(list[str], query.select), self.map_select
        )

        # Apply where
        if query.where and len(query.where) > 0:
            stmt = apply_where(stmt, query.where, self.map_where)

        # Apply orderby
        if query.orderby and len(query.orderby) > 0:
            stmt = apply_order_by(
                stmt, cast(list[str], query.orderby), self.map_orderby
            )

        # Apply limit
        if query.size:
            stmt = stmt.limit(query.size)

        # Apply skip
        if query.page:
            pagination = PaginationData(
                query.page or 1, query.size or self.MAX_ITEMS_PER_PAGE
            )
            stmt = stmt.offset(pagination.skip)

        return stmt

    # Create

    def create_entity(self, data: Create) -> DbModel:
        """Overload this when subclassing if required"""
        return self.model(**data.__dict__)

    async def create(self, data: Create) -> int:
        """Create from a create form, return id"""
        try:
            await self.before_create(data)
            entity = self.create_entity(data)
            self.session.add(entity)
            await self.session.flush()
            await self.session.refresh(entity)
            await self.after_create(entity.id, data)
            await self.session.commit()
            return entity.id
        except IntegrityError as err:
            await self.session.rollback()
            if "duplicate key" in str(err.orig).lower():
                raise ApiError(HTTPStatus.CONFLICT, "Record already exists")
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Could not create {self.model_name} object: {str(err)}!",
            )
        except Exception as err:
            await self.session.rollback()
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Could not create {self.model_name} object: {str(err)}!",
            )

    async def before_create(self, data: Create) -> None:
        """Overload this to run code before create"""
        pass

    async def after_create(self, id: int, data: Create) -> None:
        """Overload this to run code after create"""
        pass

    async def post_to_create(self, data: Post) -> Create:
        """Update this when subclassing if needed"""
        return self.create_schema.model_construct(**data.__dict__)

    async def auth_post(self, user: User, form: Post) -> None:
        """Raise an ApiError if user lacks authorization"""
        raise NotImplementedError

    async def post(self, form: Post, options: Options | None = None) -> Read:
        """create from a post form"""
        data = await self.post_to_create(form)
        id = await self.create(data)
        return await self.get(id, options)

    async def user_post(
        self, user: User, form: Post, options: Options | None = None
    ) -> Read:
        """check user authorization with respect to the data before the post"""
        await self.auth_post(user, form)
        return await self.post(form, options)

    # Read

    async def exists(self, where: WhereFilters[Searchables]) -> bool:
        """
        A utility function to quickly check if a record exists
        May be useful for auth methods
        """
        try:
            stmt = select(self.model.id)
            stmt = apply_where(stmt, where, self.map_where)
            result = await self.session.execute(stmt)
            return result.scalar() is not None
        except Exception as err:
            raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, str(err))

    async def read(self, id: int | str) -> DbModel | None:
        """Return the DbModel if found else null"""
        parsed_id = self.parse_id(id)
        stmt = select(self.model).where(self.model.id == parsed_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    def auth_get(
        self,
        user: User,
        query: SearchQuery[Selectables, Sortables, Searchables],
    ) -> SearchQuery[Selectables, Sortables, Searchables]:
        """
        Update the where statement to add ownership filters
        check the select clause to see if some fields are accessible or not by the user
        """
        raise NotImplementedError

    async def _get_raw(
        self,
        id: int | str,
        *,
        fields: list[Sortables] | None = None,
        user: User | None = None,
    ) -> DbModel:
        """Raise a 404 Not Found ApiError if not found"""

        query = SearchQuery[Selectables, Sortables, Searchables](
            select=cast(list[Selectables], fields or self.default_select),
            where=cast(WhereFilters[Searchables], {"id": self.eq(id)}),
        )

        # Apply ownership if needed
        if user:
            query = self.auth_get(user, query)

        stmt = self.build_select_query(self.cast_query(query))
        result = await self.session.execute(stmt)
        record = result.scalar_one()
        if not record:
            raise self.not_found_error(id)
        return cast(DbModel, record)

    async def get(self, id: int | str, options: Options | None = None) -> Read:
        options = options or cast(Options, {})
        process = options.get("process", False)
        obj = await self._get_raw(id)
        result = self.read_schema.model_validate(obj, from_attributes=True)
        if process:
            result = await self.post_process(result)
        return result

    async def get_partial(
        self, id: int | str, options: Options | None = None
    ) -> dict:
        options = options or cast(Options, {})
        fields = options.get("fields", self.default_select)
        process = options.get("process", False)
        obj = await self._get_raw(id, fields=fields)
        result = self._serialize_to_dict(obj)
        if process:
            result = await self.post_process_dict(result)
        return result

    async def user_get(
        self, user: User, id: int | str, options: Options | None = None
    ) -> Read:
        options = options or cast(Options, {})
        process = options.get("process", False)
        obj = await self._get_raw(id, user=user)
        result = self.read_schema.model_validate(obj, from_attributes=True)
        if process:
            result = await self.post_process(result)
        return result

    async def user_get_partial(
        self, user: User, id: int | str, options: Options | None = None
    ) -> dict:
        options = options or cast(Options, {})
        process = options.get("process", False)
        fields = options.get("fields", self.default_select)
        obj = await self._get_raw(id, fields=fields, user=user)
        result = self._serialize_to_dict(obj)
        if process:
            result = await self.post_process_dict(result)
        return result

    # Update

    async def update(self, id: int | str, data: Update) -> None:
        """update from a Update form"""
        key = self.parse_id(id)
        try:
            await self.before_update(id, data)
            stmt = (
                update(self.model)
                .where(self.model.id == key)
                .values(**data.__dict__)
                .returning(self.model.id)
            )
            result = await self.session.execute(stmt)
            if result.scalar_one_or_none() is None:
                raise self.not_found_error(id)
            await self.after_update(id, data)
            await self.session.commit()

        except Exception as err:
            await self.session.rollback()
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Could not update {self.model_name} object: {str(err)}!",
            )

    async def before_update(self, id: int | str, data: Update) -> None:
        """Overload this to run code before update"""
        pass

    async def after_update(self, id: int | str, data: Update) -> None:
        """Overload this to run code after update"""
        pass

    async def auth_put(self, user: User, id: int | str, form: Put) -> None:
        """
        Raise an ApiError if user lacks authorization
        # Must have access to the records
        # Data updates must be allowed
        """
        raise NotImplementedError

    async def put_to_update(self, data: Put) -> Update:
        """Update this when subclassing"""
        return self.update_schema.model_construct(**data.__dict__)

    async def put(
        self, id: int | str, form: Put, options: Options | None = None
    ) -> Read:
        """update from a put form"""
        data = await self.put_to_update(form)
        await self.update(id, data)
        return await self.get(id, options)

    async def user_put(
        self,
        user: User,
        id: int | str,
        form: Put,
        options: Options | None = None,
    ) -> Read:
        """check user authorization with respect to the data before the put"""
        await self.auth_put(user, id, form)
        return await self.put(id, form, options)

    # Delete

    async def delete(self, id: int | str) -> None:
        """delete object by id"""
        key = self.parse_id(id)
        try:
            record = await self.read(id)
            if record is None:
                raise self.not_found_error(id)
            await self.before_delete(record)
            stmt = delete(self.model).where(self.model.id == key)
            await self.session.execute(stmt)
            await self.after_delete(record)
            await self.session.commit()

        except Exception as err:
            await self.session.rollback()
            raise ApiError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                f"Could not delete {self.model_name} object: {str(err)}!",
            )

    async def before_delete(self, record: DbModel) -> None:
        """Overload this to run code before delete"""
        pass

    async def after_delete(self, record: DbModel) -> None:
        """Overload this to run code after delete"""
        pass

    async def auth_delete(self, user: User, id: int | str) -> None:
        """Raise an ApiError if user lacks authorization"""
        raise NotImplementedError

    async def user_delete(self, user: User, id: int | str) -> None:
        """check if user is authorized to delete the object"""
        await self.auth_delete(user, id)
        await self.delete(id)

    # Search

    async def count(
        self, query: SearchQuery[Selectables, Sortables, Searchables]
    ) -> int:
        """count the number of rows"""
        where = query.where or {}  # type: ignore
        stmt = select(self.model.id)
        stmt = apply_where(stmt, where, self.map_where)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        result = await self.session.execute(count_stmt)
        return result.scalar() or 0

    async def _get_many(
        self,
        query: SearchQuery[Selectables, Sortables, Searchables],
        user: User | None = None,
    ) -> list[DbModel]:
        """privvate method to search records, returns a list of DbModel"""

        # Setting default values
        if not query.select or len(query.select) == 0:
            query.select = list(self.default_select)
        if not query.orderby or len(query.orderby) == 0:
            query.orderby = list(self.default_orderby)
        if not query.where or len(query.where) == 0:
            query.where = {}  # type: ignore
        if not query.page:
            query.page = 1
        if not query.size:
            query.size = self.MAX_ITEMS_PER_PAGE

        # Fetch the ids with pagination
        filter_query = SearchQuery[Selectables, Sortables, Searchables](
            page=query.page,
            size=query.size,
            select=["id"],  # type: ignore
            where=query.where,
            orderby=query.orderby,
        )

        # Apply auth filter if required
        if user:
            filter_query = self.auth_get(user, filter_query)

        stmt = self.build_select_query(self.cast_query(filter_query))
        result = await self.session.execute(stmt)
        ids = [row.id for row in result.scalars().all()]

        if len(ids) == 0:
            return []

        # Fetching the records with the id in ids
        fetch_query = SearchQuery[Selectables, Sortables, Searchables](
            page=1,
            size=len(ids),
            select=query.select,
            where={"id": self.in_(ids)},  # type: ignore
            orderby=query.orderby,
        )
        stmt = self.build_select_query(fetch_query)
        result = await self.session.execute(stmt)
        return result.scalars().all()  # type: ignore

    async def search(
        self,
        query: SearchQuery[Selectables, Sortables, Searchables],
        options: Options | None = None,
    ) -> list[Read]:
        """
        search records, returns list of Read
        query.select is ignored, in order to return the full Read schema
        """
        options = options or cast(Options, {})
        process = options.get("process", False)
        query.select = self.default_select
        records = await self._get_many(query)
        results = [
            self.read_schema.model_validate(r, from_attributes=True)
            for r in records
        ]
        if process:
            results = await self.post_process_batch(results)
        return results

    async def user_search(
        self,
        user: User,
        query: SearchQuery[Selectables, Sortables, Searchables],
        options: Options | None = None,
    ) -> list[Read]:
        """
        search records accessible by the user, returns list of Read
        query.select is ignored, in order to return the full Read schema
        """
        options = options or cast(Options, {})
        process = options.get("process", False)
        query.select = self.default_select
        records = await self._get_many(query, user)
        results = [
            self.read_schema.model_validate(r, from_attributes=True)
            for r in records
        ]
        if process:
            results = await self.post_process_batch(results)
        return results

    async def search_partial(
        self,
        query: SearchQuery[Selectables, Sortables, Searchables],
        options: Options | None = None,
    ) -> list[dict]:
        """
        search records, returns list of dict (partial data)
        query.select is ignored, in order to return the full Read schema
        """
        options = options or cast(Options, {})
        process = options.get("process", False)
        records = await self._get_many(query)
        results = [self._serialize_to_dict(r) for r in records]
        if process:
            results = await self.post_process_dict_batch(results)
        return results

    async def user_search_partial(
        self,
        user: User,
        query: SearchQuery[Selectables, Sortables, Searchables],
        options: Options | None = None,
    ) -> list[dict]:
        """
        search records accessible by the user, returns list of dict (partial data)
        query.select is ignored, in order to return the full Read schema
        """
        options = options or cast(Options, {})
        process = options.get("process", False)
        records = await self._get_many(query, user)
        results = [self._serialize_to_dict(r) for r in records]
        if process:
            results = await self.post_process_dict_batch(results)
        return results

    async def paginate(
        self, query: SearchQuery[Selectables, Sortables, Searchables]
    ) -> PaginatedDict:
        # The inputs should be validated in the HTTP layer
        # The selectable fields should include only fields
        # part of the Read Schema

        # Step 1: counting the output
        page = query.page or 1
        size = query.size or self.MAX_ITEMS_PER_PAGE
        total_count = await self.count(query)
        total_pages = (total_count + size - 1) // size

        # Step 2: normalizing the query
        normalized = SearchQuery(
            page=page,
            size=size,
            select=query.select,
            where=query.where,
            orderby=query.orderby,
        )

        # Step 3: fetching results
        data = await self.search_partial(normalized)

        # Step 4: return paginated result
        return PaginatedDict(
            page=page,
            totalPages=total_pages,
            totalCount=total_count,
            data=data,
        )

    async def user_paginate(
        self,
        user: User,
        query: SearchQuery[Selectables, Sortables, Searchables],
    ) -> PaginatedDict:
        query = self.auth_get(user, query)
        return await self.paginate(query)
