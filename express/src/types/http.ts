import { MongoFilterOperation } from "./enums";

export interface PaginationData {
    page: number;
    size: number;
}

export type SortData = { [key: string]: 1 | -1 };

export interface Filter {
    op: MongoFilterOperation;
    value: any;
}

export type FilterNode = Filter | { [key: string]: FilterNode };

export type FilterData = { [key: string]: FilterNode };
