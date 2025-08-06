import { FilterQuery, InclusionProjection } from "mongoose";

import { PaginationData } from "./http";

export type SortData = { [key: string]: 1 | -1 };

export const MongoOperationsMapping = {
    eq: "$eq",
    ne: "$ne",
    gt: "$gt",
    gte: "$gte",
    lt: "$lt",
    lte: "$lte",
    in: "$in",
    nin: "$nin",
    regex: "$regex",
    text: "$text",
} as const;

export type FilterOperation = keyof typeof MongoOperationsMapping;

export type QueryFilter = { op: FilterOperation; val: string[] };

interface BaseFilterBody {
    page?: number;
    size?: number;
    sort?: string[];
    fields?: string[];
}

export type RawFindQuery = BaseFilterBody & Record<string, QueryFilter[]>;

export interface FindQuery {
    page?: number;
    size?: number;
    sort?: string[];
    fields?: string[];
    filters?: any;
}

export type MongoFieldFilters = { [key in `$${FilterOperation}`]?: any };

export type MongoFieldsFilters = { [key: string]: MongoFieldFilters };

export interface MongoFindQuery<T> {
    pagination?: PaginationData;
    sort?: SortData;
    filters?: FilterQuery<T>;
    projection?: InclusionProjection<T>;
}
