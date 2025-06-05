import { MongoFilter } from "./enums";

export interface PaginationData {
    page: number;
    size: number;
}

export type SortData = { [key: string]: 1 | -1 };

export type FilterData = { [key: string]: MongoFilter };
