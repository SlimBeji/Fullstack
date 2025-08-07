import {
    Document,
    ExclusionProjection,
    FilterQuery as MongooseFilterQuery,
    Model,
    ProjectionType,
    sanitizeFilter,
    startSession,
    Types,
} from "mongoose";

import { env } from "../../config";
import {
    Filter,
    FindQueryFilters,
    MongoFieldFilters,
    MongoFieldsFilters,
    MongoFindQuery,
    PaginationData,
    SortData,
} from "../../types";
import { ApiError, FindQuery, HttpStatus, PaginatedData } from "../../types";
import { UserRead } from "../schemas";

export type CrudEvent = "create" | "read" | "update" | "delete";

type CrudModel<I, D> = Model<I, {}, {}, {}, D & Document>;

export class Crud<
    DBInt, // DB Interface
    Doc extends Document, // Document Type
    Read extends object, // The Read interface
    Filters extends object, // The Search Filters interface
    Create extends object, // Creation Interface
    Post extends object, // HTTP Post Interface
    Update extends object, // Update Interface
    Put extends object, // HTTP Put Interface
> {
    // Constructor & Properties

    constructor(public model: CrudModel<DBInt, Doc>) {}

    protected defaultProjection: ExclusionProjection<DBInt> = { __v: 0 };

    protected filterFieldsMapping: Record<string, string> = {};

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
        query: FindQuery<Filters>
    ): FindQuery<Filters> {
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

    private parseSortData(fields: string[] | undefined): SortData {
        if (!fields || fields.length === 0) {
            return { createdAt: 1 };
        }

        const result: SortData = {};
        fields.forEach((field: string) => {
            const order = field.startsWith("-") ? -1 : 1;
            if (order === -1) {
                field = field.substring(1);
            }
            result[field] = order;
        });
        return result;
    }

    private parseProjection(
        fields: string[] | undefined
    ): ProjectionType<DBInt> {
        if (!fields || fields.length === 0) {
            return this.defaultProjection;
        }

        const result: ProjectionType<DBInt> = {};
        fields.forEach((item) => {
            result[item] = 1;
        });

        if (!("id" in result)) {
            return { ...result, _id: 0 };
        }
        return result;
    }

    private parseFilters(
        filters: FindQueryFilters<Filters> | undefined
    ): MongooseFilterQuery<DBInt> {
        if (filters === undefined || Object.keys(filters).length === 0) {
            return {};
        }

        const result: MongoFieldsFilters = {};
        for (const [key, values] of Object.entries(sanitizeFilter(filters)) as [
            string,
            Filter[],
        ][]) {
            let fieldName = key === "id" ? "_id" : key;
            if (fieldName in this.filterFieldsMapping) {
                fieldName = this.filterFieldsMapping[fieldName];
            }

            const fieldFilters: MongoFieldFilters = {};
            values.forEach(({ op, val }) => {
                if (op === "text") {
                    fieldFilters[`$${op}`] = { $search: val };
                } else {
                    fieldFilters[`$${op}`] = val;
                }
            });
            result[fieldName] = fieldFilters;
        }
        return result as MongooseFilterQuery<DBInt>;
    }

    public async countDocuments(
        filters: MongooseFilterQuery<DBInt>
    ): Promise<number> {
        return this.model.countDocuments(filters);
    }

    public async fetchDocuments(
        query: MongoFindQuery<Filters>
    ): Promise<Doc[]> {
        let { pagination, sort, filters, projection } = query;
        const skip = pagination ? pagination.skip : 0;
        const size = pagination ? pagination.size : env.MAX_ITEMS_PER_PAGE;
        const documents = await this.model
            .find(filters || {}, projection || {})
            .sort(sort || { createdAt: 1 })
            .collation({ locale: "en", strength: 2 })
            .skip(skip)
            .limit(size)
            .exec();
        return documents;
    }

    public async fetch(
        query: FindQuery<Filters>
    ): Promise<PaginatedData<Partial<Read>>> {
        // Parsing the FindQuery to Mongo language
        const pagination = new PaginationData(query.page, query.size);
        const projection = this.parseProjection(query.fields);
        const sort = this.parseSortData(query.sort);
        const filters = this.parseFilters(query.filters);
        const parsed = { pagination, sort, filters, projection };

        // Counting the output
        const totalCount = await this.countDocuments(filters || {});
        const totalPages = Math.ceil(totalCount / pagination.size);

        // Fetching results and returning response
        const documents = await this.fetchDocuments(parsed);
        const data = await this.jsonifyBatch(documents);
        return { page: pagination.page, totalPages, totalCount, data };
    }

    public async safeFetch(
        user: UserRead,
        query: FindQuery<Filters>
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
