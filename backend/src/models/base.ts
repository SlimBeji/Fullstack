import { FilterQuery, Model, Document, startSession } from "mongoose";
import { ApiError, HttpStatus, ErrorHandler } from "../framework";

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

    private async getById(id: string): Promise<D> {
        const raw = await this.model.findById(id);
        if (!raw) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No ${this.model.modelName} found with id ${id}`
            );
        }
        return raw;
    }

    public async get(id: string): Promise<I> {
        const raw = await this.getById(id);
        return (await this.toJson([raw]))[0];
    }

    public async search(query: FilterQuery<D>): Promise<I[]> {
        const raws = await this.model.find(query);
        if (!raws.length) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No ${this.model.modelName} found with query ${JSON.stringify(
                    query
                )}!`
            );
        }
        return await this.toJson(raws);
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
                let status = HttpStatus.INTERNAL_SERVER_ERROR;
                let message = `Could not create ${this.model.modelName} object: ${err.message}!`;
                if (errorHandler) {
                    [status, message] = errorHandler(err);
                }
                throw new ApiError(status, message);
            }
            throw err;
        }
    }

    public async update(id: string, form: U): Promise<I> {
        const raw = await this.getById(id);
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

    public async delete(id: string): Promise<void> {
        const raw = await this.getById(id);
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
}
