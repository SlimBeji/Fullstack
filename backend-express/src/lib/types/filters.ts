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
    | "ilike"
    | "regex";

export type Filter = { op: FilterOperation; val: any };

export type WhereFilters<T extends string> = {
    [K in T]?: Filter[];
};

export interface FindQuery<
    Selectables extends string,
    Sortables extends string,
    Searchables extends string,
> {
    page?: number;
    size?: number;
    orderby?: Sortables[];
    select?: Selectables[];
    where?: WhereFilters<Searchables>;
}
