import {
    DataSource,
    EntityManager,
    QueryFailedError,
    Repository,
    SelectQueryBuilder,
    UpdateResult,
} from "typeorm";

import { ApiError, HttpStatus, PaginationData } from "../types";
import { Filter, PaginatedData, SearchQuery, WhereFilters } from "../types";
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
            const context = await this.beforeCreate(manager, data);
            const result = await manager.insert(
                this.repository.target,
                this.toModel(data)
            );
            const id = result.identifiers[0].id;
            await this.afterCreate(manager, id, data, context);
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

    async beforeCreate(
        _manager: EntityManager,
        _data: Create
    ): Promise<Record<string, any>> {
        // Overload this to run code before create
        return {};
    }

    async afterCreate(
        _manager: EntityManager,
        _id: number,
        _data: Create,
        _context: Record<string, any>
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

    authGet(
        _user: User,
        _query: SearchQuery<Selectables, Sortables, Searchables>
    ): SearchQuery<Selectables, Sortables, Searchables> {
        // Update the where statement to add ownership filters
        // check the select clause to see if some fields are accessible or not by the user
        throw new Error(`authGet not implemented for ${this.modelName}`);
    }

    async exists(where: WhereFilters<Searchables>): Promise<boolean> {
        // A utility function to quickly check if a record exists
        // May be useful for auth methods
        try {
            let ormQuery = this.repository.createQueryBuilder(this.tablename);
            [ormQuery] = applySelect(ormQuery, ["id"], (item) =>
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
        /* Return the DbModel if found else null
        Select all the data - while get methods allows selecting
        partial data */
        return await this.repository.findOneBy({ id: this.parseId(id) } as any);
    }

    private async getWithoutJoins(
        query: SelectQueryBuilder<DbModel>,
        where: WhereFilters<Searchables> | undefined,
        orderby: Sortables[] | undefined
    ): Promise<DbModel | null> {
        /* Since we dont have joins, we can call getOne()
        safely without risking truncating child data */

        // Apply where
        if (where && Object.keys(where).length > 0) {
            query = applyWhere(query, where, (item) => this.mapWhere(item));
        }

        // Apply orderby
        if (orderby && orderby.length > 0) {
            query = applyOrderBy(query, orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Call getOne()
        return await query.getOne();
    }

    private async getWithJoins(
        query: SelectQueryBuilder<DbModel>,
        where: WhereFilters<Searchables> | undefined,
        orderby: Sortables[] | undefined
    ): Promise<DbModel | null> {
        /* We have joins so we can't call getOne(), We call getMany() to
        make sure we fetch all child data and return first element if found*/

        // Apply where
        if (where && Object.keys(where).length > 0) {
            query = applyWhere(query, where, (item) => this.mapWhere(item));
        }

        // Apply orderby
        if (orderby && orderby.length > 0) {
            query = applyOrderBy(query, orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Call getMany()
        const results = await query.getMany();
        if (results.length > 0) {
            return results[0];
        }
        return null;
    }

    private async getInTwoSteps(
        query: SelectQueryBuilder<DbModel>,
        where: WhereFilters<Searchables> | undefined,
        orderby: Sortables[] | undefined
    ): Promise<DbModel | null> {
        /* The where clause might be slow and we want to avoid scanning
        the whole table just to get one element. We run a first getOne()
        just to get the id and then a second query to get the full data.
        The second query should be fast because we would be filtering on the id*/

        // Create a query to get the id
        let idQuery = this.repository.createQueryBuilder(this.tablename);
        idQuery.select("id");

        // Apply where
        if (where && Object.keys(where).length > 0) {
            idQuery = applyWhere(idQuery, where, (item) => this.mapWhere(item));
        }

        // Apply orderby
        if (orderby && orderby.length > 0) {
            idQuery = applyOrderBy(idQuery, orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Get the id or return null
        const idRecord = (await idQuery.getOne()) as Pick<DbModel, "id"> | null;
        if (!idRecord) {
            return null;
        }

        // Update the main query to filter on the id
        const idWhere = {
            id: this.eq(idRecord.id),
        } as WhereFilters<Searchables>;
        query = applyWhere(query, idWhere, (item) => this.mapWhere(item));

        // Call getMany
        const results = await query.getMany();
        if (results && results.length > 0) {
            return results[0];
        }
        return null;
    }

    async getOne(
        query: SearchQuery<Selectables, Sortables, Searchables>,
        twoSteps: boolean = true
    ): Promise<DbModel | null> {
        /*
        getOne() and Joins do not work well together!
        getOne() add a LIMIT 1 to the sql query which applies to
        all rows not to the number of parent record found.
        This leads to truncated children fetching

        We have 3 cases:
        - Case 1: No Joins needed: we just call getOne() and get the full data
                  -> this.getWithoutJoins()
        - Case 2: We have joins but the where clause is efficient
                  Example: filters on indexed columns with unique constraint
                  We just call getMany() and return first element or null
                  -> this.getWithJoins()
        - Case 3: We have joins and we want to avoid scanning the whole table like in Case 2.
                  We run a first query with a getOne() to get the id
                  We run a second query with a getMany() but filtering on the id obtained
                  -> this.getInTwoSteps()
        */

        // Step 1: apply select
        let hasJoins = false;
        let ormQuery = this.repository.createQueryBuilder(this.tablename);
        if (!query.select || query.select.length === 0) {
            query.select = [...this.defaultSelect];
        }
        [ormQuery, hasJoins] = applySelect(ormQuery, query.select, (item) =>
            this.mapSelect(item)
        );

        if (!hasJoins) {
            return await this.getWithoutJoins(
                ormQuery,
                query.where,
                query.orderby
            );
        }

        if (twoSteps) {
            return await this.getInTwoSteps(
                ormQuery,
                query.where,
                query.orderby
            );
        }

        return await this.getWithJoins(ormQuery, query.where, query.orderby);
    }

    async getRaw(
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

        const result = await this.getOne(query, false);
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
        const result = (await this.getRaw(id, null, null)) as any as Read;
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
        const result = (await this.getRaw(id, user, null)) as any as Read;
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
        const result = (await this.getRaw(
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
        const result = (await this.getRaw(
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

    private async getManyWithoutJoins(
        query: SelectQueryBuilder<DbModel>,
        where: WhereFilters<Searchables> | undefined,
        orderby: Sortables[] | undefined,
        size: number | undefined,
        page: number | undefined
    ): Promise<DbModel[]> {
        // We dont have joins so we do only one query

        // Apply Where
        if (where && Object.keys(where).length > 0) {
            query = applyWhere(query, where, (item) => this.mapWhere(item));
        }

        // Apply OrderBy
        if (orderby && orderby.length > 0) {
            query = applyOrderBy(query, orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Apply Take
        size = size || this.MAX_ITEMS_PER_PAGE;
        query = query.take(size);

        // Apply Skip
        if (page && page > 1) {
            const pagination = new PaginationData(page, size);
            query = query.skip(pagination.skip);
        }

        // Call getMany() and return result
        return await query.getMany();
    }

    private async getManyWithJoins(
        query: SelectQueryBuilder<DbModel>,
        where: WhereFilters<Searchables> | undefined,
        orderby: Sortables[] | undefined,
        size: number | undefined,
        page: number | undefined
    ): Promise<DbModel[]> {
        // We fetch results in 2 steps:
        // Step 1: we get the ids only - no joins
        // Step 2: we fetch the data with joins filtering on ids

        // Create idQuery
        let idQuery = this.repository.createQueryBuilder(this.tablename);
        idQuery.select("id");

        // Apply Where
        if (where && Object.keys(where).length > 0) {
            idQuery = applyWhere(idQuery, where, (item) => this.mapWhere(item));
        }

        // Apply OrderBy
        if (orderby && orderby.length > 0) {
            idQuery = applyOrderBy(idQuery, orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Apply Take
        size = size || this.MAX_ITEMS_PER_PAGE;
        idQuery = idQuery.take(size);

        // Apply Skip
        if (page && page > 1) {
            const pagination = new PaginationData(page, size);
            idQuery = idQuery.skip(pagination.skip);
        }

        // Call getMany() and get the list of ids
        const ids = (await idQuery.getRawMany()).map(
            (row) => Object.values(row)[0] // avoid naming the attribute
        );

        // Apply where with ids on the main query
        query = applyWhere(query, { id: this.in(ids) }, (item) =>
            this.mapWhere(item)
        );

        // Apply order by again to get the data in good order
        if (orderby && orderby.length > 0) {
            query = applyOrderBy(query, orderby, (item) =>
                this.mapOrderBy(item)
            );
        }

        // Fetch results
        return await query.getMany();
    }

    async getMany(
        query: SearchQuery<Selectables, Sortables, Searchables>,
        user: User | null
    ): Promise<DbModel[]> {
        /*
        getMany(), Joins and Pagination dont not work well together!
        the take() and skip() called with TypeOrm will applies to
        all rows not to the number of parent record found.
        This leads to truncated children fetching.

        We have 3 cases:
        - Case 1: No Joins needed: we just call getMany() and get the full data
                  -> getManyWithoutJoins()
        - Case 2: We have joins so we proceed in two steps
                  Step 1: we extract the list of ids (no joins)
                  Step 2: we fetch our data by filtering on the ids (no pagination)
                  -> getManyWithJoins()
        */

        // Step 1: apply select
        let hasJoins = false;
        let ormQuery = this.repository.createQueryBuilder(this.tablename);
        if (!query.select || query.select.length === 0) {
            query.select = [...this.defaultSelect];
        }
        [ormQuery, hasJoins] = applySelect(ormQuery, query.select, (item) =>
            this.mapSelect(item)
        );

        // Step 2: update the where clause if we have authorization
        if (user) {
            query = this.authGet(user, query);
        }

        // Step 3: dispatch the query to the appropriate method
        if (hasJoins) {
            return await this.getManyWithJoins(
                ormQuery,
                query.where,
                query.orderby,
                query.size,
                query.page
            );
        }

        return await this.getManyWithoutJoins(
            ormQuery,
            query.where,
            query.orderby,
            query.size,
            query.page
        );
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
