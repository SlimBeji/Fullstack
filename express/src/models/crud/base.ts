import {
    Model,
    Document,
    startSession,
    RootFilterQuery,
    Types,
} from "mongoose";
import {
    ApiError,
    ErrorHandler,
    FilterQuery,
    HttpStatus,
    PaginatedData,
} from "../../types";

type CrudModel<I, D> = Model<I, {}, {}, {}, D & Document>;

export abstract class Crud<
    I, // Interface
    D extends Document, // Document Type
    C extends object, // Creation Form from Zod Schema
    U extends object // Updating Form from Zod Schema
> {
    constructor(public model: CrudModel<I, D>) {}

    protected abstract secrets: { [K in keyof I]?: I[K] };

    public hideSecrets(obj: I): I {
        return {
            ...obj,
            ...this.secrets,
        };
    }

    public async jsonifyBatch(raws: D[]): Promise<I[]> {
        return raws.map((el) => {
            return this.hideSecrets(
                el.toObject({
                    getters: true,
                    transform: (doc, ret) => {
                        delete ret._id;
                        delete ret.__v;
                        return ret;
                    },
                })
            );
        });
    }

    public async jsonfify(raw: D): Promise<I> {
        return (await this.jsonifyBatch([raw]))[0];
    }

    public async getDocument(id: string | Types.ObjectId): Promise<D> {
        const raw = await this.model.findById(id);
        if (!raw) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No ${this.model.modelName} found with id ${id}`
            );
        }
        return raw;
    }

    public async get(id: string | Types.ObjectId): Promise<I> {
        const raw = await this.getDocument(id);
        return await this.jsonfify(raw);
    }

    public async searchDocuments(
        filterQuery: FilterQuery
    ): Promise<PaginatedData<D>> {
        let { pagination, sort, filters } = filterQuery;
        if (Object.keys(sort).length === 0) {
            sort = { createdAt: 1 };
        }
        let parsedFilters = filters as RootFilterQuery<I>;
        const total = await this.model.countDocuments(parsedFilters);
        const raws = await this.model
            .find(parsedFilters)
            .sort(sort)
            .collation({ locale: "en", strength: 2 })
            .skip(pagination.skip)
            .limit(pagination.size)
            .exec();

        return {
            page: pagination.page,
            totalPages: Math.ceil(total / pagination.size),
            totalCount: total,
            data: raws,
        };
    }

    public async search(filterQuery: FilterQuery): Promise<PaginatedData<I>> {
        const raw = await this.searchDocuments(filterQuery);
        const data = await this.jsonifyBatch(raw.data);
        return { ...raw, data };
    }

    public async createDocument(
        form: C,
        errorHandler: ErrorHandler | null = null
    ): Promise<D> {
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
                if (errorHandler) {
                    throw errorHandler(err);
                }
                let status = HttpStatus.INTERNAL_SERVER_ERROR;
                let message = `Could not create ${this.model.modelName} object: ${err.message}!`;
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    public async create(
        form: C,
        errorHandler: ErrorHandler | null = null
    ): Promise<I> {
        const document = await this.createDocument(form, errorHandler);
        return await this.jsonfify(document);
    }

    public async updateDocument(obj: D, form: U): Promise<D> {
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
                    `Could not update ${this.model.modelName} object: ${err.message}!`
                );
            }
            throw err;
        }
    }

    public async update(id: string | Types.ObjectId, form: U): Promise<I> {
        const doc = await this.getDocument(id);
        const updated = await this.updateDocument(doc, form);
        return this.jsonfify(updated);
    }

    public async deleteCleanup(document: D): Promise<void> {}

    public async deleteDocument(obj: D): Promise<void> {
        try {
            const session = await startSession();
            session.startTransaction();
            await obj.deleteOne({ session });
            await session.commitTransaction();
        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    `Could not delete ${this.model.modelName} object: ${err.message}!`
                );
            }
            throw err;
        }
        await this.deleteCleanup(obj);
    }

    public async delete(id: string | Types.ObjectId): Promise<void> {
        const raw = await this.getDocument(id);
        return await this.deleteDocument(raw);
    }
}
