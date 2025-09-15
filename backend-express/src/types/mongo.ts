import { FilterQuery, ProjectionType } from "mongoose";

import { PaginationData } from "./http";

//// Public Types for searching data

export type FilterOperation =
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "regex"
    | "text"
    | "exists";

export type Filter = { op: FilterOperation; val: any };

export type FindQueryFilters<T extends string> = { [K in T]?: [Filter] };

export interface FindQuery<
    Selectables extends string,
    Sortables extends string,
    Searchables extends string,
> {
    page?: number;
    size?: number;
    sort?: Sortables[];
    fields?: Selectables[];
    filters?: FindQueryFilters<Searchables>;
}

export type RawFindQuery = {
    page?: number;
    size?: number;
    sort?: string[];
    fields?: string[];
} & Record<string, { op: FilterOperation; val: string[] }[]>;

//// Internal Types for building Mongo queries

export type SortData = { [key: string]: 1 | -1 };

export type MongoFieldFilters = { [key: string]: any };

export type MongoFieldsFilters = { [key: string]: MongoFieldFilters };

export interface MongoFindQuery<T> {
    pagination?: PaginationData;
    sort?: SortData;
    filters?: FilterQuery<T>;
    projection?: ProjectionType<T>;
}
