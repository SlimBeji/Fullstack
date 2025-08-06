import {
    Document,
    ExclusionProjection,
    FilterQuery,
    InclusionProjection,
    Model,
    ProjectionType,
    sanitizeFilter,
    startSession,
    Types,
} from "mongoose";

import { env } from "../../config";
import {
    ApiError,
    HttpStatus,
    MongoFindQuery,
    PaginatedData,
} from "../../types";
import { UserRead } from "../schemas";

export type CrudEvent = "create" | "read" | "update" | "delete";

type CrudModel<I, D> = Model<I, {}, {}, {}, D & Document>;

export class Crud<
    DBInt, // DB Interface
    Doc extends Document, // Document Type
    Read extends object, // The Read interface
    Search extends object, // The Search interface
    Create extends object, // Creation Interface
    Post extends object, // HTTP Post Interface
    Update extends object, // Update Interface
    Put extends object, // HTTP Put Interface
> {
    // Constructor & Properties

    constructor(public model: CrudModel<DBInt, Doc>) {}

    protected defaultProjection: ExclusionProjection<DBInt> = { __v: 0 };

    public get modelName(): string {
        return this.model.modelName;
    }

    // Helpers

    public async saveDocument(doc: Doc): Promise<void> {
        const session = await startSession();
        session.startTransaction();
        await doc.save({ session });
        await session.commitTransaction();
    }

    public notFoundError(id: string | Types.ObjectId): ApiError {
        return new ApiError(
            HttpStatus.NOT_FOUND,
            `No document with id ${id} found in ${this.modelName}s`
        );
    }

    // Accessors

    public safeCheck(
        _user: UserRead,
        _doc: Doc | Post | Put,
        _event: CrudEvent
    ): void {}

    public safeFilter(
        _user: UserRead,
        query: MongoFindQuery<DBInt>
    ): MongoFindQuery<DBInt> {
        return query;
    }

    // Serialization
    public serializeDocument(document: Doc): DBInt {
        const obj = document.toObject({
            getters: true,
            versionKey: false,
            transform: (doc, ret) => {
                const { _id, ...result } = { ...ret };
                return result;
            },
        });

        if (!obj?.id) {
            delete obj.id;
        }

        return obj;
    }

    public async jsonifyBatch(
        documents: Doc[]
    ): Promise<Read[] | Partial<Read>[]> {
        return documents.map((doc) => this.serializeDocument(doc)) as
            | Read[]
            | Partial<Read>[];
    }

    public async jsonfify(raw: Doc): Promise<Read | Partial<Read>> {
        return (await this.jsonifyBatch([raw]))[0];
    }

    // Read
    public async getDocument(id: string | Types.ObjectId): Promise<Doc | null> {
        return this.model.findById(id);
    }

    public async get(id: string | Types.ObjectId): Promise<Read | null> {
        const document = await this.getDocument(id);
        if (!document) {
            return null;
        }
        const result = await this.jsonfify(document);
        return result as Read;
    }

    public async safeGet(
        user: UserRead,
        id: string | Types.ObjectId
    ): Promise<Read> {
        const document = await this.getDocument(id);
        if (!document) {
            throw this.notFoundError(id);
        }
        this.safeCheck(user, document, "read");
        const result = await this.jsonfify(document);
        return result as Read;
    }

    // Fetch

    private parseProjection(
        projection?: InclusionProjection<DBInt>
    ): ProjectionType<DBInt> {
        if (!projection) {
            return this.defaultProjection;
        }

        if (!("id" in projection)) {
            return { ...projection, _id: 0 };
        }
        return projection;
    }

    public async countDocuments(filters: FilterQuery<DBInt>): Promise<number> {
        return this.model.countDocuments(filters);
    }

    public async fetchDocuments(query: MongoFindQuery<DBInt>): Promise<Doc[]> {
        let { pagination, sort, filters } = query;
        const skip = pagination ? pagination.skip : 0;
        const size = pagination ? pagination.size : env.MAX_ITEMS_PER_PAGE;

        if (Object.keys(sort || []).length === 0) {
            sort = { createdAt: 1 };
        }
        const parsedFilters = filters || {};
        const projection = this.parseProjection(query.projection);
        const documents = await this.model
            .find(parsedFilters, projection)
            .sort(sort)
            .collation({ locale: "en", strength: 2 })
            .skip(skip)
            .limit(size)
            .exec();
        return documents;
    }

    public async fetch(
        query: MongoFindQuery<DBInt>
    ): Promise<PaginatedData<Partial<Read>>> {
        query = sanitizeFilter(query) as MongoFindQuery<DBInt>;
        const { pagination, filters } = query;
        const page = pagination ? pagination.page : 1;
        const size = pagination ? pagination.size : env.MAX_ITEMS_PER_PAGE;
        const totalCount = await this.countDocuments(filters || {});
        const totalPages = Math.ceil(totalCount / size);
        const documents = await this.fetchDocuments(query);
        const data = await this.jsonifyBatch(documents);
        return { page, totalPages, totalCount, data };
    }

    public async safeFetch(
        user: UserRead,
        query: MongoFindQuery<DBInt>
    ): Promise<PaginatedData<Partial<Read>>> {
        query = this.safeFilter(user, query);
        return this.fetch(query);
    }

    // Create

    public async createDocument(form: Create): Promise<Doc> {
        const newObj = new this.model({
            ...form,
        });
        try {
            await this.saveDocument(newObj);
            return newObj;
        } catch (err) {
            if (err instanceof Error) {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                const message = `Could not create ${this.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    public async create(post: Post): Promise<Read> {
        const doc = await this.createDocument(post as any as Create);
        const result = await this.jsonfify(doc);
        return result as Read;
    }

    public async safeCreate(user: UserRead, post: Post): Promise<Read> {
        this.safeCheck(user, post, "create");
        return this.create(post);
    }

    // Update

    public async updateDocument(obj: Doc, form: Update): Promise<Doc> {
        obj.set(form);
        try {
            await this.saveDocument(obj);
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

    public async update(obj: Doc, form: Put): Promise<Read> {
        const doc = await this.updateDocument(obj, form as any as Update);
        const result = await this.jsonfify(doc);
        return result as Read;
    }

    public async safeUpdate(
        user: UserRead,
        doc: Doc,
        form: Put
    ): Promise<Read> {
        this.safeCheck(user, doc, "read");
        this.safeCheck(user, form, "update");
        return this.update(doc, form);
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
        return this.safeUpdate(user, doc, form);
    }

    // Delete

    public async deleteCleanup(_document: Doc): Promise<void> {}

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

    public async delete(id: string | Types.ObjectId): Promise<void> {
        const doc = await this.getDocument(id);
        if (!doc) return;
        return this.deleteDocument(doc);
    }

    public async safeDelete(
        user: UserRead,
        id: string | Types.ObjectId
    ): Promise<void> {
        const doc = await this.getDocument(id);
        if (!doc) {
            throw this.notFoundError(id);
        }
        this.safeCheck(user, doc, "delete");
        return this.deleteDocument(doc);
    }
}
