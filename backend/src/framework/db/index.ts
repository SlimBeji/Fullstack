import { FilterQuery, Model, Document } from "mongoose";
import { v4 as uuid } from "uuid";
import { HttpStatus } from "../types";
import { ApiError } from "../models";

type CrudModel<I, D> = Model<I, {}, {}, {}, D & Document>;

export abstract class Crud<
    I, // Interface
    D extends Document, // Document Type
    C extends object, // Creation Form from Zod Schema
    U extends object // Updating Form from Zod Schema
> {
    constructor(public model: CrudModel<I, D>) {}

    protected abstract secrets: { [K in keyof I]?: I[K] };

    public hideSecrets = (obj: I): I => {
        return {
            ...obj,
            ...this.secrets,
        };
    };

    public toJson = (raws: D[]): I[] => {
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
    };

    private getById = async (id: string): Promise<D> => {
        const raw = await this.model.findById(id);
        if (!raw) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No place found with id ${id}`
            );
        }
        return raw;
    };

    public get = async (id: string): Promise<I> => {
        const raw = await this.getById(id);
        return this.toJson([raw])[0];
    };

    public search = async (query: FilterQuery<D>): Promise<I[]> => {
        const raws = await this.model.find(query);
        if (!raws.length) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                `No places found with query ${query}!`
            );
        }
        return this.toJson(raws);
    };

    public create = async (form: C): Promise<I> => {
        const newObj = new this.model({
            creatorId: uuid(),
            ...form,
        });
        await newObj.save();
        return this.toJson([newObj])[0];
    };

    public update = async (id: string, form: U): Promise<I> => {
        const raw = await this.getById(id);
        raw.set(form);
        await raw.save();
        return this.toJson([raw])[0];
    };

    public delete = async (id: string): Promise<void> => {
        const raw = await this.getById(id);
        await raw.deleteOne();
    };
}
