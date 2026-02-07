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

    whereId(id: number): WhereUnique {
        return { id } as WhereUnique;
    }

    notFoundError(id: number): ApiError {
        return new ApiError(
            HttpStatus.NOT_FOUND,
            `No document with id ${id} found in ${this.modelName}s`
        );
    }

    // Serialization

    async postProcess<
        T extends Partial<Read> | Read | Partial<DbModel> | DbModel,
    >(raw: T): Promise<T> {
        // Override this when subclassing
        return raw;
    }

    async postProcessBatch<
        T extends Partial<Read> | Read | Partial<DbModel> | DbModel,
    >(raw: T[], batchSize = 50): Promise<T[]> {
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

    async create(data: Create, process: boolean = false): Promise<Read> {
        // Use transactions when executing pre and post hooks
        try {
            let result = (await this.model.create({
                data,
                select: this.defaultSelect,
            })) as Read;
            if (process) {
                result = await this.postProcess(result);
            }
            return result;
        } catch (err) {
            if (err instanceof Error) {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                const message = `Could not create ${this.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    async post(form: Post, process: boolean = false): Promise<Read> {
        // create from a post form
        const data = await this.handlePostForm(form);
        return await this.create(data, process);
    }

    async handlePostForm(data: Post): Promise<Create> {
        // Update this when sublcassing
        return data as any as Create;
    }

    async authCreate(_user: User, _form: Post): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userPost(
        user: User,
        form: Post,
        process: boolean = false
    ): Promise<Read> {
        // check user authoriation with respect to the data before the post
        this.authCreate(user, form);
        return this.post(form, process);
    }

    // Read

    async get(id: number, process: boolean = false): Promise<Read | null> {
        // Return null if record not found
        let result = (await this.model.findUnique({
            where: this.whereId(id),
            select: this.defaultSelect,
        })) as Read;
        if (!result) return null;
        if (process) {
            result = await this.postProcess(result);
        }
        return result as Read;
    }

    async retrieve(id: number, process: boolean = false): Promise<Read> {
        // Raise a 404 Not Found ApiError if not found
        let result = await this.get(id, process);
        if (!result) {
            throw this.notFoundError(id);
        }
        return result;
    }

    async authRead(_user: User, _data: Read): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userRetrieve(
        user: User,
        id: number,
        process: boolean = false
    ): Promise<Read> {
        const obj = await this.retrieve(id);
        this.authRead(user, obj);
        if (process) {
            const processed = await this.postProcess(obj);
            return processed as Read;
        }
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

    authSearch(_user: User, _where: Where | undefined): Where {
        throw new Error(`authSearch not implemented for ${this.modelName}`);
    }

    async count(where: Where | undefined): Promise<number> {
        // count the number of rows
        return await this.model.count({ where });
    }

    async search(
        prismaQuery: PrismaFindQuery<Select, OrderBy, Where>
    ): Promise<Partial<Read>[]> {
        // search records
        const data = await this.model.findMany(prismaQuery);
        return await this.postProcessBatch(data as any as Partial<Read>[]);
    }

    async userSearch(
        user: User,
        prismaQuery: PrismaFindQuery<Select, OrderBy, Where>
    ): Promise<Partial<Read>[]> {
        // search records accessible by the user
        prismaQuery.where = this.authSearch(user, prismaQuery.where);
        const data = await this.model.findMany(prismaQuery);
        return await this.postProcessBatch(data as any as Partial<Read>[]);
    }

    async paginate(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        // Step 1: parsing the query
        const prismaQuery = this.toPrismaFindQuery(query);

        // Step 2: counting the output
        const totalCount = await this.count(prismaQuery.where);
        const totalPages = Math.ceil(
            totalCount / (prismaQuery.take || this.MAX_ITEMS_PER_PAGE)
        );

        // Step 3: fetching results
        const data = await this.search(prismaQuery);
        return { page: query.page || 1, totalPages, totalCount, data };
    }

    async userPaginate(
        user: User,
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        // Step 1: parsing the query
        const prismaQuery = this.toPrismaFindQuery(query);
        prismaQuery.where = this.authSearch(user, prismaQuery.where);

        // Step 2: counting the output
        const totalCount = await this.count(prismaQuery.where);
        const totalPages = Math.ceil(
            totalCount / (prismaQuery.take || this.MAX_ITEMS_PER_PAGE)
        );

        // Step 3: fetching results
        const data = await this.search(prismaQuery);
        return { page: query.page || 1, totalPages, totalCount, data };
    }

    // Update

    async update(
        id: number,
        data: Update,
        process: boolean = false
    ): Promise<Read> {
        // Use transactions when executing pre and post hooks
        try {
            let result = (await this.model.update({
                where: this.whereId(id),
                data,
                select: this.defaultSelect,
            })) as Read;
            if (process) {
                return await this.postProcess(result);
            }
            return result;
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

    async put(id: number, form: Put, process: boolean = false): Promise<Read> {
        // update from a put form
        const data = await this.handlePutForm(form);
        return await this.update(id, data, process);
    }

    async authUpdate(_user: User, _id: number, _form: Put): Promise<void> {
        // Raise an ApiError if user lacks authorization
        // Must have access to the records
        // Data updates must be allowed
    }

    async userPut(
        user: User,
        id: number,
        form: Put,
        process: boolean = false
    ): Promise<Read> {
        // check user authoriation with respect to the data before the put
        this.authUpdate(user, id, form);
        return this.put(id, form, process);
    }

    // Delete

    async delete(id: number): Promise<void> {
        // delete object by id
        try {
            await this.model.delete({ where: this.whereId(id) });
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

    async authDelete(_user: User, _id: number): Promise<void> {
        // Raise an ApiError if user lacks authorization
    }

    async userDelete(user: User, id: number): Promise<void> {
        // check if user is authorized to delete the object
        this.authDelete(user, id);
        await this.delete(id);
    }
}
