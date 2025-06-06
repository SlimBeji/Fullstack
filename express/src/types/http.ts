import { MongoFilter } from "./enums";

export interface PaginationData {
    page: number;
    size: number;
    skip: number;
}

export type SortData = { [key: string]: 1 | -1 };

export type FilterData = { [key: string]: MongoFilter };

export interface FilterQuery {
    pagination: PaginationData;
    sort: SortData;
    filters: FilterData;
}

export interface PaginatedData<T> {
    page: number;
    totalPages: number;
    totalCount: number;
    data: T[];
}
