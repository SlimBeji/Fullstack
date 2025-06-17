import {
    Model,
    Document,
    startSession,
    RootFilterQuery,
    Types,
    sanitizeFilter,
} from "mongoose";
import {
    ApiError,
    FilterData,
    FilterQuery,
    HttpStatus,
    PaginatedData,
    ProjectionExcl,
} from "../../types";
import { env } from "../../config";
import { UserRead } from "../schemas";

type CrudModel<I, D> = Model<I, {}, {}, {}, D & Document>;

export abstract class Crud<
    DBInt, // DB Interface
    Doc extends Document, // Document Type
    Read extends object, // The Read interface
    Create extends object, // Creation Interface
    Post extends object, // HTTP Post Interface
    Update extends object, // Update Interface
    Put extends object // HTTP Put Interface
> {
    // Constructor
    constructor(public model: CrudModel<DBInt, Doc>) {}

    protected abstract defaultProjection: ProjectionExcl;

    public get modelName(): string {
        return this.model.modelName;
    }

    public notFoundError(id: String | Types.ObjectId): ApiError {
        return new ApiError(
            HttpStatus.NOT_FOUND,
            `No document with id ${id} found in ${this.modelName}s`
        );
    }

    // Accessors

    public abstract safeCheck(user: UserRead, doc: Doc | Post | Put): void;

    public abstract safeFilter(
        user: UserRead,
        filterQuery: FilterQuery
    ): FilterQuery;

    // Serialization
    public serializeDocument(document: Doc): DBInt {
        return document.toObject({
            getters: true,
            transform: (doc, ret) => {
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        });
    }

    public abstract jsonifyBatch(documents: Doc[]): Promise<Read[]>;

    public async jsonfify(raw: Doc): Promise<Read> {
        return (await this.jsonifyBatch([raw]))[0];
    }

    // Read
    public async getDocument(id: string | Types.ObjectId): Promise<Doc | null> {
        return await this.model.findById(id);
    }

    public async get(id: string | Types.ObjectId): Promise<Read | null> {
        const document = await this.getDocument(id);
        if (!document) {
            return null;
        }
        return await this.jsonfify(document);
    }

    public async safeGet(
        user: UserRead,
        id: string | Types.ObjectId
    ): Promise<Read> {
        const document = await this.getDocument(id);
        if (!document) {
            throw this.notFoundError(id);
        }
        this.safeCheck(user, document);
        return await this.jsonfify(document);
    }

    // Fetch

    public async countDocuments(filterQuery: FilterData): Promise<number> {
        return await this.model.countDocuments(
            filterQuery as RootFilterQuery<DBInt>
        );
    }

    public async fetchDocuments(filterQuery: FilterQuery): Promise<Doc[]> {
        let { pagination, sort, filters } = filterQuery;
        const skip = pagination ? pagination.skip : 0;
        const size = pagination ? pagination.size : env.MAX_ITEMS_PER_PAGE;

        if (Object.keys(sort || []).length === 0) {
            sort = { createdAt: 1 };
        }
        let parsedFilters = filters as RootFilterQuery<DBInt>;
        const documents = await this.model
            .find(parsedFilters, this.defaultProjection)
            .sort(sort)
            .collation({ locale: "en", strength: 2 })
            .skip(skip)
            .limit(size)
            .exec();
        return documents;
    }

    public async fetch(filterQuery: FilterQuery): Promise<PaginatedData<Read>> {
        filterQuery = sanitizeFilter(filterQuery) as FilterQuery;
        const { pagination, filters } = filterQuery;
        const page = pagination ? pagination.page : 1;
        const size = pagination ? pagination.size : env.MAX_ITEMS_PER_PAGE;
        const totalCount = await this.countDocuments(filters || {});
        const totalPages = Math.ceil(totalCount / size);
        const documents = await this.fetchDocuments(filterQuery);
        const data = await this.jsonifyBatch(documents);
        return { page, totalPages, totalCount, data };
    }

    public async safeFetch(
        user: UserRead,
        filterQuery: FilterQuery
    ): Promise<PaginatedData<Read>> {
        filterQuery = this.safeFilter(user, filterQuery);
        return await this.fetch(filterQuery);
    }

    // Create

    public async createDocument(form: Create): Promise<Doc> {
        const newObj = new this.model({
            ...form,
        });
        try {
            const session = await startSession();
            session.startTransaction();
            await newObj.save({ session });
            await session.commitTransaction();
            return newObj;
        } catch (err) {
            if (err instanceof Error) {
                let status = HttpStatus.INTERNAL_SERVER_ERROR;
                let message = `Could not create ${this.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    public abstract create(post: Post): Promise<Read>;

    public async safeCreate(user: UserRead, post: Post): Promise<Read> {
        this.safeCheck(user, post);
        return await this.create(post);
    }

    // Update

    public async updateDocument(obj: Doc, form: Update): Promise<Doc> {
        obj.set(form);
        try {
            const session = await startSession();
            session.startTransaction();
            await obj.save({ session });
            await session.commitTransaction();
            return obj;
        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not update ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
        }
    }

    public abstract update(obj: Doc, form: Put): Promise<Read>;

    public async safeUpdate(
        user: UserRead,
        doc: Doc,
        form: Put
    ): Promise<Read> {
        this.safeCheck(user, doc);
        this.safeCheck(user, form);
        return await this.update(doc, form);
    }

    public async safeUpdateById(
        user: UserRead,
        id: string | Types.ObjectId,
        form: Put
    ): Promise<Read> {
        const doc = await this.getDocument(id);
        if (!doc) {
            throw this.notFoundError(id);
        }
        return await this.safeUpdate(user, doc, form);
    }

    // Delete

    public async deleteCleanup(document: Doc): Promise<void> {}

    public async deleteDocument(obj: Doc): Promise<void> {
        try {
            const session = await startSession();
            session.startTransaction();
            await obj.deleteOne({ session });
            await session.commitTransaction();
        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not delete ${this.modelName} object: ${err.message}!`
                );
            }
            throw err;
        }
        await this.deleteCleanup(obj);
    }

    public async safeDelete(
        user: UserRead,
        id: string | Types.ObjectId
    ): Promise<void> {
        const doc = await this.getDocument(id);
        if (!doc) {
            throw this.notFoundError(id);
        }
        this.safeCheck(user, doc);
        return await this.deleteDocument(doc);
    }
}
