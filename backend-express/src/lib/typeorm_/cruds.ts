import {
    DataSource,
    EntityManager,
    QueryFailedError,
    Repository,
    SelectQueryBuilder,
    UpdateResult,
} from "typeorm";

import { ApiError, HttpStatus } from "../types";
import {
    Filter,
    PaginatedData,
    PaginationData,
    SearchQuery,
    WhereFilters,
} from "../types";
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
    Options extends { process?: boolean; fields?: Selectables[] }, // General options for HTTP methods/actions
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
            `No record with id ${id} found in ${this.modelName}s`
        );
    }

    // Serialization and Post-Processing

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

    fieldAlias(field: string): string {
        // shortcut to a column alias for the select clause
        return `${this.tablename}.${field}`;
    }

    mapOrderBy(field: string): string {
        // overide this method when subclassing for custom behavior
        // some fields maybe attributes in a JSONB column
        // e.g. "(user.personal->>'age')::float"
        return this.fieldAlias(field);
    }

    mapSelect(field: string): SelectField[] {
        // overide this method when subclassing for custom behavior
        // some fields may require joins
        return [{ select: this.fieldAlias(field) }];
    }

    mapWhere(field: string): string {
        // overide this method when subclassing for custom behavior
        // somefields maybe attributes in a JSONB column
        // e.g. "(user.personal->>'age')::float"
        return this.fieldAlias(field);
    }

    eq(val: any): Filter[] {
        return [{ op: "eq", val }];
    }

    in(val: any[]): Filter[] {
        return [{ op: "in", val }];
    }

    buildSelectQuery(
        query: SearchQuery<Selectables, Sortables, Searchables>
    ): SelectQueryBuilder<DbModel> {
        let ormQuery = this.repository.createQueryBuilder(this.tablename);

        // Apply select
        if (!query.select || query.select.length === 0) {
            query.select = [...this.defaultSelect];
        }
        ormQuery = applySelect(ormQuery, query.select, (item) =>
            this.mapSelect(item)
        );

        // Apply where
        if (query.where && Object.keys(query.where).length > 0) {
            ormQuery = applyWhere(ormQuery, query.where, (item) =>
                this.mapWhere(item)
            );
        }

        // Apply orderby
        if (query.orderby && query.orderby.length > 0) {
            ormQuery = applyOrderBy(ormQuery, query.orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Apply limit
        if (query.size) {
            ormQuery = ormQuery.take(query.size);
        }

        // Apply skip
        if (query.page) {
            const pagination = new PaginationData(
                query.page || 1,
                query.size || this.MAX_ITEMS_PER_PAGE
            );
            ormQuery = ormQuery.skip(pagination.skip);
        }

        // Return query before executing
        return ormQuery;
    }

    // Create

    toModel(data: Create): DbModel {
        // Overload this when subclassing if required
        return data as any as DbModel;
    }

    async create(data: Create): Promise<number> {
        // Use transactions when executing pre and post hooks
        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const manager = queryRunner.manager;

        try {
            await this.beforeCreate(manager, data);
            const result = await manager.insert(
                this.repository.target,
                this.toModel(data)
            );
            const id = result.identifiers[0].id;
            await this.afterCreate(manager, id, data);
            await queryRunner.commitTransaction();
            return id;
        } catch (err) {
            await queryRunner.rollbackTransaction();
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
        } finally {
            await queryRunner.release();
        }
    }

    async beforeCreate(_manager: EntityManager, _data: Create): Promise<void> {
        // Overload this to run code before create
    }

    async afterCreate(
        _manager: EntityManager,
        _id: number,
        _data: Create
    ): Promise<void> {
        // Overload this to run code before create
    }

    async postToCreate(data: Post): Promise<Create> {
        // Update this when sublcassing
        return data as any as Create;
    }

    async authPost(_user: User, _form: Post): Promise<void> {
        // Raise an ApiError if user lacks authorization
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "authPost not implemented"
        );
    }

    async post(form: Post, options: Options = {} as Options): Promise<Read> {
        // create from a post form
        const data = await this.postToCreate(form);
        const id = await this.create(data);
        return await this.get(id, options);
    }

    async userPost(
        user: User,
        form: Post,
        options: Options = {} as Options
    ): Promise<Read> {
        // check user authoriation with respect to the data before the post
        await this.authPost(user, form);
        return this.post(form, options);
    }

    // Read

    async exists(where: WhereFilters<Searchables>): Promise<boolean> {
        // A utility function to quickly check if a record exists
        // May be useful for auth methods
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

    async read(id: number | string): Promise<DbModel | null> {
        // Return the DbModel if found else null
        return await this.repository.findOneBy({ id: this.parseId(id) } as any);
    }

    authGet(
        _user: User,
        _query: SearchQuery<Selectables, Sortables, Searchables>
    ): SearchQuery<Selectables, Sortables, Searchables> {
        // Update the where statement to add ownership filters
        // check the select clause to see if some fields are accessible or not by the user
        throw new Error(`authGet not implemented for ${this.modelName}`);
    }

    async get_raw(
        id: number | string,
        user: User | null,
        fields: Selectables[] | null
    ): Promise<DbModel> {
        // Raise a 404 Not Found ApiError if not found
        let query: SearchQuery<Selectables, Sortables, Searchables> = {
            select: fields || [...this.defaultSelect],
            where: { id: this.eq(id) } as WhereFilters<Searchables>,
        };

        // Apply ownership if needed
        if (user) {
            query = this.authGet(user, query);
        }

        const ormQuery = this.buildSelectQuery(query);
        const result = await ormQuery.getOne();
        if (!result) {
            throw this.notFoundError(id);
        }
        return result;
    }

    async get(
        id: number | string,
        options: Options = {} as Options
    ): Promise<Read> {
        // By using the defaultSelect, we get a Read
        const result = (await this.get_raw(id, null, null)) as any as Read;
        if (options.process) {
            return await this.postProcess(result);
        }
        return result;
    }

    async userGet(
        user: User,
        id: number | string,
        options: Options = {} as Options
    ): Promise<Read> {
        // By using the defaultSelect, we get a Read
        const result = (await this.get_raw(id, user, null)) as any as Read;
        if (options.process) {
            return await this.postProcess(result);
        }
        return result;
    }

    async getPartial(
        id: number | string,
        options: Options = {} as Options
    ): Promise<Partial<Read>> {
        // Raise a 404 Not Found ApiError if not found
        const result = (await this.get_raw(
            id,
            null,
            options.fields || null
        )) as any as Partial<Read>;
        if (options.process) {
            return await this.postProcess(result);
        }
        return result;
    }

    async userGetPartial(
        user: User,
        id: number | string,
        options: Options = {} as Options
    ): Promise<Partial<Read>> {
        // Raise a 404 Not Found ApiError if not found
        const result = (await this.get_raw(
            id,
            user,
            options.fields || null
        )) as any as Partial<Read>;
        if (options.process) {
            return await this.postProcess(result);
        }
        return result;
    }

    // Update

    async update(id: number | string, data: Update): Promise<void> {
        // Use transactions when executing pre and post hooks
        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const manager = queryRunner.manager;

        const key = this.parseId(id);
        let result: UpdateResult;
        try {
            await this.beforeUpdate(manager, key, data);
            result = await manager
                .createQueryBuilder()
                .update(this.repository.target)
                .set(data as any)
                .where("id = :id", { id: key })
                .returning("id")
                .execute();
            if (result.affected === 0) {
                throw this.notFoundError(id);
            }
            await this.afterUpdate(manager, key, data);
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof ApiError) {
                throw err;
            } else if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not update ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
        } finally {
            await queryRunner.release();
        }

        if (Array.isArray(result.raw) && result.raw.length === 1) {
            return;
        }

        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Could not update ${this.modelName} object: unexpected result`
        );
    }

    async beforeUpdate(
        _manager: EntityManager,
        _id: number,
        _data: Update
    ): Promise<void> {
        // Overload this to run code before update
    }

    async afterUpdate(
        _manager: EntityManager,
        _id: number,
        _data: Update
    ): Promise<void> {
        // Overload this to run code before update
    }

    async authPut(
        _user: User,
        _id: number | string,
        _form: Put
    ): Promise<void> {
        // Raise an ApiError if user lacks authorization
        // Must have access to the records
        // Data updates must be allowed
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "authPut not implemented"
        );
    }

    async putToUpdate(data: Put): Promise<Update> {
        // Update this when sublcassing
        return data as any as Update;
    }

    async put(
        id: number | string,
        form: Put,
        options: Options = {} as Options
    ): Promise<Read> {
        // update from a put form
        const data = await this.putToUpdate(form);
        await this.update(id, data);
        return await this.get(id, options);
    }

    async userPut(
        user: User,
        id: number | string,
        form: Put,
        options: Options = {} as Options
    ): Promise<Read> {
        // check user authoriation with respect to the data before the put
        await this.authPut(user, id, form);
        return this.put(id, form, options);
    }

    // Delete

    async delete(id: number | string): Promise<void> {
        // delete object by id
        const key = this.parseId(id);
        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const manager = queryRunner.manager;

        try {
            const obj = await this.read(id);
            if (!obj) {
                throw this.notFoundError(id);
            }
            await this.beforeDelete(manager, obj);
            const result = await manager
                .createQueryBuilder()
                .delete()
                .from(this.repository.target)
                .where("id = :id", { id: key })
                .execute();
            if (result.affected === 0) {
                throw this.notFoundError(id);
            }
            await this.afterDelete(manager, obj);
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof ApiError) {
                throw err;
            } else if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not delete ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async beforeDelete(_manager: EntityManager, _obj: DbModel): Promise<void> {
        // Overload this to run code before delete
    }

    async afterDelete(_manager: EntityManager, _obj: DbModel): Promise<void> {
        // Overload this to run code before delete
    }

    async authDelete(_user: User, _id: number | string): Promise<void> {
        // Raise an ApiError if user lacks authorization
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "authDelete not implemented"
        );
    }

    async userDelete(user: User, id: number | string): Promise<void> {
        // check if user is authorized to delete the object
        await this.authDelete(user, id);
        await this.delete(id);
    }

    // Search

    async count(
        query: SearchQuery<Selectables, Sortables, Searchables>
    ): Promise<number> {
        // count the number of rows
        const where = query.where || ({} as WhereFilters<Searchables>);
        let ormQuery = this.repository.createQueryBuilder(this.tablename);
        ormQuery = applyWhere(ormQuery, where, (item) => this.mapWhere(item));
        return await ormQuery.getCount();
    }

    async getMany(
        query: SearchQuery<Selectables, Sortables, Searchables>,
        user: User | null
    ): Promise<DbModel[]> {
        // search records

        // Setting default values
        if (!query.select || query.select.length === 0) {
            query.select = [...this.defaultSelect];
        }
        if (!query.orderby || query.orderby.length === 0) {
            query.orderby = [...this.defaultOrderby];
        }
        if (!query.where || Object.keys(query.where).length === 0) {
            query.where = {};
        }
        if (!query.page) {
            query.page = 1;
        }
        if (!query.size) {
            query.size = this.MAX_ITEMS_PER_PAGE;
        }

        // Because TypeOrm .getMany() is broken with pagination
        // We first fetch the ids with pagination, then we fetch the data
        // by removing the pagination
        let filterQuery: SearchQuery<Selectables, Sortables, Searchables> = {
            ...query,
            select: ["id"] as Selectables[],
        };

        // Apply auth filter if required
        if (user) {
            filterQuery = this.authGet(user, filterQuery);
        }

        // Get the ids
        const ids = (await this.buildSelectQuery(filterQuery).getRawMany()).map(
            (row) => Object.values(row)[0] // avoid naming the attribute
        );
        if (ids.length === 0) return [];

        // Fetching the records with the id in ids, no need for pagination here
        const fetchQuery = {
            select: query.select,
            where: { id: this.in(ids) },
            orderby: query.orderby,
        };
        const result = await this.buildSelectQuery(fetchQuery).getMany();
        return result;
    }

    async search(
        query: SearchQuery<Selectables, Sortables, Searchables>,
        options: Options = {} as Options
    ): Promise<Read[]> {
        query.select = [...this.defaultSelect];
        const record = (await this.getMany(query, null)) as any as Read[];
        // By selecting only Selectables, we are guarenteed to have Partial<Read>
        if (options.process) {
            return await this.postProcessBatch(record);
        }
        return record;
    }

    async userSearch(
        user: User,
        query: SearchQuery<Selectables, Sortables, Searchables>,
        options: Options = {} as Options
    ): Promise<Read[]> {
        query.select = [...this.defaultSelect];
        const record = (await this.getMany(query, user)) as any as Read[];
        // By selecting only Selectables, we are guarenteed to have Partial<Read>
        if (options.process) {
            return await this.postProcessBatch(record);
        }
        return record;
    }

    async searchPartial(
        query: SearchQuery<Selectables, Sortables, Searchables>,
        options: Options = {} as Options
    ): Promise<Partial<Read>[]> {
        const record = (await this.getMany(query, null)) as any as Read[];
        // By selecting only Selectables, we are guarenteed to have Partial<Read>
        if (options.process) {
            return await this.postProcessBatch(record);
        }
        return record;
    }

    async userSearchPartial(
        user: User,
        query: SearchQuery<Selectables, Sortables, Searchables>,
        options: Options = {} as Options
    ): Promise<Partial<Read>[]> {
        const record = (await this.getMany(query, user)) as any as Read[];
        // By selecting only Selectables, we are guarenteed to have Partial<Read>
        if (options.process) {
            return await this.postProcessBatch(record);
        }
        return record;
    }

    async paginate(
        query: SearchQuery<Selectables, Sortables, Searchables>
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
        const data = await this.searchPartial(normalized);

        // Step 4: return paginated result
        return { page, totalPages, totalCount, data };
    }

    async userPaginate(
        user: User,
        query: SearchQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        query = this.authGet(user, query);
        return await this.paginate(query);
    }
}
