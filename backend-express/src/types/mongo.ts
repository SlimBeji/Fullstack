import { PaginationData } from "./http";

export type SortData = { [key: string]: 1 | -1 };

export type FilterData = { [key: string]: MongoFilter };

export type ProjectionIncl = { [key: string]: 1 | ProjectionIncl };

export type ProjectionExcl = { [key: string]: 0 | ProjectionExcl };

export interface FilterQuery {
    pagination?: PaginationData;
    sort?: SortData;
    filters?: FilterData;
    projection?: ProjectionIncl;
}

export const MongoOperationMapping = {
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

export type MongoOperation = keyof typeof MongoOperationMapping;

export type MongoFilter = { [key in `$${MongoOperation}`]?: any };

export type MongoBaseFilter = { op: MongoOperation; val: string[] };
