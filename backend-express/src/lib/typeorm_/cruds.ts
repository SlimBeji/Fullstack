import {
    DataSource,
    DeepPartial,
    DeleteResult,
    QueryFailedError,
    Repository,
    SelectQueryBuilder,
    UpdateResult,
} from "typeorm";

import { ApiError, HttpStatus } from "../express_";
import {
    Filter,
    FindQuery,
    FindQueryFilters,
    PaginatedData,
    PaginationData,
} from "../types";
import { camelToSnake } from "../utils";
import { AbstractEntity, SelectField } from "./types";
import { applyOrderBy, applySelect, applyWhere } from "./utils";

export class CrudsClass<
    DbModel extends AbstractEntity, // The Database model interface
    User extends object, // The User model used for authorization
    Create extends object, // Creation Interface
    Post extends object, // HTTP Post Interface
    Read extends object, // The Read interface
    Selectables extends string, // Literal of Selectable fields
    Sortables extends string, // Literal of fields we can use OrderBy on
    Searchables extends string, // List of keys we can search on
    Update extends object, // Update Interface
    Put extends object, // HTTP Put Interface
> {
    // Constructor, Properties & Helpers

    MAX_ITEMS_PER_PAGE = 100;

    repository: Repository<DbModel>;

    constructor(
        public datasource: DataSource,
        public modelName: string,
        public defaultSelect: readonly Selectables[],
        public defaultOrderby: readonly Sortables[]
    ) {
        this.repository = this.datasource.getRepository(this.modelName);
    }

    get tablename(): string {
        return this.repository.metadata.tableName;
    }

    parseId(id: number | string): number {
        if (typeof id === "number") return id;
        const trimmed = id.trim();
        const parsed = Number(trimmed); // Stricter than parseInt
        if (
            isNaN(parsed) ||
            !Number.isInteger(parsed) ||
            trimmed !== String(parsed)
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                `Invalid ID: "${id}" is not a valid integer`
            );
        }
        return parsed;
    }

    notFoundError(id: number | string): ApiError {
        return new ApiError(
            HttpStatus.NOT_FOUND,
            `No document with id ${id} found in ${this.modelName}s`
        );
    }

    // Post-Processing

    async toRead(fetched: any): Promise<Read> {
        // remove protected/private fields
        // may fetch extra fields to get the full Read schema
        // overload this for edge cases
        return (await this.toPartialRead(fetched)) as Read;
    }

    async toPartialRead(_fetched: DeepPartial<any>): Promise<Partial<Read>> {
        // remove protected/private fields
        // does not fetch extra fields
        // overload this for edge cases
        throw new Error(
            `toPartialRead is not implemented for model ${this.modelName}`
        );
    }

    async postProcess<T extends Partial<Read> | Read>(raw: T): Promise<T> {
        // Override this when subclassing
        return raw;
    }

    async postProcessBatch<T extends Partial<Read> | Read>(
        raw: T[],
        batchSize = 50
    ): Promise<T[]> {
        // Post process a batch asynchronously
        // Process in chunks to avoid rate limits
        const results: T[] = [];
        for (let i = 0; i < raw.length; i += batchSize) {
            const chunk = raw.slice(i, i + batchSize);
            const processed = await Promise.all(
                chunk.map((item) => this.postProcess(item))
            );
            results.push(...processed);
        }
        return results;
    }

    // Query Building

    mapOrderBy(field: string): string {
        // overide this method when subclassing for custom behavior
        // some fields maybe attributes in a JSONB column
        // e.g. "(user.personal->>'age')::float"
        return camelToSnake(field);
    }

    mapSelect(field: string): SelectField {
        // overide this method when subclassing for custom behavior
        // some fields may require joins
        return { select: camelToSnake(field) };
    }

    mapWhere(field: string): string {
        // overide this method when subclassing for custom behavior
        // somefields maybe attributes in a JSONB column
        // e.g. "(user.personal->>'age')::float"
        return camelToSnake(field);
    }

    eq(val: any): Filter[] {
        return [{ op: "eq", val }];
    }

    buildSelectQuery(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): SelectQueryBuilder<DbModel> {
        let ormQuery = this.repository.createQueryBuilder(this.tablename);

        // Apply select
        const select = query.select || [...this.defaultSelect];
        ormQuery = applySelect(ormQuery, select, (item) =>
            this.mapSelect(item)
        );

        // Apply where
        let where = query.where || ({} as FindQueryFilters<Searchables>);
        ormQuery = applyWhere(ormQuery, where, (item) => this.mapWhere(item));

        // Apply order by
        let orderby = query.orderby || [...this.defaultOrderby];
        ormQuery = applyOrderBy(ormQuery, orderby, (item) =>
            this.mapOrderBy(item)
        );

        // Apply pagination
        const pagination = new PaginationData(
            query.page || 1,
            query.size || this.MAX_ITEMS_PER_PAGE
        );
        ormQuery = ormQuery.take(pagination.size).skip(pagination.skip);

        // Return query before executing
        return ormQuery;
    }

    async exists(where: FindQueryFilters<Searchables>): Promise<boolean> {
        try {
            let ormQuery = this.repository.createQueryBuilder(this.tablename);
            ormQuery = applySelect(ormQuery, ["id"], (item) =>
                this.mapSelect(item)
            );
            ormQuery = applyWhere(ormQuery, where, (item) =>
                this.mapWhere(item)
            );
            const result = await ormQuery.getRawOne();
            return !!result;
        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    err.message
                );
            }
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong"
            );
        }
    }

    // Create

    createEntity(data: Create): DeepPartial<DbModel> {
        // Overload this when subclassing if required
        return data as any as DeepPartial<DbModel>;
    }

    async create(data: Create): Promise<DbModel> {
        // Use transactions when executing pre and post hooks
        try {
            return await this.repository.save(this.createEntity(data));
        } catch (err) {
            if (
                err instanceof QueryFailedError &&
                err.driverError?.code === "23505"
            ) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    "Record already exists"
                );
            } else if (err instanceof Error) {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                const message = `Could not create ${this.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    async postToCreate(data: Post): Promise<Create> {
        // Update this when sublcassing
        return data as any as Create;
    }

    async post(form: Post): Promise<Read> {
        // create from a post form
        const data = await this.postToCreate(form);
        const obj = await this.create(data);
        return await this.toRead(obj);
    }

    async authPost(_user: User, _form: Post): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userPost(user: User, form: Post): Promise<Read> {
        // check user authoriation with respect to the data before the post
        await this.authPost(user, form);
        return this.post(form);
    }

    // Read

    async find(id: number | string): Promise<DbModel | null> {
        // Return the DbModel if ound
        // Return null if not found
        return await this.repository.findOneBy({ id: this.parseId(id) } as any);
    }

    async get(id: number | string): Promise<Read> {
        // Raise a 404 Not Found ApiError if not found
        // Overload this to fetch relations
        const result = await this.find(id);
        if (!result) {
            throw this.notFoundError(id);
        }
        return await this.toRead(result);
    }

    async authGet(_user: User, _data: DbModel): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userGet(user: User, id: number | string): Promise<Read> {
        const result = await this.find(id);
        if (!result) {
            throw this.notFoundError(id);
        }
        await this.authGet(user, result);
        return await this.toRead(result);
    }

    // Update

    async update(id: number | string, data: Update): Promise<DbModel> {
        // Use transactions when executing pre and post hooks
        const key = this.parseId(id);
        let result: UpdateResult;
        try {
            result = await this.repository
                .createQueryBuilder()
                .update()
                .set(data as any)
                .where("id = :id", { id: key })
                .returning("*")
                .execute();
        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not update ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
        }

        if (result.affected === 0) {
            throw this.notFoundError(id);
        }

        if (Array.isArray(result.raw) && result.raw.length === 1) {
            return result.raw[0];
        }

        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Could not update ${this.modelName} object: unexpected result`
        );
    }

    async putToUpdate(data: Put): Promise<Update> {
        // Update this when sublcassing
        return data as any as Update;
    }

    async put(id: number | string, form: Put): Promise<Read> {
        // update from a put form
        const data = await this.putToUpdate(form);
        const result = await this.update(id, data);
        return await this.toRead(result);
    }

    async authPut(
        _user: User,
        _id: number | string,
        _form: Put
    ): Promise<void> {
        // Raise an ApiError if user lacks authorization
        // Must have access to the records
        // Data updates must be allowed
    }

    async userPut(user: User, id: number | string, form: Put): Promise<Read> {
        // check user authoriation with respect to the data before the put
        await this.authPut(user, id, form);
        return this.put(id, form);
    }

    // Delete

    async delete(id: number | string): Promise<void> {
        // delete object by id
        const key = this.parseId(id);
        let result: DeleteResult;
        try {
            result = await this.repository.delete({ id: key } as any);
        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not delete ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
        }
        if (result.affected === 0) {
            throw this.notFoundError(id);
        }
    }

    async authDelete(_user: User, _id: number | string): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userDelete(user: User, id: number | string): Promise<void> {
        // check if user is authorized to delete the object
        await this.authDelete(user, id);
        await this.delete(id);
    }

    // Search

    authSearch(
        _user: User,
        _query: FindQuery<Selectables, Sortables, Searchables>
    ): FindQuery<Selectables, Sortables, Searchables> {
        // Update the where statement to add ownership filters
        // check the select clause to see if some fields are accessible or not by the user
        throw new Error(`authSearch not implemented for ${this.modelName}`);
    }

    async search(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<any[]> {
        // search records
        const ormQuery = this.buildSelectQuery(query);
        return await ormQuery.getRawMany();
    }

    async userSearch(
        user: User,
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<any[]> {
        // search records accessible by the user
        query = await this.authSearch(user, query);
        return await this.search(query);
    }

    async count(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<number> {
        // count the number of rows
        const where = query.where || ({} as FindQueryFilters<Searchables>);
        let ormQuery = this.repository.createQueryBuilder(this.tablename);
        ormQuery = applyWhere(ormQuery, where, (item) => this.mapWhere(item));
        return await ormQuery.getCount();
    }

    async paginate(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        // The inputs should be validated in the HTTP layer
        // The selectable fields should include only fields
        // part of the Read Schema

        // Step 1: counting the output
        const page = query.page || 1;
        const size = query.size || this.MAX_ITEMS_PER_PAGE;
        const totalCount = await this.count(query);
        const totalPages = Math.ceil(totalCount / size);

        // Step 2: normalizing the query
        const normalized = { ...query, page, size };

        // Step 3: fetching results
        const result = await this.search(normalized);
        const data = await Promise.all(
            result.map((item) => this.toPartialRead(item))
        );

        // Step 4: return paginated result
        return { page, totalPages, totalCount, data };
    }

    async userPaginate(
        user: User,
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        query = this.authSearch(user, query);
        return await this.paginate(query);
    }
}
