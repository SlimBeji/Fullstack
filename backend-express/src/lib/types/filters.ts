export type FilterOperation =
    | "eq"
    | "ne"
    | "null"
    | "in"
    | "nin"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "like"
    | "ilike";

export type Filter = { op: FilterOperation; val: any };

export type WhereFilters<T extends string> = {
    [K in T]?: Filter[];
};
