import { ApiError, HttpStatus } from "../express_";
import {
    FindQuery,
    FindQueryFilters,
    PaginatedData,
    PaginationData,
} from "../types";
import { ModelDelegate, Prisma, PrismaFindQuery } from "./types";
import { toOrderBy, toSelect, toWhere } from "./utils";

export class CrudClass<
    Delegate extends ModelDelegate<
        DbModel,
        Create,
        Update,
        Select,
        OrderBy,
        Where,
        WhereUnique
    >,
    DbModel extends object, // The Database model interface
    User extends object, // The User model used for authorization
    Create extends object, // Creation Interface
    Post extends object, // HTTP Post Interface
    Read extends object, // The Read interface
    Selectables extends string, // Literal of Selectable fields
    Select extends object, // The field selection interface
    Sortables extends string, // Literal of fields we can use OrderBy on
    OrderBy extends object, // The Ordder By clause interface
    Searchables extends string, // List of keys we can search on
    Where extends object, // The Where clause interafce
    WhereUnique extends object, // The WhereUnique for update and deletion clause interafce
    Update extends object, // Update Interface
    Put extends object, // HTTP Put Interface
> {
    // Constructor, Properties & Helpers

    MAX_ITEMS_PER_PAGE = 100;

    constructor(
        public model: Delegate,
        public modelName: string,
        public defaultSelect: Select
    ) {}

    parseId(id: number | string): number {
        // Convert the id to number or throw error
        if (typeof id === "number") return id;
        const parsed = parseInt(id, 10);
        if (isNaN(parsed)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                `Invalid ID: "${id}" is not a valid number`
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

    // Create

    async create(data: Create): Promise<Read> {
        // Use transactions when executing pre and post hooks
        try {
            return (await this.model.create({
                data,
                select: this.defaultSelect,
            })) as Read;
        } catch (err) {
            if (err instanceof Error) {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                const message = `Could not create ${this.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    async post(form: Post): Promise<Read> {
        // create from a post form
        const data = await this.handlePostForm(form);
        return await this.create(data);
    }

    async handlePostForm(data: Post): Promise<Create> {
        // Update this when sublcassing
        return data as any as Create;
    }

    async authCreate(_user: User, _form: Post): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userPost(user: User, form: Post): Promise<Read> {
        // check user authoriation with respect to the data before the post
        await this.authCreate(user, form);
        return this.post(form);
    }

    // Read

    async get(id: number | string): Promise<Read | null> {
        // Return null if record not found
        return (await this.model.findFirst({
            where: { id: this.parseId(id) } as Where,
            select: this.defaultSelect,
        })) as Read | null;
    }

    async retrieve(id: number | string): Promise<Read> {
        // Raise a 404 Not Found ApiError if not found
        const result = await this.get(id);
        if (!result) {
            throw this.notFoundError(id);
        }
        return result;
    }

    async authRead(_user: User, _data: Read): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userRetrieve(user: User, id: number | string): Promise<Read> {
        const obj = await this.retrieve(id);
        await this.authRead(user, obj);
        return obj;
    }

    // Search

    toOrderBy(fields: Sortables[]): OrderBy[] {
        // overide this method when subclassing for custom behavior
        return toOrderBy(fields, [{ createdAt: "desc" }] as OrderBy[]);
    }

    toSelect(fields: Selectables[]): Select {
        // overide this method when subclassing for custom behavior
        return toSelect(fields, this.defaultSelect);
    }

    toWhere(filters: FindQueryFilters<Searchables>): Where {
        // overide this method when subclassing for custom behavior
        return toWhere(filters);
    }

    toPrismaFindQuery(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): PrismaFindQuery<Select, OrderBy, Where> {
        // convert a query to Prisma objects
        let { page, size, sort, fields, filters } = query;
        const pagination = new PaginationData(
            page || 1,
            size || this.MAX_ITEMS_PER_PAGE
        );
        const orderBy = sort ? this.toOrderBy(sort) : undefined;
        const select = fields ? this.toSelect(fields) : undefined;
        const where = filters ? this.toWhere(filters) : undefined;
        return {
            where,
            take: pagination.size,
            skip: pagination.skip,
            orderBy,
            select,
        };
    }

    authSearch(
        _user: User,
        _query: PrismaFindQuery<Select, OrderBy, Where>
    ): PrismaFindQuery<Select, OrderBy, Where> {
        // Update the where statement to add ownership filters
        // check the select clause to see if some fields are accessible or not by the user
        throw new Error(`authSearch not implemented for ${this.modelName}`);
    }

    async count(where: Where | undefined): Promise<number> {
        // count the number of rows
        return await this.model.count({ where });
    }

    async search(
        prismaQuery: PrismaFindQuery<Select, OrderBy, Where>
    ): Promise<Partial<DbModel>[]> {
        // search records
        return await this.model.findMany(prismaQuery);
    }

    async userSearch(
        user: User,
        prismaQuery: PrismaFindQuery<Select, OrderBy, Where>
    ): Promise<Partial<DbModel>[]> {
        // search records accessible by the user
        prismaQuery = await this.authSearch(user, prismaQuery);
        return await this.model.findMany(prismaQuery);
    }

    async _paginate(
        prismaQuery: PrismaFindQuery<Select, OrderBy, Where>
    ): Promise<PaginatedData<Partial<Read>>> {
        // internal method to avoid code duplication for
        // paginate and userPaginate

        // Step 1: counting the output
        const take = prismaQuery.take || this.MAX_ITEMS_PER_PAGE;
        const skip = prismaQuery.skip || 0;
        const totalCount = await this.count(prismaQuery.where);
        const page = Math.floor(skip / take) + 1;
        const totalPages = Math.ceil(totalCount / take);

        // Step 2: normalizing the quey
        const normalized = { ...prismaQuery, take, skip };

        // Step 3: fetching results
        const data = (await this.search(normalized)) as any as Partial<Read>[];

        // Step 4: return paginated result
        return { page, totalPages, totalCount, data };
    }

    async paginate(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        // The inputs should be validated in the HTTP layer
        // The selectable fields should include only fields
        // part of the Read Schema
        const prismaQuery = this.toPrismaFindQuery(query);
        return await this._paginate(prismaQuery);
    }

    async userPaginate(
        user: User,
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        let prismaQuery = this.toPrismaFindQuery(query);
        prismaQuery = this.authSearch(user, prismaQuery);
        return await this._paginate(prismaQuery);
    }

    // Update

    async update(id: number | string, data: Update): Promise<Read> {
        // Use transactions when executing pre and post hooks
        try {
            return (await this.model.update({
                where: { id: this.parseId(id) } as WhereUnique,
                data,
                select: this.defaultSelect,
            })) as Read;
        } catch (err) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2025"
            ) {
                throw this.notFoundError(id);
            } else if (err instanceof Error) {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                const message = `Could not update ${this.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    async handlePutForm(data: Put): Promise<Update> {
        // Update this when sublcassing
        return data as any as Update;
    }

    async put(id: number | string, form: Put): Promise<Read> {
        // update from a put form
        const data = await this.handlePutForm(form);
        return await this.update(id, data);
    }

    async authUpdate(
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
        await this.authUpdate(user, id, form);
        return this.put(id, form);
    }

    // Delete

    async delete(id: number | string): Promise<void> {
        // delete object by id
        try {
            await this.model.delete({
                where: { id: this.parseId(id) } as WhereUnique,
            });
        } catch (err) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2025"
            ) {
                throw this.notFoundError(id);
            } else if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not delete ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
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
}
