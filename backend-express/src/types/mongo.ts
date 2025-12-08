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

export type FindQueryFilters<T extends string> = { [K in T]?: Filter[] };

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
