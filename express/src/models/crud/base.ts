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

    public async toJson(raws: D[]): Promise<I[]> {
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

    public async getById(id: string | Types.ObjectId): Promise<D> {
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
        const raw = await this.getById(id);
        return (await this.toJson([raw]))[0];
    }

    public async search(filterQuery: FilterQuery): Promise<PaginatedData<I>> {
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

        if (!raws.length) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No ${this.model.modelName} found`,
                { query: filterQuery }
            );
        }
        const data = await this.toJson(raws);
        return {
            page: pagination.page,
            totalPages: Math.ceil(total / pagination.size),
            totalCount: total,
            data,
        };
    }

    public async create(
        form: C,
        errorHandler: ErrorHandler | null = null
    ): Promise<I> {
        const newObj = new this.model({
            ...form,
        });
        try {
            const session = await startSession();
            session.startTransaction();
            await newObj.save({ session });
            await session.commitTransaction();
            return (await this.toJson([newObj]))[0];
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

    public async update(obj: I, form: U): Promise<I> {
        const raw = new this.model({ ...obj });
        raw.set(form);
        try {
            const session = await startSession();
            session.startTransaction();
            await raw.save({ session });
            await session.commitTransaction();
            return (await this.toJson([raw]))[0];
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

    public async deleteCleanup(document: D): Promise<void> {}

    public async delete(obj: I): Promise<void> {
        const raw = new this.model({ ...obj });
        try {
            const session = await startSession();
            session.startTransaction();
            await raw.deleteOne({ session });
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
        await this.deleteCleanup(raw);
    }

    public async deleteById(id: string | Types.ObjectId): Promise<void> {
        const raw = await this.get(id);
        return await this.delete(raw);
    }
}
