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

export type FieldFilter = { op: FilterOperation; val: string[] };

export type MongoFilterOperation = { [key in `$${FilterOperation}`]?: any };

export type MongoFieldsFilters<T extends string = string> = {
    [key in T]?: MongoFilterOperation;
};

export interface MongoFindQuery<T> {
    pagination?: PaginationData;
    sort?: SortData;
    filters?: FilterQuery<T>;
    projection?: InclusionProjection<T>;
}
