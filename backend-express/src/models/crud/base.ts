import {
    Document,
    ExclusionProjection,
    FilterQuery,
    FilterQuery as MongooseFilterQuery,
    Model,
    ProjectionType,
    sanitizeFilter,
    startSession,
    Types,
} from "mongoose";

import { env } from "@/config/env";
import { ApiError, HttpStatus } from "@/lib/express";
import {
    Filter,
    FindQuery,
    FindQueryFilters,
    PaginatedData,
    PaginationData,
} from "@/lib/types";

import { UserRead } from "../schemas";

export type SortData = { [key: string]: 1 | -1 };

export type MongoFieldFilters = { [key: string]: any };

export type MongoFieldsFilters = { [key: string]: MongoFieldFilters };

export interface MongoFindQuery<T> {
    pagination?: PaginationData;
    sort?: SortData;
    filters?: FilterQuery<T>;
    projection?: ProjectionType<T>;
}

export type CrudEvent = "create" | "read" | "update" | "delete";

type CrudModel<I, D> = Model<I, {}, {}, {}, D & Document>;

export class Crud<
    DBInt, // Mongoose DB Interface
    Doc extends Document, //Mongoose  Document Type
    Read extends object, // The Read interface
    Sortables extends string, // Literal of sortable fields
    Selectables extends string, // Literal of Selectable fields
    Searchables extends string, // Literal of Searchable fields
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

    public authCheck(
        _user: UserRead,
        _doc: Doc | Post | Put,
        _event: CrudEvent
    ): void {}

    public addOwnershipFilters(
        _user: UserRead,
        query: FindQuery<Selectables, Sortables, Searchables>
    ): FindQuery<Selectables, Sortables, Searchables> {
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

    public async post_process(raw: Doc): Promise<Read | Partial<Read>> {
        return this.serializeDocument(raw) as Read | Partial<Read>;
    }

    public async post_process_results(
        raw: Doc[]
    ): Promise<Read[] | Partial<Read>[]> {
        return Promise.all(raw.map((i) => this.post_process(i)));
    }

    // Read
    public async getDocument(id: string | Types.ObjectId): Promise<Doc | null> {
        return this.model.findById(id);
    }

    public async get(id: string | Types.ObjectId): Promise<Read> {
        const document = await this.getDocument(id);
        if (!document) {
            throw this.notFoundError(id);
        }
        const result = await this.post_process(document);
        return result as Read;
    }

    public async userGet(
        user: UserRead,
        id: string | Types.ObjectId
    ): Promise<Read> {
        const document = await this.getDocument(id);
        if (!document) {
            throw this.notFoundError(id);
        }
        this.authCheck(user, document, "read");
        const result = await this.post_process(document);
        return result as Read;
    }

    // Fetch

    private parseSortData(fields: Sortables[] | undefined): SortData {
        if (!fields || fields.length === 0) {
            return { createdAt: -1 };
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
        fields: Selectables[] | undefined
    ): ProjectionType<DBInt> {
        if (!fields || fields.length === 0) {
            return this.defaultProjection;
        }

        const result: ProjectionType<DBInt> = {};
        fields.forEach((item) => {
            result[item as string] = 1;
        });

        if (!("id" in result)) {
            return { ...result, _id: 0 };
        }
        return result;
    }

    private parseFilters(
        filters: FindQueryFilters<Searchables> | undefined
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
            .sort(sort || { createdAt: -1 })
            .collation({ locale: "en", strength: 2 })
            .skip(skip)
            .limit(size)
            .exec();
        return documents;
    }

    public async fetch(
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        // Step 1: Parsing the FindQuery to Mongo language
        const pagination = new PaginationData(
            query.page || 1,
            query.size || env.MAX_ITEMS_PER_PAGE
        );
        const projection = this.parseProjection(query.fields);
        const sort = this.parseSortData(query.sort);
        const filters = this.parseFilters(query.filters);
        const parsed: MongoFindQuery<DBInt> = {
            pagination,
            sort,
            filters,
            projection,
        };

        // Step 2: Counting the output
        const totalCount = await this.countDocuments(filters || {});
        const totalPages = Math.ceil(totalCount / pagination.size);

        // Fetching results and returning response
        const documents = await this.fetchDocuments(parsed);
        const data = await this.post_process_results(documents);
        return { page: pagination.page, totalPages, totalCount, data };
    }

    public async userFetch(
        user: UserRead,
        query: FindQuery<Selectables, Sortables, Searchables>
    ): Promise<PaginatedData<Partial<Read>>> {
        query = this.addOwnershipFilters(user, query);
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
        const result = await this.post_process(doc);
        return result as Read;
    }

    public async userCreate(user: UserRead, post: Post): Promise<Read> {
        this.authCheck(user, post, "create");
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
        const result = await this.post_process(doc);
        return result as Read;
    }

    public async updateById(
        id: string | Types.ObjectId,
        form: Put
    ): Promise<Read> {
        const doc = await this.getDocument(id);
        if (!doc) {
            throw this.notFoundError(id);
        }
        return this.update(doc, form);
    }

    public async userUpdate(
        user: UserRead,
        doc: Doc,
        form: Put
    ): Promise<Read> {
        this.authCheck(user, doc, "read");
        this.authCheck(user, form, "update");
        return this.update(doc, form);
    }

    public async userUpdateById(
        user: UserRead,
        id: string | Types.ObjectId,
        form: Put
    ): Promise<Read> {
        const doc = await this.getDocument(id);
        if (!doc) {
            throw this.notFoundError(id);
        }
        return this.userUpdate(user, doc, form);
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

    public async userDelete(
        user: UserRead,
        id: string | Types.ObjectId
    ): Promise<void> {
        const doc = await this.getDocument(id);
        if (!doc) {
            throw this.notFoundError(id);
        }
        this.authCheck(user, doc, "delete");
        return this.deleteDocument(doc);
    }
}
