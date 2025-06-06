import { MongoFilter } from "./enums";

export interface PaginationData {
    page: number;
    size: number;
}

export class PaginationParams {
    constructor(public readonly page: number, public readonly size: number) {}
    public get skip(): number {
        return (this.page - 1) * this.size;
    }
}

export type SortData = { [key: string]: 1 | -1 };

export type FilterData = { [key: string]: MongoFilter };
